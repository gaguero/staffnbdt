import { IsEnum } from 'class-validator';

export class SendPortalNotificationDto {
  @IsEnum(['email', 'sms', 'whatsapp'])
  channel!: 'email' | 'sms' | 'whatsapp';
}