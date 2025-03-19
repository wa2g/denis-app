import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from './entities/customer.entity';
import { Sale } from '../sales/entities/sale.entity';
import { ChickenOrder } from './entities/chicken-order.entity';
import { ChickenOrdersService } from './chicken-orders.service';
import { ChickenOrdersController } from './chicken-orders.controller';
import { ChickenStock } from './entities/chicken-stock.entity';
import { ChickenStockService } from './chicken-stock.service';
import { ChickenStockController } from './chicken-stock.controller';
import { ChickenTrackingEntity } from './entities/chicken-tracking.entity';
import { User } from '../users/entities/user.entity';
import { FeedOrder } from './entities/feed-order.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Sale,
      ChickenOrder,
      ChickenStock,
      ChickenTrackingEntity,
      User,
      FeedOrder,
      Order
    ]),
  ],
  controllers: [CustomersController, ChickenOrdersController, ChickenStockController],
  providers: [CustomersService, ChickenOrdersService, ChickenStockService],
  exports: [CustomersService, ChickenOrdersService, ChickenStockService]
})
export class CustomersModule {} 