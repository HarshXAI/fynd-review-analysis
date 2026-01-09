"use client";

import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
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

interface ReviewTrendsProps {
  data: Array<{
    date: string;
    positive: number;
    negative: number;
    total: number;
  }>;
}

const chartConfig = {
  positive: {
    label: "Positive (4-5★)",
    color: "hsl(var(--chart-1))",
  },
  negative: {
    label: "Negative (1-2★)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function ReviewTrendsChart({ data }: ReviewTrendsProps) {
  const trend =
    data.length > 1
      ? (
          ((data[data.length - 1].total - data[0].total) / data[0].total) *
          100
        ).toFixed(1)
      : "0";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Trends</CardTitle>
        <CardDescription>
          Daily review volume for the last {data.length} days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillPositive" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-positive)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-positive)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillNegative" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-negative)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-negative)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="negative"
              type="natural"
              fill="url(#fillNegative)"
              fillOpacity={0.4}
              stroke="var(--color-negative)"
              stackId="a"
            />
            <Area
              dataKey="positive"
              type="natural"
              fill="url(#fillPositive)"
              fillOpacity={0.4}
              stroke="var(--color-positive)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {trend !== "0" && (
                <>
                  {parseFloat(trend) > 0 ? "Trending up" : "Trending down"} by{" "}
                  {Math.abs(parseFloat(trend))}%{" "}
                  <TrendingUp className="h-4 w-4" />
                </>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              Last {data.length} days
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
