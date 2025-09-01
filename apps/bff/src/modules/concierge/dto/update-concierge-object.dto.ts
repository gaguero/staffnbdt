import { PartialType } from '@nestjs/swagger';
import { CreateConciergeObjectDto } from './create-concierge-object.dto';

export class UpdateConciergeObjectDto extends PartialType(CreateConciergeObjectDto) {}


