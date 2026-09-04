import { ApiProperty } from "@nestjs/swagger";
import { IsPhoneNumber, IsString, MinLength } from "class-validator";

export class ResetCustomerPasswordDto {
  // Required (even though the customer usually already has a phone on
  // file) so staff can also use this to set up a phone number for a
  // customer who never had one, in the same step as giving them a login.
  @ApiProperty({ example: "0612345678", description: "Moroccan phone number" })
  @IsPhoneNumber("MA", { message: "Enter a valid Moroccan phone number (e.g. 0612345678)." })
  phone!: string;

  @ApiProperty({ example: "correct-horse-battery-staple" })
  @IsString()
  @MinLength(8)
  password!: string;
}
