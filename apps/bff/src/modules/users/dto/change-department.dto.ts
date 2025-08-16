import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeDepartmentDto {
  @ApiProperty({
    description: 'ID of the new department',
    example: 'dept123',
  })
  @IsString()
  @IsNotEmpty()
  departmentId: string;
}