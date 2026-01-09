"use client";

import { TrendingUp } from "lucide-react";
import { PolarGrid, RadialBar, RadialBarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface CategoryMetricsProps {
  data: Array<{
    category: string;
    value: number;
    fill: string;
  }>;
  title?: string;
  description?: string;
}

export function CategoryMetricsChart({
  data,
  title = "Category Metrics",
  description = "Distribution overview",
}: CategoryMetricsProps) {
  const chartConfig = data.reduce((acc, item) => {
    acc[item.category] = {
      label: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      color: item.fill,
    };
    return acc;
  }, {} as ChartConfig);

  chartConfig.value = {
    label: "Value",
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const topCategory = data.reduce(
    (max, item) => (item.value > max.value ? item : max),
    data[0]
  );
  const topPercentage =
    total > 0 ? ((topCategory.value / total) * 100).toFixed(1) : "0";

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart data={data} innerRadius={30} outerRadius={100}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="category" />}
            />
            <PolarGrid gridType="circle" />
            <RadialBar dataKey="value" />
          </RadialBarChart>
        </ChartContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4 px-4">
          {data.map((item) => (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {item.category} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Top category: {topCategory.category} ({topPercentage}%){" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {total} items across {data.length} categories
        </div>
      </CardFooter>
    </Card>
  );
}
