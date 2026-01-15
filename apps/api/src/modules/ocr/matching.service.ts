import { Injectable, Inject } from '@nestjs/common';
import { like, or, eq, and, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { contacts, products, productAliases } from '../../database/schema';
import { SupplierMatch, ProductMatch } from '../../database/schema/ocr';

@Injectable()
export class MatchingService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Normalize text for matching - handles Arabic text normalization
   */
  normalizeText(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      // Normalize Arabic alef variations
      .replace(/[أإآ]/g, 'ا')
      // Convert Arabic-Indic numerals to Latin
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
      // Remove common prefixes/suffixes
      .replace(/^(شركة|مؤسسة|company|co\.?|corp\.?)\s*/i, '')
      .replace(/\s*(llc|ltd|inc|sarl|sal)\.?$/i, '');
  }

  /**
   * Calculate similarity score between two strings using Levenshtein distance
   */
  calculateSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeText(str1);
    const s2 = this.normalizeText(str2);

    if (s1 === s2) return 100;
    if (s1.includes(s2) || s2.includes(s1)) return 85;

    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 100;

    const distance = this.levenshteinDistance(s1, s2);
    return Math.max(0, Math.round((1 - distance / maxLen) * 100));
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Match supplier from extracted text
   */
  async matchSupplier(tenantId: string, supplierText: string): Promise<SupplierMatch[]> {
    if (!supplierText || supplierText.trim().length === 0) {
      return [];
    }

    const normalizedSearch = this.normalizeText(supplierText);

    // Get all suppliers for the tenant
    const suppliers = await this.db
      .select({
        id: contacts.id,
        name: contacts.name,
        nameAr: contacts.nameAr,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.tenantId, tenantId),
          eq(contacts.type, 'supplier'),
          isNull(contacts.deletedAt),
        ),
      );

    // Calculate similarity for each supplier
    const matches: SupplierMatch[] = suppliers
      .map((supplier) => {
        const nameScore = this.calculateSimilarity(supplierText, supplier.name);
        const nameArScore = supplier.nameAr
          ? this.calculateSimilarity(supplierText, supplier.nameAr)
          : 0;
        const confidence = Math.max(nameScore, nameArScore);

        return {
          id: supplier.id,
          name: supplier.name,
          nameAr: supplier.nameAr || undefined,
          confidence,
        };
      })
      .filter((match) => match.confidence >= 30) // Minimum 30% confidence
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Return top 5 matches

    return matches;
  }

  /**
   * Match products from extracted line items
   * First checks aliases for exact matches, then falls back to fuzzy matching
   */
  async matchProducts(
    tenantId: string,
    descriptions: string[],
    supplierId?: string,
  ): Promise<Map<string, ProductMatch[]>> {
    const result = new Map<string, ProductMatch[]>();

    if (!descriptions || descriptions.length === 0) {
      return result;
    }

    // Get all aliases for the tenant (supplier-specific first, then general)
    const aliases = await this.db
      .select({
        alias: productAliases.alias,
        normalizedAlias: productAliases.normalizedAlias,
        productId: productAliases.productId,
        supplierId: productAliases.supplierId,
        product: {
          id: products.id,
          name: products.name,
          nameAr: products.nameAr,
          sku: products.sku,
          costPrice: products.costPrice,
        },
      })
      .from(productAliases)
      .innerJoin(products, eq(productAliases.productId, products.id))
      .where(
        and(
          eq(productAliases.tenantId, tenantId),
          isNull(products.deletedAt),
        ),
      );

    // Get all products for the tenant (for fuzzy matching fallback)
    const productsList = await this.db
      .select({
        id: products.id,
        name: products.name,
        nameAr: products.nameAr,
        sku: products.sku,
        costPrice: products.costPrice,
      })
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt),
        ),
      );

    // Match each description
    for (const description of descriptions) {
      const normalizedDesc = this.normalizeText(description);
      const matches: ProductMatch[] = [];

      // First, check for exact alias matches (prioritize supplier-specific)
      const supplierAliasMatch = aliases.find(
        (a) => a.normalizedAlias === normalizedDesc && a.supplierId === supplierId,
      );
      const generalAliasMatch = aliases.find(
        (a) => a.normalizedAlias === normalizedDesc && !a.supplierId,
      );

      const aliasMatch = supplierAliasMatch || generalAliasMatch;
      if (aliasMatch) {
        matches.push({
          id: aliasMatch.product.id,
          name: aliasMatch.product.name,
          nameAr: aliasMatch.product.nameAr || undefined,
          sku: aliasMatch.product.sku || undefined,
          costPrice: aliasMatch.product.costPrice || undefined,
          confidence: 100, // Exact alias match
        });
      }

      // Then add fuzzy matches (excluding already matched product)
      const fuzzyMatches: ProductMatch[] = productsList
        .filter((p) => !aliasMatch || p.id !== aliasMatch.product.id)
        .map((product) => {
          const nameScore = this.calculateSimilarity(description, product.name);
          const nameArScore = product.nameAr
            ? this.calculateSimilarity(description, product.nameAr)
            : 0;
          const skuScore = product.sku
            ? this.calculateSimilarity(description, product.sku)
            : 0;
          const confidence = Math.max(nameScore, nameArScore, skuScore);

          return {
            id: product.id,
            name: product.name,
            nameAr: product.nameAr || undefined,
            sku: product.sku || undefined,
            unitPrice: product.costPrice || undefined,
            confidence,
          };
        })
        .filter((match) => match.confidence >= 25) // Minimum 25% confidence
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, aliasMatch ? 2 : 3); // Return fewer if we have an alias match

      matches.push(...fuzzyMatches);
      result.set(description, matches);
    }

    return result;
  }

  /**
   * Create a product alias for OCR matching
   */
  async createProductAlias(
    tenantId: string,
    productId: string,
    alias: string,
    supplierId?: string,
    source: string = 'ocr',
  ): Promise<void> {
    const normalizedAlias = this.normalizeText(alias);

    // Check if alias already exists
    const existing = await this.db
      .select()
      .from(productAliases)
      .where(
        and(
          eq(productAliases.tenantId, tenantId),
          eq(productAliases.normalizedAlias, normalizedAlias),
          supplierId
            ? eq(productAliases.supplierId, supplierId)
            : isNull(productAliases.supplierId),
        ),
      );

    if (existing.length > 0) {
      // Update existing alias to point to new product
      await this.db
        .update(productAliases)
        .set({ productId })
        .where(eq(productAliases.id, existing[0].id));
    } else {
      // Create new alias
      await this.db.insert(productAliases).values({
        tenantId,
        productId,
        supplierId: supplierId || null,
        alias,
        normalizedAlias,
        source,
      });
    }
  }

  /**
   * Get all suppliers for dropdown
   */
  async getAllSuppliers(tenantId: string) {
    return this.db
      .select({
        id: contacts.id,
        name: contacts.name,
        nameAr: contacts.nameAr,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.tenantId, tenantId),
          eq(contacts.type, 'supplier'),
          isNull(contacts.deletedAt),
        ),
      );
  }

  /**
   * Get all products for dropdown
   */
  async getAllProducts(tenantId: string) {
    return this.db
      .select({
        id: products.id,
        name: products.name,
        nameAr: products.nameAr,
        sku: products.sku,
        costPrice: products.costPrice,
        unit: products.unit,
      })
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt),
        ),
      );
  }
}
