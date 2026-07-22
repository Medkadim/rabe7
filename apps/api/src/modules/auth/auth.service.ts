import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { authenticator } from "otplib";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { LoginDto } from "./dto/login.dto";
import { generateOpaqueToken, hashToken } from "./utils/token.util";
import { parseDurationToMs } from "../../common/utils/duration.util";
import { AuthenticatedUser } from "./types/authenticated-user.type";
import { PermissionCode } from "../../common/constants/permissions";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  private async loadPermissions(userId: string): Promise<{ roles: string[]; permissions: PermissionCode[] }> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    const roles = userRoles.map((ur) => ur.role.name);
    const permissionSet = new Set<PermissionCode>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionSet.add(rolePermission.permission.code as PermissionCode);
      }
    }

    return { roles, permissions: Array.from(permissionSet) };
  }

  private async issueTokenPair(
    userId: string,
    tenantId: string,
    email: string,
    ip?: string,
  ): Promise<TokenPair> {
    const { roles, permissions } = await this.loadPermissions(userId);

    const accessExpiresIn = this.config.get<string>("JWT_ACCESS_EXPIRES_IN", "15m");
    const accessExpiresInSeconds = Math.floor(parseDurationToMs(accessExpiresIn) / 1000);
    const accessToken = await this.jwt.signAsync(
      { sub: userId, tenantId, email, roles, permissions },
      {
        secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        expiresIn: accessExpiresInSeconds,
      },
    );

    const refreshExpiresIn = this.config.get<string>("JWT_REFRESH_EXPIRES_IN", "30d");
    const refreshToken = generateOpaqueToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + parseDurationToMs(refreshExpiresIn)),
        createdByIp: ip,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresInSeconds,
    };
  }

  async login(dto: LoginDto, ip?: string): Promise<TokenPair & { user: AuthenticatedUser }> {
    // Single distributor today: a user's email is unique within its tenant,
    // and there's only one tenant, so we can resolve by email alone. When a
    // second distributor is switched on, this becomes a tenant-scoped
    // lookup (e.g. resolved from subdomain) instead of a global one.
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Incorrect email or password.");
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Incorrect email or password.");
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        throw new ForbiddenException("Two-factor code required.");
      }
      const valid = authenticator.check(dto.twoFactorCode, user.twoFactorSecret ?? "");
      if (!valid) {
        throw new UnauthorizedException("Invalid two-factor code.");
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair(user.id, user.tenantId, user.email, ip);
    const { roles, permissions } = await this.loadPermissions(user.id);

    return {
      ...tokens,
      user: { userId: user.id, tenantId: user.tenantId, email: user.email, roles, permissions },
    };
  }

  async refresh(refreshToken: string, ip?: string): Promise<TokenPair> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired. Please sign in again.");
    }

    const newTokens = await this.issueTokenPair(
      stored.user.id,
      stored.user.tenantId,
      stored.user.email,
      ip,
    );

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: hashToken(newTokens.refreshToken) },
    });

    return newTokens;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    // Always behave the same way whether or not the email exists — this
    // stops the endpoint being used to discover which emails are registered.
    if (!user) return;

    const rawToken = generateOpaqueToken();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await this.notifications.sendEmail({
      to: user.email,
      subject: "Reset your rabe7 password",
      body: `Use this code to reset your password (valid 1 hour): ${rawToken}`,
    });
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("This reset link is invalid or has expired.");
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: stored.id }, data: { usedAt: new Date() } }),
      // Reset means "I may have lost control of my account" — kill every
      // other active session, not just the password.
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async generateTwoFactorSecret(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    const otpauthUrl = authenticator.keyuri(user.email, "rabe7", secret);
    return { secret, otpauthUrl };
  }

  async enableTwoFactor(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret || !authenticator.check(code, user.twoFactorSecret)) {
      throw new UnauthorizedException("Invalid two-factor code.");
    }
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  }
}
