"use client";

import { useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/lib/use-api-query";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, uploadImage, ApiError } from "@/lib/api-client";

interface SettingsResponse {
  bannerImageUrl: string | null;
}

export default function SettingsPage() {
  const { accessToken, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasPermission("settings.manage");

  const { data, isLoading } = useApiQuery<SettingsResponse>(["settings"], "/settings");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const { url } = await uploadImage(file, accessToken);
      await apiFetch<SettingsResponse>("/settings", accessToken, {
        method: "PATCH",
        body: JSON.stringify({ bannerImageUrl: url }),
      });
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    try {
      await apiFetch<SettingsResponse>("/settings", accessToken, {
        method: "PATCH",
        body: JSON.stringify({ bannerImageUrl: "" }),
      });
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove the banner.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[19px] font-extrabold text-ink">Settings</h1>
        <p className="text-sm text-muted">Store-wide options for the customer storefront.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Home banner</CardTitle>
          <p className="mt-1 text-sm text-muted">
            The image shown at the top of the storefront's home screen. Leave unset to use the default design.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading && <p className="text-sm text-muted">Loading…</p>}

          {!isLoading && data?.bannerImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.bannerImageUrl}
              alt="Storefront banner"
              className="h-40 w-full max-w-md rounded-[14px] border border-line object-cover"
            />
          )}

          {!isLoading && !data?.bannerImageUrl && (
            <p className="text-sm text-muted">No custom banner set — the storefront is showing its default design.</p>
          )}

          {error && <p className="text-sm text-critical">{error}</p>}

          {canManage && (
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelected} disabled={isUploading} />
                <span className="inline-flex h-10 items-center justify-center rounded-[10px] bg-accent px-4 text-sm font-semibold text-white">
                  {isUploading ? "Uploading…" : data?.bannerImageUrl ? "Replace image" : "Upload image"}
                </span>
              </label>
              {data?.bannerImageUrl && (
                <Button variant="outline" onClick={() => void handleRemove()}>
                  Remove (use default)
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
