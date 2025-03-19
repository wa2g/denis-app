import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockItem } from './entities/stock-item.entity';
import { StockService } from './services/stock.service';
import { StockController } from './controllers/stock.controller';
import { Order } from '../orders/entities/order.entity';
import { ChickenStock } from '../../chicken-stock/entities/chicken-stock.entity';
import { FeedOrder } from '../customers/entities/feed-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockItem, Order, ChickenStock, FeedOrder])
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService]
})
export class InventoryModule {} 