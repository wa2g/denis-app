import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChickenStock } from './entities/chicken-stock.entity';
import { ChickenType } from './enums/chicken-type.enum';
import { AddStockDto } from './chicken-stock.controller';
import { UpdatePricingDto } from './chicken-stock.controller';

@Injectable()
export class ChickenStockService {
  constructor(
    @InjectRepository(ChickenStock)
    private readonly chickenStockRepository: Repository<ChickenStock>,
  ) {}

  async addStock(chickenType: ChickenType, addStockDto: AddStockDto): Promise<ChickenStock> {
    let stock = await this.chickenStockRepository.findOne({
      where: { chickenType }
    });

    if (!stock) {
      // Initialize new stock record if none exists
      stock = this.chickenStockRepository.create({
        chickenType,
        currentQuantity: 0,
        totalReceived: 0,
        totalSold: 0,
        minimumStock: 100, // Default minimum stock level
        chickensPerBox: addStockDto.chickensPerBox || 100,
        pricePerBox: addStockDto.pricePerBox || 0,
        buyingPricePerChicken: addStockDto.buyingPricePerChicken || 0,
        sellingPricePerChicken: addStockDto.sellingPricePerChicken || 0,
        numberOfBoxes: Math.ceil(addStockDto.quantity / (addStockDto.chickensPerBox || 100))
      });
    }

    // Update stock quantities
    stock.currentQuantity += addStockDto.quantity;
    stock.totalReceived += addStockDto.quantity;
    stock.numberOfBoxes = Math.ceil(stock.currentQuantity / (stock.chickensPerBox || 100));

    // Update pricing information if provided
    if (addStockDto.pricePerBox) {
      stock.pricePerBox = addStockDto.pricePerBox;
    }
    if (addStockDto.chickensPerBox) {
      stock.chickensPerBox = addStockDto.chickensPerBox;
    }
    if (addStockDto.buyingPricePerChicken) {
      stock.buyingPricePerChicken = addStockDto.buyingPricePerChicken;
    }
    if (addStockDto.sellingPricePerChicken) {
      stock.sellingPricePerChicken = addStockDto.sellingPricePerChicken;
    }

    // Calculate total box value
    stock.totalBoxValue = stock.numberOfBoxes * stock.pricePerBox;

    return this.chickenStockRepository.save(stock);
  }

  async updatePricing(chickenType: ChickenType, updatePricingDto: UpdatePricingDto): Promise<ChickenStock> {
    const stock = await this.chickenStockRepository.findOne({
      where: { chickenType }
    });

    if (!stock) {
      throw new NotFoundException(`No stock found for chicken type: ${chickenType}`);
    }

    stock.pricePerBox = updatePricingDto.pricePerBox;
    stock.chickensPerBox = updatePricingDto.chickensPerBox;
    stock.buyingPricePerChicken = updatePricingDto.buyingPricePerChicken;
    stock.sellingPricePerChicken = updatePricingDto.sellingPricePerChicken;

    // Recalculate number of boxes and total value
    stock.numberOfBoxes = Math.ceil(stock.currentQuantity / stock.chickensPerBox);
    stock.totalBoxValue = stock.numberOfBoxes * stock.pricePerBox;

    return this.chickenStockRepository.save(stock);
  }

  async reduceStock(chickenType: ChickenType, quantity: number): Promise<ChickenStock> {
    const stock = await this.chickenStockRepository.findOne({
      where: { chickenType }
    });

    if (!stock) {
      throw new NotFoundException(`No stock found for chicken type: ${chickenType}`);
    }

    if (stock.currentQuantity < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${stock.currentQuantity}, Requested: ${quantity}`);
    }

    stock.currentQuantity -= quantity;
    stock.totalSold += quantity;
    stock.numberOfBoxes = Math.ceil(stock.currentQuantity / stock.chickensPerBox);
    stock.totalBoxValue = stock.numberOfBoxes * stock.pricePerBox;

    return this.chickenStockRepository.save(stock);
  }

  async getStock(chickenType: ChickenType): Promise<ChickenStock> {
    const stock = await this.chickenStockRepository.findOne({
      where: { chickenType }
    });

    if (!stock) {
      throw new NotFoundException(`No stock found for chicken type: ${chickenType}`);
    }

    return stock;
  }

  async getAllStock(): Promise<ChickenStock[]> {
    return this.chickenStockRepository.find({
      order: {
        chickenType: 'ASC'
      }
    });
  }

  async updateMinimumStock(chickenType: ChickenType, minimumStock: number): Promise<ChickenStock> {
    const stock = await this.chickenStockRepository.findOne({
      where: { chickenType }
    });

    if (!stock) {
      throw new NotFoundException(`No stock found for chicken type: ${chickenType}`);
    }

    stock.minimumStock = minimumStock;
    return this.chickenStockRepository.save(stock);
  }

  async checkLowStock(): Promise<ChickenStock[]> {
    return this.chickenStockRepository.createQueryBuilder('stock')
      .where('stock.currentQuantity <= stock.minimumStock')
      .getMany();
  }
} 