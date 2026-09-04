import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({ description: "The password currently on the account — e.g. the temporary one a sales rep set" })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: "correct-horse-battery-staple" })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
