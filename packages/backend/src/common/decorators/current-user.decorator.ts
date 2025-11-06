import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { USER_KEY } from '../constants';

/**
 * Current User decorator
 * Extracts authenticated user from request
 * Security: User is validated by AuthGuard before reaching this point
 *
 * @example
 * @Get('profile')
 * async getProfile(@CurrentUser() user: User) {}
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request[USER_KEY] || request.user;

    return data ? user?.[data] : user;
  },
);
