import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ComingNext({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>This screen follows the Customers page's pattern</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">{note}</CardContent>
      </Card>
    </div>
  );
}
