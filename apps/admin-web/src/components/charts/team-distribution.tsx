"use client";

import { TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
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

interface TeamDistributionProps {
  data: Array<{
    team: string;
    actions: number;
  }>;
}

const TEAM_COLORS: Record<string, string> = {
  "Support Team": "hsl(var(--chart-1))",
  "Product Team": "hsl(var(--chart-2))",
  Operations: "hsl(var(--chart-3))",
  Engineering: "hsl(var(--chart-4))",
  Marketing: "hsl(var(--chart-5))",
};

const chartConfig = {
  actions: {
    label: "Actions",
  },
  support: {
    label: "Support Team",
    color: "hsl(var(--chart-1))",
  },
  product: {
    label: "Product Team",
    color: "hsl(var(--chart-2))",
  },
  operations: {
    label: "Operations",
    color: "hsl(var(--chart-3))",
  },
  engineering: {
    label: "Engineering",
    color: "hsl(var(--chart-4))",
  },
  marketing: {
    label: "Marketing",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function TeamDistributionChart({ data }: TeamDistributionProps) {
  const totalActions = data.reduce((sum, item) => sum + item.actions, 0);
  const topTeam = data.reduce(
    (max, item) => (item.actions > max.actions ? item : max),
    data[0] || { team: "", actions: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Action Distribution
        </CardTitle>
        <CardDescription>Action items assigned to each team</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              right: 20,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              dataKey="team"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                // Shorten team names for display
                return value.replace(" Team", "").slice(0, 10);
              }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={10} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="actions" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={TEAM_COLORS[entry.team] || "hsl(var(--primary))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {data.map((item) => (
            <div key={item.team} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor:
                    TEAM_COLORS[item.team] || "hsl(var(--primary))",
                }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {item.team} ({item.actions})
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Most actions: {topTeam.team} (
          {totalActions > 0
            ? ((topTeam.actions / totalActions) * 100).toFixed(1)
            : 0}
          %) <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Total: {totalActions} actions across {data.length} teams
        </div>
      </CardFooter>
    </Card>
  );
}
