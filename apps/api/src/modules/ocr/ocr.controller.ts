import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OcrService, ScanResult } from './ocr.service';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ScanInvoiceDto } from './dto/scan-invoice.dto';

@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly matchingService: MatchingService,
  ) {}

  @Post('scan')
  async scanInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ScanInvoiceDto,
  ): Promise<{
    scan: any;
    extracted: any;
    supplierMatches: any[];
    productMatches: Record<string, any[]>;
  }> {
    const result = await this.ocrService.scanInvoice(
      tenantId,
      user.id,
      dto.imagePath,
    );

    // Convert Map to object for JSON serialization
    const productMatchesObj: Record<string, any[]> = {};
    result.productMatches.forEach((matches, description) => {
      productMatchesObj[description] = matches;
    });

    return {
      scan: result.scan,
      extracted: result.extracted,
      supplierMatches: result.supplierMatches,
      productMatches: productMatchesObj,
    };
  }

  @Get('scans')
  async getScans(@CurrentTenant() tenantId: string) {
    return this.ocrService.getScans(tenantId);
  }

  @Get('scans/:id')
  async getScan(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.ocrService.getScan(tenantId, id);
  }

  @Delete('scans/:id')
  async deleteScan(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.ocrService.deleteScan(tenantId, id);
    return { message: 'Scan deleted successfully' };
  }

  @Post('scans/:id/complete')
  async completeScan(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { invoiceId: string },
  ) {
    return this.ocrService.updateScanStatus(tenantId, id, 'completed', body.invoiceId);
  }

  @Get('suppliers')
  async getSuppliers(@CurrentTenant() tenantId: string) {
    return this.matchingService.getAllSuppliers(tenantId);
  }

  @Get('products')
  async getProducts(@CurrentTenant() tenantId: string) {
    return this.matchingService.getAllProducts(tenantId);
  }

  @Post('match-supplier')
  async matchSupplier(
    @CurrentTenant() tenantId: string,
    @Body() body: { text: string },
  ) {
    return this.matchingService.matchSupplier(tenantId, body.text);
  }

  @Post('match-products')
  async matchProducts(
    @CurrentTenant() tenantId: string,
    @Body() body: { descriptions: string[]; supplierId?: string },
  ) {
    const matches = await this.matchingService.matchProducts(
      tenantId,
      body.descriptions,
      body.supplierId,
    );
    // Convert Map to object for JSON serialization
    const result: Record<string, any[]> = {};
    matches.forEach((productMatches, description) => {
      result[description] = productMatches;
    });
    return result;
  }

  @Post('product-alias')
  async createProductAlias(
    @CurrentTenant() tenantId: string,
    @Body() body: { productId: string; alias: string; supplierId?: string },
  ) {
    await this.matchingService.createProductAlias(
      tenantId,
      body.productId,
      body.alias,
      body.supplierId,
      'ocr',
    );
    return { success: true };
  }
}
