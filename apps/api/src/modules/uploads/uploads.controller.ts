import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UploadsService } from "./uploads.service";
import { RequireAnyPermission } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthenticatedUser } from "../auth/types/authenticated-user.type";
import { PERMISSIONS } from "../../common/constants/permissions";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@ApiTags("uploads")
@ApiBearerAuth()
@Controller({ path: "uploads", version: "1" })
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("images")
  // Shared by product-photo uploads (admin) and customer-recruitment photo
  // uploads (sales app) — those two audiences don't share a single
  // permission, so this needs "any of", not "all of".
  @RequireAnyPermission(PERMISSIONS.PRODUCTS_CREATE, PERMISSIONS.CUSTOMERS_CREATE)
  @ApiOperation({ summary: "Upload a single image (product photo or customer premises photo), returns its public URL" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_IMAGE_BYTES },
      fileFilter: (_req, file, callback) => {
        callback(null, file.mimetype.startsWith("image/"));
      },
    }),
  )
  async uploadImage(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Send an image file (max 5MB) under the \"file\" field.");
    }
    return this.uploadsService.uploadImage(user.tenantId, file);
  }
}
