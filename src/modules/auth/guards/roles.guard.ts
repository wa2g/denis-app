import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.route.path;
    
    this.logger.debug(`Checking roles for ${method} ${path}`);
    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);
    this.logger.debug('Required roles type:', typeof requiredRoles);
    this.logger.debug('Required roles array?:', Array.isArray(requiredRoles));

    if (!requiredRoles) {
      return true;
    }

    const user = request.user;

    if (!user || !user.role) {
      this.logger.error(`No user or role found in request for ${method} ${path}`);
      this.logger.error('User object:', JSON.stringify(user));
      throw new ForbiddenException('User role not found');
    }

    this.logger.debug(`User attempting access: ${user.email} (${user.role})`);
    this.logger.debug('User role type:', typeof user.role);
    this.logger.debug('User object:', JSON.stringify(user));

    const hasRole = requiredRoles.some((role) => {
      const matches = user.role === role;
      this.logger.debug(`Checking role ${role} (${typeof role}) against user role ${user.role} (${typeof user.role}): ${matches}`);
      return matches;
    });

    if (!hasRole) {
      const errorMessage = `Access denied for ${method} ${path}. User ${user.email} with role ${user.role} does not have required permissions. Required roles: ${requiredRoles.join(', ')}`;
      this.logger.warn(errorMessage);
      throw new ForbiddenException(errorMessage);
    }

    this.logger.debug(`Access granted for ${method} ${path}`);
    return true;
  }
} 