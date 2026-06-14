import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({ title, value, icon: Icon, detail }: { title: string; value: string; detail?: string; icon: LucideIcon }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
        </div>
        <div className="rounded-md bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
