import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import * as Minio from "minio";

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private readonly client: Minio.Client;
  private readonly bucket: string;
  // Browser-facing base URL, distinct from the internal endpoint the API
  // uses to talk to MinIO — same reason the admin app needs two different
  // API URLs (see docker-compose.yml / auth route handlers): "minio" as a
  // hostname only resolves inside the Docker network, never in a browser.
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = new URL(this.config.get<string>("S3_ENDPOINT") ?? "http://minio:9000");
    this.bucket = this.config.get<string>("S3_BUCKET") ?? "rabe7-uploads";
    this.publicUrl = (this.config.get<string>("S3_PUBLIC_URL") ?? "http://localhost:9000").replace(/\/$/, "");

    this.client = new Minio.Client({
      endPoint: endpoint.hostname,
      port: Number(endpoint.port) || (endpoint.protocol === "https:" ? 443 : 80),
      useSSL: endpoint.protocol === "https:",
      accessKey: this.config.get<string>("S3_ACCESS_KEY") ?? "",
      secretKey: this.config.get<string>("S3_SECRET_KEY") ?? "",
    });
  }

  async onModuleInit(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket).catch(() => false);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Created storage bucket "${this.bucket}".`);
    }

    // Product images are shown in public catalog pages — the bucket needs
    // anonymous GET so a plain <img src> works without signed URLs.
    await this.client.setBucketPolicy(
      this.bucket,
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      }),
    );
  }

  async uploadImage(
    tenantId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; key: string }> {
    const extension = (file.originalname.split(".").pop() ?? "bin").toLowerCase();
    const key = `products/${tenantId}/${randomUUID()}.${extension}`;

    await this.client.putObject(this.bucket, key, file.buffer, file.size, {
      "Content-Type": file.mimetype,
    });

    return { url: `${this.publicUrl}/${this.bucket}/${key}`, key };
  }
}
