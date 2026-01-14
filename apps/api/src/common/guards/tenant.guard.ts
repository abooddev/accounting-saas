import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../../types';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = request['tenantId'];
    const user = request['user'] as JwtPayload | undefined;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    if (user && user.tenantId !== tenantId) {
      throw new ForbiddenException('User does not belong to this tenant');
    }

    return true;
  }
}
