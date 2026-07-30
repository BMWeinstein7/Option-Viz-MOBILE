import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown } from "lucide-react";

export function KPICard({ 
  title, 
  value, 
  loading, 
  color = "#0079F2", 
  change, 
  trend 
}: { 
  title: string; 
  value: string | number; 
  loading: boolean;
  color?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" && <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />}
                {trend === "down" && <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />}
                <span className={`text-sm ${trend === "up" ? "text-green-600 dark:text-green-400" : trend === "down" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                  {change}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
