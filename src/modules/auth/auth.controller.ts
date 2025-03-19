import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiProperty, ApiResponse, ApiTags, ApiParam, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '../users/enums/user-role.enum';

class LoginDto {
  @ApiProperty({
    description: 'User email address used for login',
    example: 'user@spade.co.tz',
    required: true,
  })
  username: string;

  @ApiProperty({
    description: 'User password',
    example: '********',
    required: true,
    minLength: 6,
  })
  password: string;
}

class UserRoleResponse {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.ORDER_MANAGER,
    description: 'The role assigned to the user'
  })
  role: UserRole;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User successfully logged in',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid credentials' 
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Get('roles/:userId')
  @ApiOperation({
    summary: 'Get user role',
    description: 'Retrieves the role for a specific user by their ID'
  })
  @ApiParam({
    name: 'userId',
    required: true,
    description: 'The ID of the user to get role for',
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200,
    description: 'User role retrieved successfully',
    type: UserRoleResponse
  })
  @ApiResponse({ 
    status: 404,
    description: 'User not found'
  })
  async getUserRoles(@Param('userId') userId: string) {
    return this.authService.getUserRoles(userId);
  }

  @Get('roles')
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Retrieves all available roles in the system'
  })
  @ApiResponse({ 
    status: 200,
    description: 'All roles retrieved successfully',
    schema: {
      type: 'array',
      items: {
        enum: Object.values(UserRole),
        example: Object.values(UserRole)[0]
      }
    }
  })
  async getAllRoles() {
    return this.authService.getAllRoles();
  }
} 