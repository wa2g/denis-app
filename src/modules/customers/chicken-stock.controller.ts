import { Controller, Get, Post, Body, Param, UseGuards, Patch, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiForbiddenResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { ChickenStockService } from './chicken-stock.service';
import { ChickenStock } from './entities/chicken-stock.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { ChickenType } from './enums/chicken-type.enum';
import { IsEnum, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddStockDto {
  @ApiProperty({
    description: 'Quantity to add to stock',
    example: 1000,
    minimum: 1
  })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({
    description: 'Price per box',
    example: 500.00,
    required: false
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  pricePerBox?: number;

  @ApiProperty({
    description: 'Number of chickens per box',
    example: 100,
    required: false
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  chickensPerBox?: number;

  @ApiProperty({
    description: 'Buying price per chicken',
    example: 5.00,
    required: false
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  buyingPricePerChicken?: number;

  @ApiProperty({
    description: 'Selling price per chicken',
    example: 7.00,
    required: false
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  sellingPricePerChicken?: number;
}

export class UpdatePricingDto {
  @ApiProperty({
    description: 'Price per box',
    example: 500.00
  })
  @IsNumber()
  @IsPositive()
  pricePerBox: number;

  @ApiProperty({
    description: 'Number of chickens per box',
    example: 100
  })
  @IsNumber()
  @IsPositive()
  chickensPerBox: number;

  @ApiProperty({
    description: 'Buying price per chicken',
    example: 5.00
  })
  @IsNumber()
  @IsPositive()
  buyingPricePerChicken: number;

  @ApiProperty({
    description: 'Selling price per chicken',
    example: 7.00
  })
  @IsNumber()
  @IsPositive()
  sellingPricePerChicken: number;
}

@Controller('chicken-stock')
@ApiTags('chicken-stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChickenStockController {
  private readonly logger = new Logger(ChickenStockController.name);

  constructor(private readonly chickenStockService: ChickenStockService) {}

  @Post('add/:type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER)
  @ApiOperation({ summary: 'Add stock for a specific chicken type' })
  @ApiParam({ name: 'type', enum: ChickenType, description: 'Type of chicken (SASSO or BROILER)' })
  @ApiResponse({ status: 201, description: 'Stock has been successfully added.', type: ChickenStock })
  @ApiForbiddenResponse({ description: 'Forbidden. User does not have required role.' })
  async addStock(
    @Param('type') chickenType: ChickenType,
    @Body() addStockDto: AddStockDto
  ): Promise<ChickenStock> {
    this.logger.log(`Adding stock for ${chickenType} with data: ${JSON.stringify(addStockDto)}`);
    this.logger.debug('User role check passed for adding stock');
    return this.chickenStockService.addStock(chickenType, addStockDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.CEO)
  @ApiOperation({ summary: 'Get all stock information' })
  @ApiResponse({ status: 200, description: 'Return all stock information.', type: [ChickenStock] })
  async getAllStock(): Promise<ChickenStock[]> {
    this.logger.log('Getting all stock information');
    return this.chickenStockService.getAllStock();
  }

  @Get(':type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.CEO)
  @ApiOperation({ summary: 'Get stock information for a specific chicken type' })
  @ApiParam({ name: 'type', enum: ChickenType, description: 'Type of chicken (SASSO or BROILER)' })
  @ApiResponse({ status: 200, description: 'Return stock information.', type: ChickenStock })
  async getStock(@Param('type') chickenType: ChickenType): Promise<ChickenStock> {
    this.logger.log(`Getting stock information for ${chickenType}`);
    return this.chickenStockService.getStock(chickenType);
  }

  @Patch('pricing/:type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Update pricing information for a specific chicken type' })
  @ApiParam({ name: 'type', enum: ChickenType, description: 'Type of chicken (SASSO or BROILER)' })
  @ApiResponse({ status: 200, description: 'Pricing has been successfully updated.', type: ChickenStock })
  async updatePricing(
    @Param('type') chickenType: ChickenType,
    @Body() updatePricingDto: UpdatePricingDto
  ): Promise<ChickenStock> {
    this.logger.log(`Updating pricing for ${chickenType} with data: ${JSON.stringify(updatePricingDto)}`);
    return this.chickenStockService.updatePricing(chickenType, updatePricingDto);
  }

  @Get('check/low')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.CEO)
  @ApiOperation({ summary: 'Get all stock items below minimum stock level' })
  @ApiResponse({ status: 200, description: 'Return low stock items.', type: [ChickenStock] })
  async checkLowStock(): Promise<ChickenStock[]> {
    this.logger.log('Checking for low stock items');
    return this.chickenStockService.checkLowStock();
  }

  @Patch('minimum/:type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER)
  @ApiOperation({ summary: 'Update minimum stock level for a specific chicken type' })
  @ApiParam({ name: 'type', enum: ChickenType, description: 'Type of chicken (SASSO or BROILER)' })
  @ApiResponse({ status: 200, description: 'Minimum stock level has been successfully updated.', type: ChickenStock })
  async updateMinimumStock(
    @Param('type') chickenType: ChickenType,
    @Body('minimumStock') minimumStock: number
  ): Promise<ChickenStock> {
    this.logger.log(`Updating minimum stock for ${chickenType} to ${minimumStock}`);
    return this.chickenStockService.updateMinimumStock(chickenType, minimumStock);
  }
} 