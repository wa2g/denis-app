import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StockService } from '../services/stock.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { StockItem } from '../entities/stock-item.entity';
import { UserRole } from '../../users/enums/user-role.enum';

class ReceiveStockDto {
  receivedQuantity: number;
  notes?: string;
}

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('pending')
  @Roles(UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  async getPendingStock(): Promise<StockItem[]> {
    return this.stockService.getPendingStock();
  }

  @Get()
  @Roles(UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  async getAllStock(): Promise<StockItem[]> {
    return this.stockService.getAllStock();
  }

  @Get('partially-received')
  @Roles(UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  async getPartiallyReceivedStock(): Promise<StockItem[]> {
    return this.stockService.getPartiallyReceivedStock();
  }

  @Get('fully-received')
  @Roles(UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  async getFullyReceivedStock(): Promise<StockItem[]> {
    return this.stockService.getFullyReceivedStock();
  }

  @Get('approved')
  @Roles(UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  async getApprovedStock(): Promise<StockItem[]> {
    return this.stockService.getApprovedStock();
  }

  @Get('order/:orderId')
  @Roles(UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT, UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  async getStockByOrder(@Param('orderId') orderId: string): Promise<StockItem[]> {
    return this.stockService.getStockByOrder(orderId);
  }

  @Post(':stockItemId/receive')
  @Roles(UserRole.ORDER_MANAGER, UserRole.ADMIN)
  async receiveStock(
    @Param('stockItemId') stockItemId: string,
    @Body() receiveStockDto: ReceiveStockDto,
    @Request() req
  ): Promise<StockItem> {
    return this.stockService.receiveStock(
      stockItemId,
      receiveStockDto.receivedQuantity,
      req.user,
      receiveStockDto.notes
    );
  }

  @Post(':stockItemId/approve')
  @Roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
  async approveStock(
    @Param('stockItemId') stockItemId: string,
    @Request() req
  ): Promise<StockItem> {
    return this.stockService.approveStock(stockItemId, req.user);
  }
} 