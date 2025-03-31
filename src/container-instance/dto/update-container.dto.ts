import { IsOptional, IsString } from 'class-validator';

export class UpdateContainerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;
}