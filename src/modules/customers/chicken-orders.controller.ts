import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChickenOrdersService } from './chicken-orders.service';
import { CreateChickenOrderDto } from './dto/create-chicken-order.dto';
import { UpdateChickenOrderDto } from './dto/update-chicken-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChickenOrder } from './entities/chicken-order.entity';

@Controller('chicken-orders')
@ApiTags('chicken-orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChickenOrdersController {
  constructor(private readonly chickenOrdersService: ChickenOrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chicken order' })
  @ApiResponse({ status: 201, description: 'The chicken order has been successfully created.', type: ChickenOrder })
  create(@Body() createChickenOrderDto: CreateChickenOrderDto, @Request() req): Promise<ChickenOrder> {
    return this.chickenOrdersService.create(createChickenOrderDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all chicken orders' })
  @ApiResponse({ status: 200, description: 'Return all chicken orders.', type: [ChickenOrder] })
  findAll(@Request() req): Promise<ChickenOrder[]> {
    return this.chickenOrdersService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chicken order by id' })
  @ApiResponse({ status: 200, description: 'Return the chicken order.', type: ChickenOrder })
  findOne(@Param('id') id: string, @Request() req): Promise<ChickenOrder> {
    return this.chickenOrdersService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chicken order' })
  @ApiResponse({ status: 200, description: 'The chicken order has been successfully updated.', type: ChickenOrder })
  update(
    @Param('id') id: string,
    @Body() updateChickenOrderDto: UpdateChickenOrderDto,
    @Request() req,
  ): Promise<ChickenOrder> {
    return this.chickenOrdersService.update(id, updateChickenOrderDto, req.user.id, req.user.role);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get all chicken orders for a customer' })
  @ApiResponse({ status: 200, description: 'Return all chicken orders for the customer.', type: [ChickenOrder] })
  findByCustomer(@Param('customerId') customerId: string, @Request() req): Promise<ChickenOrder[]> {
    return this.chickenOrdersService.findByCustomer(customerId, req.user.id, req.user.role);
  }
} 