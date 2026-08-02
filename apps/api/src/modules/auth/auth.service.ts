import {
  BadRequestException,
  ConflictException,
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
import { SequenceService } from "../../common/sequence/sequence.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterCustomerDto } from "./dto/register-customer.dto";
import { generateOpaqueToken, hashToken } from "./utils/token.util";
import { normalizePhone } from "./utils/phone.util";
import { parseDurationToMs } from "../../common/utils/duration.util";
import { AuthenticatedUser } from "./types/authenticated-user.type";
import { PermissionCode } from "../../common/constants/permissions";
import { SystemRoleCode } from "@prisma/client";
import { LoginAudience } from "./dto/login.dto";

// Which system roles may sign in through which app. This is the actual
// security boundary between the frontends — a driver or a retailer
// authenticating successfully must still be refused a session in the admin
// app, and vice versa, even though all of them call the same /auth/login.
// A sales rep is allowed on both "admin" (unchanged, pre-existing access)
// and "sales" (their own dedicated field app) — additive, not a narrowing.
const AUDIENCE_ROLES: Record<LoginAudience, SystemRoleCode[]> = {
  admin: [
    SystemRoleCode.SUPER_ADMIN,
    SystemRoleCode.DISTRIBUTOR_MANAGER,
    SystemRoleCode.SALES_REPRESENTATIVE,
    SystemRoleCode.WAREHOUSE_EMPLOYEE,
  ],
  driver: [SystemRoleCode.DELIVERY_DRIVER],
  storefront: [SystemRoleCode.RETAILER],
  sales: [SystemRoleCode.SALES_REPRESENTATIVE],
};

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
    private readonly sequence: SequenceService,
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
    email: string | null,
    customerId: string | null,
    ip?: string,
  ): Promise<TokenPair> {
    const { roles, permissions } = await this.loadPermissions(userId);

    const accessExpiresIn = this.config.get<string>("JWT_ACCESS_EXPIRES_IN", "15m");
    const accessExpiresInSeconds = Math.floor(parseDurationToMs(accessExpiresIn) / 1000);
    const accessToken = await this.jwt.signAsync(
      { sub: userId, tenantId, email, roles, permissions, customerId },
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
    // Single distributor today: a user's email/phone is unique within its
    // tenant, and there's only one tenant, so we can resolve by identifier
    // alone. When a second distributor is switched on, this becomes a
    // tenant-scoped lookup (e.g. resolved from subdomain) instead of a
    // global one. Staff sign in with email, customers with phone — try
    // both, since this one field has to accept either.
    const normalizedPhone = normalizePhone(dto.identifier);
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: dto.identifier }, ...(normalizedPhone ? [{ phone: normalizedPhone }] : [])],
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Incorrect email/phone or password.");
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Incorrect email/phone or password.");
    }

    const userRoles = await this.prisma.userRole.findMany({ where: { userId: user.id }, include: { role: true } });
    const allowedRoles = AUDIENCE_ROLES[dto.audience];
    const canUseThisApp = userRoles.some((ur) => ur.role.code && allowedRoles.includes(ur.role.code));
    if (!canUseThisApp) {
      // Same message as a wrong password — this doesn't tell a caller
      // whether the account exists, only that it doesn't work here.
      throw new UnauthorizedException("Incorrect email/phone or password.");
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

    const tokens = await this.issueTokenPair(user.id, user.tenantId, user.email, user.customerId, ip);
    const { roles, permissions } = await this.loadPermissions(user.id);

    return {
      ...tokens,
      user: { userId: user.id, tenantId: user.tenantId, email: user.email, roles, permissions, customerId: user.customerId },
    };
  }

  // Self-service sign-up for a customer's own login — distinct from the
  // admin-side CustomersService.create, which staff use to add a customer
  // on the customer's behalf. Creates both the business record (Customer,
  // starts PENDING_APPROVAL — staff must approve before it can order) and
  // the login itself (User, ACTIVE immediately — they can sign in and
  // browse right away, ordering is what's gated on approval).
  async registerCustomer(dto: RegisterCustomerDto, ip?: string): Promise<TokenPair & { user: AuthenticatedUser }> {
    // Single tenant today — same assumption login() makes.
    const tenant = await this.prisma.tenant.findFirstOrThrow();

    // IsPhoneNumber already rejected anything unparseable, but it doesn't
    // normalize the value it validated — do that here so what's stored (and
    // later matched against at login) is always the one canonical form.
    const normalizedPhone = normalizePhone(dto.phone);
    if (!normalizedPhone) {
      throw new BadRequestException("Enter a valid Moroccan phone number (e.g. 0612345678).");
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        deletedAt: null,
        OR: [{ phone: normalizedPhone }, ...(dto.email ? [{ email: dto.email }] : [])],
      },
    });
    if (existing) {
      throw new ConflictException("An account with this phone number or email already exists.");
    }

    const retailerRole = await this.prisma.role.findFirstOrThrow({
      where: { tenantId: tenant.id, code: SystemRoleCode.RETAILER },
    });

    const code = this.sequence.formatNumber("CUST", await this.sequence.next(tenant.id, "customer"));
    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          tenantId: tenant.id,
          code,
          name: dto.businessName,
          phone: normalizedPhone,
          email: dto.email,
          status: "PENDING_APPROVAL",
          addresses: { create: [{ ...dto.address, isDefault: true }] },
        },
      });

      const createdUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: normalizedPhone,
          status: "ACTIVE",
        },
      });

      await tx.userRole.create({ data: { userId: createdUser.id, roleId: retailerRole.id } });
      return createdUser;
    });

    const tokens = await this.issueTokenPair(user.id, user.tenantId, user.email, user.customerId, ip);
    const { roles, permissions } = await this.loadPermissions(user.id);

    return {
      ...tokens,
      user: { userId: user.id, tenantId: user.tenantId, email: user.email, roles, permissions, customerId: user.customerId },
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
      stored.user.customerId,
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
    // (user.email is guaranteed set here — it's exactly what we searched by.)
    if (!user || !user.email) return;

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
      subject: "Reset your Wasla password",
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

  // Self-service "who am I" — deliberately not gated behind a permission
  // (there's nothing to authorize, you can always read your own profile).
  // The storefront uses this to show a customer their own approval status
  // without needing the staff-only customers.read permission.
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { customer: { include: { addresses: true } } },
    });
    const { roles, permissions } = await this.loadPermissions(userId);

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles,
      permissions,
      customer: user.customer
        ? {
            id: user.customer.id,
            code: user.customer.code,
            name: user.customer.name,
            status: user.customer.status,
            phone: user.customer.phone,
            email: user.customer.email,
            addresses: user.customer.addresses.map((address) => ({
              id: address.id,
              label: address.label,
              line1: address.line1,
              line2: address.line2,
              city: address.city,
              region: address.region,
              country: address.country,
              isDefault: address.isDefault,
            })),
          }
        : null,
    };
  }

  async generateTwoFactorSecret(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    const otpauthUrl = authenticator.keyuri(user.email ?? user.phone ?? user.id, "Wasla", secret);
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
