import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import OpenAI from 'openai';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { ocrScans, OcrScan, ExtractedInvoice, SupplierMatch, ProductMatch } from '../../database/schema/ocr';
import { UploadService } from '../upload/upload.service';
import { MatchingService } from './matching.service';

export interface ScanResult {
  scan: OcrScan;
  extracted: ExtractedInvoice;
  supplierMatches: SupplierMatch[];
  productMatches: Map<string, ProductMatch[]>;
}

@Injectable()
export class OcrService {
  private openai: OpenAI | null = null;

  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private configService: ConfigService,
    private uploadService: UploadService,
    private matchingService: MatchingService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('OpenAI GPT-4 Vision OCR initialized');
    }
  }

  /**
   * Scan an invoice image and extract data using OpenAI GPT-4 Vision
   */
  async scanInvoice(
    tenantId: string,
    userId: string,
    imagePath: string,
  ): Promise<ScanResult> {
    if (!this.openai) {
      throw new BadRequestException('OCR service is not configured. Please set OPENAI_API_KEY in your .env file.');
    }

    if (!imagePath) {
      throw new BadRequestException('Image path is required.');
    }

    // Read image file as base64
    let imageBase64: string;
    try {
      imageBase64 = await this.uploadService.readFileAsBase64(imagePath);
    } catch (error) {
      throw new BadRequestException(`Failed to read image file: ${error.message}`);
    }
    const mimeType = this.uploadService.getMimeType(imagePath);

    // Extract invoice data using OpenAI GPT-4 Vision
    const extracted = await this.extractInvoiceData(imageBase64, mimeType);

    // Create OCR scan record
    const [scan] = await this.db
      .insert(ocrScans)
      .values({
        tenantId,
        imagePath,
        rawExtraction: extracted as any,
        status: 'pending',
        createdBy: userId,
      })
      .returning();

    // Match supplier
    const supplierMatches = await this.matchingService.matchSupplier(
      tenantId,
      extracted.supplier?.name || '',
    );

    // Update scan with best supplier match
    if (supplierMatches.length > 0 && supplierMatches[0].confidence >= 70) {
      await this.db
        .update(ocrScans)
        .set({
          matchedSupplierId: supplierMatches[0].id,
          matchedSupplierConfidence: supplierMatches[0].confidence.toString(),
        })
        .where(eq(ocrScans.id, scan.id));
    }

    // Match products
    const descriptions = extracted.items.map((item) => item.description);
    const productMatches = await this.matchingService.matchProducts(tenantId, descriptions);

    return {
      scan,
      extracted,
      supplierMatches,
      productMatches,
    };
  }

  /**
   * Extract invoice data from image using OpenAI GPT-4 Vision
   */
  private async extractInvoiceData(
    imageBase64: string,
    mimeType: string,
  ): Promise<ExtractedInvoice> {
    const prompt = `You are an expert at reading Lebanese supplier invoices. Think step by step.

STEP 1: READ AND ANALYZE COLUMN HEADERS
Read each column header name and identify its purpose:
- DESCRIPTION: Product names - look for: البيان, الصنف, المنتج, الوصف, اسم (or text content)
- QUANTITY: Number of units - look for: الكمية, العدد, ك (or small integers like 1, 2, 5)
- UNIT PRICE: Price per piece - look for: السعر, الفرد, سعر الوحدة, الافرادي
- DISCOUNT: Reduction amount - look for: الحسم, خصم, التنزيل, حسم, تخفيض
- TOTAL/VALUE: Final line amount - look for: القيمة, المجموع, الصافي, المبلغ, الاجمالي, الجملة

STEP 2: VERIFY WITH MATH
Confirm column meanings using calculations:
- quantity × price ≈ subtotal (before discount)
- subtotal - discount ≈ total (final value)
- If a column doesn't fit the math, re-analyze its meaning

STEP 3: EXTRACT ALL LINE ITEMS - DO NOT SKIP ANY ROW!
CRITICAL: Extract EVERY single row from the invoice, even if you're unsure about some values.
- If unsure about a value, use your best guess and set "uncertain": true for that item
- NEVER skip a row - missing data is worse than uncertain data

For each product row:
- Description: Extract product name. If it contains "*12" or "x20", that's piecesPerBox - remove it from name
- boxQty: The quantity column value (number of boxes ordered)
- piecesPerBox: From description multiplier (*12 means 12 pieces per box)
- quantity: boxQty × piecesPerBox (or just boxQty if no multiplier)
- unitPrice: Price per single piece
- discount: The discount value (0 if none)
- discountType: "percent" if discount ≤ 100 and prices are large, otherwise "amount"
- total: The final line value (القيمة or equivalent column)
- uncertain: true if you're not confident about this row's data, false otherwise

STEP 4: DETERMINE CURRENCY
- Prices > 1000 or "ل.ل" visible → LBP
- Otherwise → USD

Return ONLY valid JSON (no markdown, no explanation):
{
  "supplier": {"name": "", "phone": null, "address": null},
  "invoiceNumber": null,
  "date": "YYYY-MM-DD",
  "currency": "USD",
  "items": [
    {
      "description": "Product Name",
      "quantity": 30,
      "boxQty": 1,
      "piecesPerBox": 30,
      "unitPrice": 0.65,
      "discount": 0,
      "discountType": "amount",
      "total": 19.50,
      "uncertain": false
    }
  ],
  "subtotal": 0,
  "total": 0,
  "confidence": 85
}

CRITICAL: Count the rows in the invoice and make sure your output has the SAME number of items. NEVER skip rows!`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // Extract text content from response
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      console.log('OpenAI raw response:', content.substring(0, 1000));

      // Parse JSON response
      let jsonText = content.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
      }

      // Fix common JSON issues
      jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');

      let extracted: ExtractedInvoice;
      try {
        extracted = JSON.parse(jsonText) as ExtractedInvoice;
      } catch (parseError) {
        console.error('JSON parse error, raw response:', jsonText.substring(0, 500));
        throw parseError;
      }

      // Validate required fields
      if (!extracted.items || !Array.isArray(extracted.items)) {
        extracted.items = [];
      }
      if (!extracted.supplier) {
        extracted.supplier = { name: '' };
      }
      if (!extracted.currency) {
        extracted.currency = 'USD';
      }
      if (typeof extracted.confidence !== 'number') {
        extracted.confidence = 50;
      }

      return extracted;
    } catch (error) {
      console.error('OpenAI Vision extraction error:', error);
      return {
        supplier: { name: '' },
        currency: 'USD',
        items: [],
        confidence: 0,
      };
    }
  }

  /**
   * Get scan by ID
   */
  async getScan(tenantId: string, scanId: string): Promise<OcrScan | null> {
    const [scan] = await this.db
      .select()
      .from(ocrScans)
      .where(
        and(
          eq(ocrScans.id, scanId),
          eq(ocrScans.tenantId, tenantId),
        ),
      );
    return scan || null;
  }

  /**
   * Get all scans for tenant
   */
  async getScans(tenantId: string): Promise<OcrScan[]> {
    return this.db
      .select()
      .from(ocrScans)
      .where(eq(ocrScans.tenantId, tenantId))
      .orderBy(ocrScans.createdAt);
  }

  /**
   * Update scan status
   */
  async updateScanStatus(
    tenantId: string,
    scanId: string,
    status: string,
    invoiceId?: string,
  ): Promise<OcrScan> {
    const [updated] = await this.db
      .update(ocrScans)
      .set({
        status,
        invoiceId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(ocrScans.id, scanId),
          eq(ocrScans.tenantId, tenantId),
        ),
      )
      .returning();

    if (!updated) {
      throw new NotFoundException('Scan not found');
    }

    return updated;
  }

  /**
   * Delete scan
   */
  async deleteScan(tenantId: string, scanId: string): Promise<void> {
    const scan = await this.getScan(tenantId, scanId);
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }

    // Delete the image file
    try {
      await this.uploadService.deleteFile(scan.imagePath);
    } catch (e) {
      // Ignore file deletion errors
    }

    // Delete the scan record
    await this.db
      .delete(ocrScans)
      .where(
        and(
          eq(ocrScans.id, scanId),
          eq(ocrScans.tenantId, tenantId),
        ),
      );
  }
}
