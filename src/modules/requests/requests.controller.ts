import { Controller, Post, Body, Get, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { Request as RequestEntity } from './entities/request.entity';

@ApiTags('requests')
@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER)
  @ApiOperation({ 
    summary: 'Create a new request form',
    description: 'Creates a new request form with the specified details.'
  })
  @ApiBody({ type: CreateRequestDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Request form has been successfully created.',
    type: RequestEntity
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated.' })
  @ApiForbiddenResponse({ description: 'User does not have sufficient permissions.' })
  async create(@Body() createRequestDto: CreateRequestDto, @Request() req) {
    return this.requestsService.create(createRequestDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ 
    summary: 'Get all requests',
    description: 'Retrieves a list of all request forms.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all request forms.',
    type: [RequestEntity]
  })
  async findAll() {
    return this.requestsService.findAll();
  }

  @Get('pending')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ 
    summary: 'Get pending requests',
    description: 'Retrieves a list of pending request forms.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of pending request forms.',
    type: [RequestEntity]
  })
  async findPendingRequests() {
    return this.requestsService.findPendingRequests();
  }

  @Get('approved')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ 
    summary: 'Get approved requests',
    description: 'Retrieves a list of approved request forms ready for invoicing.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of approved request forms.',
    type: [RequestEntity]
  })
  async findApprovedRequests() {
    return this.requestsService.findApprovedRequests();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ 
    summary: 'Get request by ID',
    description: 'Retrieves a specific request form by its ID.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'The UUID of the request form'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'The request form has been found.',
    type: RequestEntity
  })
  @ApiNotFoundResponse({ description: 'Request form not found.' })
  async findOne(@Param('id') id: string) {
    return this.requestsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.CEO)
  @ApiOperation({ 
    summary: 'Update request status',
    description: 'Updates the status of a request form (approve/reject/mark as invoiced). Only available to ADMIN, MANAGER, ACCOUNTANT, and CEO roles.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'The UUID of the request form'
  })
  @ApiBody({ type: UpdateRequestStatusDto })
  @ApiResponse({ 
    status: 200, 
    description: 'The request status has been updated.',
    type: RequestEntity
  })
  @ApiNotFoundResponse({ description: 'Request form not found.' })
  @ApiBadRequestResponse({ description: 'Invalid status transition.' })
  @ApiForbiddenResponse({ description: 'Only ADMIN, MANAGER, and ACCOUNTANT roles can update request status.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateRequestStatusDto: UpdateRequestStatusDto,
    @Request() req
  ) {
    return this.requestsService.updateStatus(id, updateRequestStatusDto, req.user.id);
  }
} 