import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants';

/**
 * Public route decorator
 * Marks routes that don't require authentication
 * Security: Use sparingly, only for login, register, public APIs
 *
 * @example
 * @Public()
 * @Post('login')
 * async login(@Body() dto: LoginDto) {}
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
