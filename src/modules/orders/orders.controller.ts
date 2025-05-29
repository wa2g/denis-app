import { Controller, Get, Post, Body, Param, Request, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order } from './entities/order.entity';
import { OrderDetailsDto } from './dto/order-details.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.ORDER_MANAGER, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ 
    status: 201, 
    description: 'The order has been successfully created.',
    type: Order,
    schema: {
      example: {
        id: 'uuid',
        orderNumber: 'ORD123456',
        date: '2024-03-13T12:00:00Z',
        companyName: 'Farming Solutions Ltd',
        farmName: 'Green Acres Farm',
        farmNumber: 'F123456',
        villageName: 'Mtendere',
        contactName: 'John Doe',
        phoneNumber: '+260977123456',
        region: 'Central Province',
        pobox: 'P.O. Box 123',
        items: [{
          quantity: 2,
          description: 'Fertilizer NPK',
          unitPrice: 100,
          totalPrice: 200
        }],
        totalAmount: 1500.50,
        status: 'PENDING',
        createdAt: '2024-03-13T12:00:00Z',
        updatedAt: '2024-03-13T12:00:00Z'
      }
    }
  })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req
  ): Promise<Order> {
    console.log('Received order data:', createOrderDto); // Debug log
    console.log('User ID:', req.user?.id); // Debug log
    return await this.ordersService.create(createOrderDto, req.user?.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: 200,
    description: 'Return all orders',
    type: [Order]
  })
  async findAll(@Request() req): Promise<Order[]> {
    return await this.ordersService.findAll(req.user.id, req.user.role);
  }

  @Get(':orderNumber')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiParam({ name: 'orderNumber', description: 'Order number (e.g., ORD-2023-0001)' })
  @ApiResponse({
    status: 200,
    description: 'Return the order',
    type: Order
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @Param('orderNumber') orderNumber: string,
    @Request() req
  ): Promise<Order> {
    return await this.ordersService.findOne(orderNumber, req.user.id, req.user.role);
  }

  @Get(':orderNumber/details')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get detailed order information for approval' })
  @ApiParam({ name: 'orderNumber', description: 'Order number (e.g., ORD-2023-0001)' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed order information',
    type: OrderDetailsDto
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderDetails(
    @Param('orderNumber') orderNumber: string,
    @Request() req
  ): Promise<OrderDetailsDto> {
    return await this.ordersService.getOrderDetails(orderNumber, req.user.id, req.user.role);
  }

  @Patch(':orderNumber/status')
  @Roles(UserRole.ACCOUNTANT, UserRole.MANAGER, UserRole.CEO)
  @ApiOperation({ summary: 'Update order status (Approve/Cancel)' })
  @ApiParam({ name: 'orderNumber', description: 'Order number (e.g., ORD-2023-0001)' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    type: Order
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Invalid status transition or insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Request() req
  ): Promise<Order> {
    return await this.ordersService.updateOrderStatus(
      orderNumber,
      updateStatusDto,
      req.user.id,
      req.user.role
    );
  }
} 