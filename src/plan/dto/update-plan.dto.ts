import { IsNumber, IsOptional, IsString } from "class-validator";

export class UpdatePlanDto {
    @IsOptional()
    @IsString()
    name?: string;
  
    @IsOptional()
    @IsNumber()
    cpu?: number;
  
    @IsOptional()
    @IsNumber()
    ram?: number;
  
    @IsOptional()
    @IsNumber()
    apps?: number;
  
    @IsOptional()
    @IsNumber()
    databases?: number;
  
    @IsOptional()
    @IsNumber()
    storageApp?: number;
  
    @IsOptional()
    @IsNumber()
    storageDB?: number;
  
    @IsOptional()
    @IsNumber()
    priceMonthly?: number;
  
    @IsOptional()
    @IsNumber()
    priceQuarterly?: number;
  
    @IsOptional()
    @IsNumber()
    trialDays?: number;
  }