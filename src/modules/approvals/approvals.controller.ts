import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

import { CreateApprovalDto } from './dto/create-approval.dto';
import { ApprovalsService } from './approvals.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  @ApiOperation({ summary: "create approval" })
  @ApiResponse({status: 200, description: "Approval created successfully"})
  @Roles(UserRole.MANAGER, UserRole.CEO)
  create(@Request() req, @Body() createApprovalDto: CreateApprovalDto) {
    return this.approvalsService.create(createApprovalDto, req.user.id);
  }
} 