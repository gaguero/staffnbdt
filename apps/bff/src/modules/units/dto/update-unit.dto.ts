import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUnitDto } from './create-unit.dto';

export class UpdateUnitDto extends PartialType(
  OmitType(CreateUnitDto, ['unitNumber'] as const)
) {}