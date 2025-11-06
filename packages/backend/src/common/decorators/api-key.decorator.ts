import { SetMetadata } from '@nestjs/common';
import { API_KEY_REQUIRED } from '../constants';

/**
 * API Key Required decorator
 * For server-to-server or webhook endpoints
 * Security: Requires valid API key in X-API-Key header
 *
 * @example
 * @ApiKeyRequired()
 * @Post('webhook')
 * async handleWebhook(@Body() payload: any) {}
 */
export const ApiKeyRequired = () => SetMetadata(API_KEY_REQUIRED, true);
