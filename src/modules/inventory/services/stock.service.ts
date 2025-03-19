import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StockItem,
  StockType,
  StockStatus,
} from '../entities/stock-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { ChickenStock } from '../../../chicken-stock/entities/chicken-stock.entity';
import { FeedOrder } from '../../customers/entities/feed-order.entity';
import { FeedType } from '../../customers/enums/feed-type.enum';
import { ChickenType } from '../../../chicken-stock/types/chicken-type.enum';
import { FeedCompany } from '../../customers/enums/feed-company.enum';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockItem)
    private stockItemRepository: Repository<StockItem>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ChickenStock)
    private chickenStockRepository: Repository<ChickenStock>,
    @InjectRepository(FeedOrder)
    private feedOrderRepository: Repository<FeedOrder>,
  ) {}

  async createStockItemsFromOrder(order: Order): Promise<StockItem[]> {
    const stockItems: StockItem[] = [];

    for (const item of order.items) {
      const stockType = this.determineStockType(item.description);
      if (!stockType) continue; // Skip items that don't match our stock types

      const stockItem = this.stockItemRepository.create({
        type: stockType,
        status: StockStatus.PENDING,
        expectedQuantity: parseFloat(item.quantity.toString()),
        receivedQuantity: 0,
        description: item.description,
        unitPrice: parseFloat(item.unitPrice.toString()),
        order: order,
        orderId: order.id,
      });

      stockItems.push(await this.stockItemRepository.save(stockItem));
    }

    return stockItems;
  }

  private determineStockType(description: string): StockType | null {
    description = description.toLowerCase();
    if (description.includes('sasso') && description.includes('chick')) {
      return StockType.SASSO_CHICKS;
    }
    if (description.includes('broiler') && description.includes('chick')) {
      return StockType.BROILER_CHICKS;
    }
    if (description.includes('feed')) {
      return StockType.FEED;
    }
    return null;
  }

  async receiveStock(
    stockItemId: string,
    receivedQuantity: number,
    receivedBy: User,
    notes?: string,
  ): Promise<StockItem> {
    const stockItem = await this.stockItemRepository
      .createQueryBuilder('stockItem')
      .where('stockItem.id = :id', { id: stockItemId })
      .getOne();

    if (!stockItem) {
      throw new NotFoundException('Stock item not found');
    }

    const expectedQty = Number(stockItem.expectedQuantity);
    const currentReceivedQty = Number(stockItem.receivedQuantity);
    const newReceivedQty = Number(receivedQuantity);
    const totalReceivedQty = currentReceivedQty + newReceivedQty;

    if (totalReceivedQty > expectedQty) {
      throw new BadRequestException(
        `Cannot receive ${newReceivedQty} units. Total received quantity (${totalReceivedQty}) would exceed expected quantity (${expectedQty})`,
      );
    }

    stockItem.receivedQuantity = totalReceivedQty;
    stockItem.receivedBy = receivedBy;
    stockItem.receivedById = receivedBy.id;
    stockItem.receivedDate = new Date();
    stockItem.notes = notes
      ? `${stockItem.notes ? stockItem.notes + '; ' : ''}${notes}`
      : stockItem.notes;

    stockItem.status =
      totalReceivedQty === expectedQty
        ? StockStatus.FULLY_RECEIVED
        : StockStatus.PARTIALLY_RECEIVED;

    return this.stockItemRepository.save(stockItem);
  }

  async approveStock(
    stockItemId: string,
    accountant: User,
  ): Promise<StockItem> {
    const stockItem = await this.stockItemRepository
      .createQueryBuilder('stockItem')
      .where('stockItem.id = :id', { id: stockItemId })
      .getOne();

    if (!stockItem) {
      throw new NotFoundException('Stock item not found');
    }

    if (!stockItem.receivedById) {
      throw new BadRequestException(
        'Stock must be received before it can be approved',
      );
    }

    stockItem.status = StockStatus.APPROVED;
    stockItem.accountantApprovedBy = accountant;
    stockItem.accountantApprovedById = accountant.id;
    stockItem.accountantApprovedDate = new Date();

    // Handle different stock types
    if (
      stockItem.type === StockType.SASSO_CHICKS ||
      stockItem.type === StockType.BROILER_CHICKS
    ) {
      const chickenType =
        stockItem.type === StockType.SASSO_CHICKS
          ? ChickenType.SASSO
          : ChickenType.BROILER;

      // Find existing chicken stock or create new one
      let chickenStock = await this.chickenStockRepository.findOne({
        where: { chickenType },
      });

      if (!chickenStock) {
        chickenStock = this.chickenStockRepository.create({
          chickenType,
          currentQuantity: 0,
          totalReceived: 0,
          totalSold: 0,
          minimumStock: 100,
          numberOfBoxes: 0,
          chickensPerBox: 100,
          pricePerBox: parseFloat(stockItem.unitPrice.toString()) * 100,
          sellingPricePerChicken: 0,
          buyingPricePerChicken: parseFloat(stockItem.unitPrice.toString()),
          totalBoxValue: 0,
        });
      }

      // Update chicken stock quantities
      const receivedQty = parseFloat(stockItem.receivedQuantity.toString());
      chickenStock.currentQuantity = parseFloat(chickenStock.currentQuantity.toString()) + receivedQty;
      chickenStock.totalReceived = parseFloat(chickenStock.totalReceived.toString()) + receivedQty;
      chickenStock.buyingPricePerChicken = parseFloat(
        stockItem.unitPrice.toString(),
      );
      chickenStock.numberOfBoxes = Math.floor(
        parseFloat(chickenStock.currentQuantity.toString()) / parseFloat(chickenStock.chickensPerBox.toString()),
      );
      chickenStock.totalBoxValue = 
        parseFloat(chickenStock.numberOfBoxes.toString()) *
        parseFloat(chickenStock.pricePerBox.toString());

      await this.chickenStockRepository.save(chickenStock);
    } else if (stockItem.type === StockType.FEED) {
      // Create feed order record
      const feedType = this.determineFeedType(stockItem.description);
      if (!feedType) {
        throw new BadRequestException(
          `Could not determine feed type from description: ${stockItem.description}`,
        );
      }

      // Create a feed order record
      const feedOrder = this.feedOrderRepository.create({
        feedType,
        quantity: parseFloat(stockItem.receivedQuantity.toString()),
        pricePerUnit: parseFloat(stockItem.unitPrice.toString()),
        totalPrice: parseFloat(stockItem.receivedQuantity.toString()) * parseFloat(stockItem.unitPrice.toString()),
        company: this.determineFeedCompany(feedType),
      });

      await this.feedOrderRepository.save(feedOrder);
    }

    return this.stockItemRepository.save(stockItem);
  }

  private determineFeedType(description: string): FeedType | null {
    description = description.toLowerCase();
    // Map common feed descriptions to FeedType
    if (description.includes('broiler') && description.includes('starter')) {
      if (description.includes('mp')) {
        return FeedType.BROILER_STARTER_MP;
      }
      if (description.includes('mv')) {
        return FeedType.BROILER_STARTER_MV;
      }
      return FeedType.BROILER_STARTER;
    }
    if (description.includes('broiler') && description.includes('grower')) {
      if (description.includes('mp')) return FeedType.BROILER_GROWER_MP;
      if (description.includes('mv')) return FeedType.BROILER_GROWER_MV;
      return FeedType.BROILER_GROWER;
    }

    if (description.includes('broiler') && description.includes('finisher')) {
      return FeedType.BROILER_FINISHER;
    }

    if (description.includes('layer') && description.includes('starter')) {
      if (description.includes('backbone')) {
        return FeedType.BACKBONE_LAYER_STARTER;
      }
      return FeedType.LAYER_STARTER;
    }

    if (description.includes('layer') && description.includes('grower')) {
      if (description.includes('backbone')) {
        return FeedType.BACKBONE_LAYER_GROWER;
      }
      return FeedType.LAYER_GROWER;
    }

    if (description.includes('layer') && description.includes('mash')) {
      if (description.includes('backbone')) {
        return FeedType.BACKBONE_COMPLETE_LAYER_MASH;
      }
      if (description.includes('backbone')) return FeedType.BACKBONE_COMPLETE_LAYER_MASH;
      return FeedType.COMPLETE_LAYER_MASH;
    }

    if (description.includes('local') && description.includes('feed')) {
      return FeedType.LOCAL_FEED;
    }

    return null;
  }

  private determineFeedCompany(feedType: FeedType): FeedCompany {
    if (feedType.startsWith('BACKBONE_')) return FeedCompany.BACKBONE;
    if (feedType === FeedType.LOCAL_FEED) return FeedCompany.LOCAL;
    if (feedType.endsWith('_MP') || feedType.endsWith('_MV')) return FeedCompany.ARVINES;
    return FeedCompany.SILVERLAND;
  }

  async getStockByOrder(orderId: string): Promise<StockItem[]> {
    return this.stockItemRepository
      .createQueryBuilder('stockItem')
      .leftJoinAndSelect('stockItem.receivedBy', 'receivedBy')
      .leftJoinAndSelect(
        'stockItem.accountantApprovedBy',
        'accountantApprovedBy',
      )
      .leftJoinAndSelect('stockItem.order', 'order')
      .where('stockItem.order_id = :orderId', { orderId })
      .getMany();
  }

  async getPendingStock(): Promise<StockItem[]> {
    return this.stockItemRepository
      .createQueryBuilder('stockItem')
      .leftJoinAndSelect('stockItem.order', 'order')
      .where('stockItem.status = :status', { status: StockStatus.PENDING })
      .getMany();
  }

  async getPartiallyReceivedStock(): Promise<StockItem[]> {
    return this.stockItemRepository
      .createQueryBuilder('stockItem')
      .leftJoinAndSelect('stockItem.order', 'order')
      .leftJoinAndSelect('stockItem.receivedBy', 'receivedBy')
      .where('stockItem.status = :status', {
        status: StockStatus.PARTIALLY_RECEIVED,
      })
      .getMany();
  }

  async getFullyReceivedStock(): Promise<StockItem[]> {
    return this.stockItemRepository
      .createQueryBuilder('stockItem')
      .leftJoinAndSelect('stockItem.order', 'order')
      .leftJoinAndSelect('stockItem.receivedBy', 'receivedBy')
      .leftJoinAndSelect('stockItem.accountantApprovedBy', 'accountantApprovedBy')
      .where('stockItem.status = :status', {
        status: StockStatus.FULLY_RECEIVED,
      })
      .orderBy('stockItem.createdAt', 'DESC')
      .getMany();
  }

  async getApprovedStock(): Promise<StockItem[]> {
    return this.stockItemRepository
      .createQueryBuilder('stockItem')
      .leftJoinAndSelect('stockItem.order', 'order')
      .leftJoinAndSelect('stockItem.receivedBy', 'receivedBy')
      .leftJoinAndSelect('stockItem.accountantApprovedBy', 'accountantApprovedBy')
      .where('stockItem.status = :status', {
        status: StockStatus.APPROVED,
      })
      .orderBy('stockItem.createdAt', 'DESC')
      .getMany();
  }

  async getAllStock(): Promise<StockItem[]> {
    return this.stockItemRepository
      .createQueryBuilder('stockItem')
      .leftJoinAndSelect('stockItem.order', 'order')
      .leftJoinAndSelect('stockItem.receivedBy', 'receivedBy')
      .leftJoinAndSelect('stockItem.accountantApprovedBy', 'accountantApprovedBy')
      .orderBy('stockItem.createdAt', 'DESC')
      .getMany();
  }
} 