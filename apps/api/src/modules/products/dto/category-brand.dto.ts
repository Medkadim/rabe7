import { ApiPropertyOptional, ApiProperty, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateBrandDto {
  @ApiProperty()
  @IsString()
  name!: string;
}

export class UpdateActiveStateDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}
