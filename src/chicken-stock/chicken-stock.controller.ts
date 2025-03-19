import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChickenStockService } from './chicken-stock.service';
import { ChickenStock } from './entities/chicken-stock.entity';
import { ChickenType } from './types/chicken-type.enum';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/guards/roles.guard';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { UserRole } from '../modules/auth/auth.types';
import { AddStockDto } from './dto/add-stock.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Controller('chicken-stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Chicken Stock')
@ApiBearerAuth()
export class ChickenStockController {
  constructor(private readonly chickenStockService: ChickenStockService) {}

  @Post('add')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER)
  @ApiOperation({ summary: 'Add stock for a specific type of chicken' })
  @ApiResponse({ status: 201, description: 'Stock added successfully', type: ChickenStock })
  async addStock(@Body() addStockDto: AddStockDto): Promise<ChickenStock> {
    return this.chickenStockService.addStock(addStockDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.CEO)
  @ApiOperation({ summary: 'Get all chicken stock' })
  @ApiResponse({ status: 200, description: 'Returns all chicken stock', type: [ChickenStock] })
  async getAllStock(): Promise<ChickenStock[]> {
    return this.chickenStockService.getAllStock();
  }

  @Get(':type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.CEO)
  @ApiOperation({ summary: 'Get stock for a specific type of chicken' })
  @ApiResponse({ status: 200, description: 'Returns stock for specified type', type: ChickenStock })
  async getStock(@Param('type') type: ChickenType): Promise<ChickenStock> {
    return this.chickenStockService.getStock(type);
  }

  @Patch(':type/minimum')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER)
  @ApiOperation({ summary: 'Update minimum stock level for a specific type of chicken' })
  @ApiResponse({ status: 200, description: 'Minimum stock updated successfully', type: ChickenStock })
  async updateMinimumStock(
    @Param('type') type: ChickenType,
    @Body('minimumStock') minimumStock: number,
  ): Promise<ChickenStock> {
    return this.chickenStockService.updateMinimumStock(type, minimumStock);
  }

  @Patch(':type/pricing')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update pricing information for a specific type of chicken' })
  @ApiResponse({ status: 200, description: 'Pricing updated successfully', type: ChickenStock })
  async updatePricing(
    @Param('type') type: ChickenType,
    @Body() updatePricingDto: UpdatePricingDto,
  ): Promise<ChickenStock> {
    return this.chickenStockService.updatePricing(type, updatePricingDto);
  }

  @Get('check/low')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.CEO)
  @ApiOperation({ summary: 'Check for low stock levels' })
  @ApiResponse({ status: 200, description: 'Returns stock items below minimum level', type: [ChickenStock] })
  async checkLowStock(): Promise<ChickenStock[]> {
    return this.chickenStockService.checkLowStock();
  }
} 