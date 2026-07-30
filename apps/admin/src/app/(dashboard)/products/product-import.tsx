"use client";

import { useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Cell = string | number | null;

interface ColumnMapping {
  category: number; // -1 = not mapped
  name: number;
  unit: number;
  basePrice: number;
  costPrice: number;
}

interface ImportRow {
  name: string;
  unit: string;
  basePrice: number;
  categoryName?: string;
  costPrice?: number;
}

function columnLabel(index: number, header: Cell): string {
  const letter = String.fromCharCode(65 + index);
  const text = header !== null && header !== undefined && String(header).trim() ? String(header).trim() : null;
  return text ? `Column ${letter} — "${text}"` : `Column ${letter}`;
}

function toNumber(value: Cell): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function buildRows(rows: Cell[][], mapping: ColumnMapping): { valid: ImportRow[]; skipped: number } {
  const valid: ImportRow[] = [];
  let skipped = 0;
  for (const row of rows.slice(1)) {
    const name = mapping.name >= 0 ? String(row[mapping.name] ?? "").trim() : "";
    const unit = mapping.unit >= 0 ? String(row[mapping.unit] ?? "").trim() : "";
    const basePrice = mapping.basePrice >= 0 ? toNumber(row[mapping.basePrice]) : undefined;
    if (!name || !unit || basePrice === undefined) {
      skipped += 1;
      continue;
    }
    const categoryName = mapping.category >= 0 ? String(row[mapping.category] ?? "").trim() || undefined : undefined;
    const costPrice = mapping.costPrice >= 0 ? toNumber(row[mapping.costPrice]) : undefined;
    valid.push({ name, unit, basePrice, categoryName, costPrice });
  }
  return { valid, skipped };
}

export function ProductImport({ onClose }: { onClose: () => void }) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Cell[][] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({ category: -1, name: -1, unit: -1, basePrice: -1, costPrice: -1 });

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setParseError(null);
    setRows(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames.find(
          (n) => XLSX.utils.sheet_to_json(workbook.Sheets[n], { header: 1 }).length > 1,
        ) ?? workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null });
        const nonEmpty = raw.filter((row) => row.some((cell) => cell !== null && cell !== ""));
        if (nonEmpty.length < 2) {
          setParseError("No data rows found in this file.");
          return;
        }
        setRows(nonEmpty);

        // Normalize accents so "Désignation" and "designation" match the
        // same keyword — the source spreadsheets are French exports.
        const stripAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const header = nonEmpty[0].map((h) => stripAccents(String(h ?? "").toLowerCase()));
        const find = (keywords: string[]) => header.findIndex((h) => keywords.some((k) => h.includes(k)));
        setMapping({
          category: find(["categor"]),
          name: find(["nom", "name", "produit", "product", "designation", "libelle"]),
          unit: find(["colisage", "unit", "pack", "conditionnement"]),
          basePrice: find(["vente", "sale", "prix"]),
          costPrice: find(["achat", "cost", "cout"]),
        });
      } catch {
        setParseError("Could not read this file — make sure it's a valid .xlsx or .xls file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const { valid: previewRows, skipped } = rows ? buildRows(rows, mapping) : { valid: [], skipped: 0 };
  const isMappingComplete = mapping.name >= 0 && mapping.unit >= 0 && mapping.basePrice >= 0;

  const importMutation = useMutation({
    mutationFn: (products: ImportRow[]) =>
      apiFetch<{ imported: number; categoriesCreated: number }>("/products/bulk-import", accessToken, {
        method: "POST",
        body: JSON.stringify({ products }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "categories"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import products from Excel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!rows && (
          <>
            <p className="text-sm text-muted">
              Choose a spreadsheet (.xlsx or .xls). Products are imported without photos — add those per product
              afterward. Rows missing a name, unit, or price are skipped automatically.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            />
            {parseError && <p className="text-sm text-critical">{parseError}</p>}
          </>
        )}

        {rows && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Product name *</label>
                <Select value={mapping.name} onChange={(e) => setMapping((m) => ({ ...m, name: Number(e.target.value) }))}>
                  <option value={-1}>Not mapped</option>
                  {rows[0].map((h, i) => (
                    <option key={i} value={i}>
                      {columnLabel(i, h)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Unit / packaging *</label>
                <Select value={mapping.unit} onChange={(e) => setMapping((m) => ({ ...m, unit: Number(e.target.value) }))}>
                  <option value={-1}>Not mapped</option>
                  {rows[0].map((h, i) => (
                    <option key={i} value={i}>
                      {columnLabel(i, h)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Sale price *</label>
                <Select
                  value={mapping.basePrice}
                  onChange={(e) => setMapping((m) => ({ ...m, basePrice: Number(e.target.value) }))}
                >
                  <option value={-1}>Not mapped</option>
                  {rows[0].map((h, i) => (
                    <option key={i} value={i}>
                      {columnLabel(i, h)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Category (optional)</label>
                <Select
                  value={mapping.category}
                  onChange={(e) => setMapping((m) => ({ ...m, category: Number(e.target.value) }))}
                >
                  <option value={-1}>Not mapped</option>
                  {rows[0].map((h, i) => (
                    <option key={i} value={i}>
                      {columnLabel(i, h)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">Cost price (optional)</label>
                <Select
                  value={mapping.costPrice}
                  onChange={(e) => setMapping((m) => ({ ...m, costPrice: Number(e.target.value) }))}
                >
                  <option value={-1}>Not mapped</option>
                  {rows[0].map((h, i) => (
                    <option key={i} value={i}>
                      {columnLabel(i, h)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {isMappingComplete && (
              <>
                <div className="overflow-x-auto rounded-md border border-line">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-muted">
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Unit</th>
                        <th className="px-3 py-2 font-medium text-right">Sale price</th>
                        <th className="px-3 py-2 font-medium text-right">Cost price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 8).map((row, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          <td className="px-3 py-2 text-muted">{row.categoryName ?? "—"}</td>
                          <td className="px-3 py-2 text-ink">{row.name}</td>
                          <td className="px-3 py-2 text-muted">{row.unit}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.basePrice}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{row.costPrice ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted">
                  {previewRows.length} product{previewRows.length === 1 ? "" : "s"} ready to import
                  {skipped > 0 ? ` (${skipped} row${skipped === 1 ? "" : "s"} skipped — missing name, unit, or price)` : ""}
                  . Showing the first {Math.min(8, previewRows.length)}.
                </p>
              </>
            )}

            {importMutation.isError && (
              <p className="text-sm text-critical">
                {importMutation.error instanceof ApiError ? importMutation.error.message : "Import failed."}
              </p>
            )}
            {importMutation.isSuccess && (
              <p className="text-sm text-success">
                Imported {importMutation.data.imported} products
                {importMutation.data.categoriesCreated > 0
                  ? ` and created ${importMutation.data.categoriesCreated} new categor${importMutation.data.categoriesCreated === 1 ? "y" : "ies"}`
                  : ""}
                .
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button
                disabled={!isMappingComplete || previewRows.length === 0 || importMutation.isPending}
                onClick={() => importMutation.mutate(previewRows)}
              >
                {importMutation.isPending ? "Importing…" : `Import ${previewRows.length} products`}
              </Button>
              <Button variant="outline" onClick={() => setRows(null)}>
                Choose a different file
              </Button>
            </div>
          </>
        )}

        <Button variant="ghost" size="sm" className="w-fit" onClick={onClose}>
          Close
        </Button>
      </CardContent>
    </Card>
  );
}
