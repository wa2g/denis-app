import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChickenStock } from './entities/chicken-stock.entity';
import { ChickenType } from './types/chicken-type.enum';
import { AddStockDto } from './dto/add-stock.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';

@Injectable()
export class ChickenStockService {
  constructor(
    @InjectRepository(ChickenStock)
    private readonly chickenStockRepository: Repository<ChickenStock>,
  ) {}

  async addStock(addStockDto: AddStockDto): Promise<ChickenStock> {
    const { chickenType, quantity, ...pricingInfo } = addStockDto;
    let stock = await this.chickenStockRepository.findOne({ where: { chickenType } });

    if (!stock) {
      stock = this.chickenStockRepository.create({
        chickenType,
        currentQuantity: 0,
        totalReceived: 0,
        totalSold: 0,
      });
    }

    // Update quantities
    stock.currentQuantity += quantity;
    stock.totalReceived += quantity;

    // Update pricing information if provided
    if (pricingInfo.chickensPerBox) {
      stock.chickensPerBox = pricingInfo.chickensPerBox;
    }
    if (pricingInfo.pricePerBox) {
      stock.pricePerBox = pricingInfo.pricePerBox;
    }
    if (pricingInfo.sellingPricePerChicken) {
      stock.sellingPricePerChicken = pricingInfo.sellingPricePerChicken;
    }
    if (pricingInfo.buyingPricePerChicken) {
      stock.buyingPricePerChicken = pricingInfo.buyingPricePerChicken;
    }

    // The trigger will handle updating numberOfBoxes and totalBoxValue
    return this.chickenStockRepository.save(stock);
  }

  async getAllStock(): Promise<ChickenStock[]> {
    return this.chickenStockRepository.find();
  }

  async getStock(type: ChickenType): Promise<ChickenStock> {
    const stock = await this.chickenStockRepository.findOne({ where: { chickenType: type } });
    if (!stock) {
      throw new NotFoundException(`Stock for chicken type ${type} not found`);
    }
    return stock;
  }

  async updateMinimumStock(type: ChickenType, minimumStock: number): Promise<ChickenStock> {
    const stock = await this.getStock(type);
    stock.minimumStock = minimumStock;
    return this.chickenStockRepository.save(stock);
  }

  async updatePricing(type: ChickenType, updatePricingDto: UpdatePricingDto): Promise<ChickenStock> {
    const stock = await this.getStock(type);

    // Update pricing information
    if (updatePricingDto.chickensPerBox !== undefined) {
      stock.chickensPerBox = updatePricingDto.chickensPerBox;
    }
    if (updatePricingDto.pricePerBox !== undefined) {
      stock.pricePerBox = updatePricingDto.pricePerBox;
    }
    if (updatePricingDto.sellingPricePerChicken !== undefined) {
      stock.sellingPricePerChicken = updatePricingDto.sellingPricePerChicken;
    }
    if (updatePricingDto.buyingPricePerChicken !== undefined) {
      stock.buyingPricePerChicken = updatePricingDto.buyingPricePerChicken;
    }

    // The trigger will handle updating numberOfBoxes and totalBoxValue
    return this.chickenStockRepository.save(stock);
  }

  async reduceStock(type: ChickenType, quantity: number): Promise<ChickenStock> {
    const stock = await this.getStock(type);
    if (stock.currentQuantity < quantity) {
      throw new Error(`Insufficient stock for ${type}. Available: ${stock.currentQuantity}, Requested: ${quantity}`);
    }
    stock.currentQuantity -= quantity;
    stock.totalSold += quantity;
    return this.chickenStockRepository.save(stock);
  }

  async checkLowStock(): Promise<ChickenStock[]> {
    return this.chickenStockRepository
      .createQueryBuilder('stock')
      .where('stock.currentQuantity <= stock.minimumStock')
      .getMany();
  }
} 