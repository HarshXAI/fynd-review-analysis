"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface PriorityDistributionProps {
  data: Array<{
    date: string;
    high: number;
    medium: number;
    low: number;
  }>;
}

const chartConfig = {
  high: {
    label: "High Priority",
    color: "hsl(var(--chart-1))",
  },
  medium: {
    label: "Medium Priority",
    color: "hsl(var(--chart-2))",
  },
  low: {
    label: "Low Priority",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function PriorityDistributionChart({ data }: PriorityDistributionProps) {
  const totalActions = data.reduce(
    (sum, day) => sum + day.high + day.medium + day.low,
    0
  );
  const highPriorityCount = data.reduce((sum, day) => sum + day.high, 0);
  const highPriorityPercentage =
    totalActions > 0
      ? ((highPriorityCount / totalActions) * 100).toFixed(1)
      : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Priority Distribution</CardTitle>
        <CardDescription>Last {data.length} days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent payload={undefined} />} />
            <Bar
              dataKey="low"
              stackId="a"
              fill="var(--color-low)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="medium"
              stackId="a"
              fill="var(--color-medium)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="high"
              stackId="a"
              fill="var(--color-high)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {highPriorityPercentage}% high priority actions{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing action priority breakdown for the last {data.length} days
        </div>
      </CardFooter>
    </Card>
  );
}
