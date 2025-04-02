import { IsNumber, IsString } from "class-validator";

export class CreatePlanDto {
  @IsString()
  name: string;
  @IsNumber()
  cpu: number;
  @IsNumber()
  ram: number;
  @IsNumber()
  apps: number;
  @IsNumber()
  databases: number;
  @IsNumber()
  storageApp: number;
  @IsNumber()
  storageDB: number;
  @IsNumber()
  priceMonthly: number;
  @IsNumber()
  priceQuarterly: number;
  @IsNumber()
  trialDays: number;
  @IsNumber()
  maxApps: number;
  @IsNumber()
  maxDatabases: number;
  }