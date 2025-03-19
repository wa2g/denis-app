import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query,
  Request,
  ForbiddenException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';

import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  async update(
    @Request() req,
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    // Only ADMIN, CEO, and MANAGER can update roles
    if (updateUserDto.role) {
      const requesterRole = req.user.role;
      if (![UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER].includes(requesterRole)) {
        throw new ForbiddenException('You do not have permission to update user roles');
      }
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  activateUser(@Param('id') id: string) {
    return this.usersService.updateActivationStatus(id, true);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER)
  deactivateUser(@Param('id') id: string) {
    return this.usersService.updateActivationStatus(id, false);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Endpoint for users to update their own profile
  @Patch('profile/update')
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    // Remove role and isActive from the update DTO for security
    const { role, isActive, ...allowedUpdates } = updateUserDto;
    return this.usersService.updateProfile(req.user.id, allowedUpdates);
  }
} 