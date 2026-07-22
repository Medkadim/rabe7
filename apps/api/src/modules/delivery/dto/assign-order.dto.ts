import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AssignOrderDto {
  @ApiProperty()
  @IsString()
  orderId!: string;
}
