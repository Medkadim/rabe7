import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { PermissionCode } from "../constants/permissions";
import { AuthenticatedUser } from "../../modules/auth/types/authenticated-user.type";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionCode[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException("You must be signed in to do this.");
    }

    const hasAll = required.every((permission) => user.permissions.includes(permission));
    if (!hasAll) {
      throw new ForbiddenException("You don't have permission to do this.");
    }

    return true;
  }
}
