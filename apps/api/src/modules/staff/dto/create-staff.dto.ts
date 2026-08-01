import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { SystemRoleCode } from "@prisma/client";

// RETAILER is deliberately not offered here — a customer's own login is
// created through self-registration (AuthService.registerCustomer), never
// by staff picking a role off a dropdown.
export const STAFF_ROLE_CODES = [
  SystemRoleCode.SUPER_ADMIN,
  SystemRoleCode.DISTRIBUTOR_MANAGER,
  SystemRoleCode.SALES_REPRESENTATIVE,
  SystemRoleCode.WAREHOUSE_EMPLOYEE,
  SystemRoleCode.DELIVERY_DRIVER,
] as const;

export class CreateStaffDto {
  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  // Staff sign in with email, matching how the rest of the admin/driver
  // apps authenticate — see auth.service.ts's login().
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ description: "Optional, e.g. so a driver can be reached by phone" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: "correct-horse-battery-staple" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: STAFF_ROLE_CODES })
  @IsEnum(SystemRoleCode)
  roleCode!: SystemRoleCode;
}
