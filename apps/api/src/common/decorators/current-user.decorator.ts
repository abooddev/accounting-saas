import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface CurrentUserPayload {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request['user'] as CurrentUserPayload;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
