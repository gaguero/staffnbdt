import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class ExecutePlaybookDto {
  @IsString()
  playbookId!: string;

  @IsString()
  trigger!: string; // e.g., 'reservation.created' | 'concierge.object.completed'

  @IsOptional()
  @IsObject()
  triggerData?: Record<string, unknown>;
}


