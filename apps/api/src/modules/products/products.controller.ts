import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductWithCategory } from '../../types';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(tenantId, dto);
  }

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('lowStock') lowStock?: string,
  ): Promise<ProductWithCategory[]> {
    return this.productsService.findAll(tenantId, {
      categoryId,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      lowStock: lowStock === 'true',
    });
  }

  @Get('barcode/:barcode')
  async findByBarcode(
    @CurrentTenant() tenantId: string,
    @Param('barcode') barcode: string,
  ): Promise<ProductWithCategory> {
    const product = await this.productsService.findByBarcode(tenantId, barcode);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ): Promise<ProductWithCategory> {
    return this.productsService.findById(tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.productsService.delete(tenantId, id);
    return { message: 'Product deleted successfully' };
  }
}
