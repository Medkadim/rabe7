import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { APP_GUARD } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // Registration order matters: global guards run in the order they're
    // provided, so JwtAuthGuard (which populates req.user) must run before
    // PermissionsGuard (which reads it). Every endpoint requires a signed-in
    // user by default — opt out per-route with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
