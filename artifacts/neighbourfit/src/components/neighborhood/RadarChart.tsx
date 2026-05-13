import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarDataPoint {
  dimension: string;
  value: number;
  fullMark: number;
}

interface RadarChartComponentProps {
  data: RadarDataPoint[];
}

export function RadarChartComponent({ data }: RadarChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 12, right: 24, bottom: 12, left: 24 }}>
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#cbd5e1", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#64748b", fontSize: 9 }}
          tickCount={3}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#14b8a6"
          fill="#14b8a6"
          fillOpacity={0.35}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
