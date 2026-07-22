import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class CreateRouteDto {
  @ApiProperty({ example: "North district — Tuesday run" })
  @IsString()
  name!: string;

  @ApiProperty()
  @IsDateString()
  scheduledDate!: string;

  @ApiPropertyOptional({ description: "The driver (User) assigned to this route" })
  @IsOptional()
  @IsString()
  driverUserId?: string;
}
