import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class ReceiveReturnDto {
  @ApiProperty({ enum: ["RECEIVED", "REJECTED"] })
  @IsIn(["RECEIVED", "REJECTED"])
  status!: "RECEIVED" | "REJECTED";
}
