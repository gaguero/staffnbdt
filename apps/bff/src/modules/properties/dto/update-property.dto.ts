import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';

// Remove organizationId from update DTO since properties can't change organizations
export class UpdatePropertyDto extends PartialType(OmitType(CreatePropertyDto, ['organizationId'])) {}