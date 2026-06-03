"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export interface RadarScores {
  ce_que_tu_aimes: number;
  ce_pour_quoi_tu_es_doue: number;
  ce_que_lentreprise_recherche: number;
  ce_qui_te_correspond_humainement: number;
}

export const RADAR_AXES: { key: keyof RadarScores; label: string }[] = [
  { key: "ce_que_tu_aimes", label: "Ce que tu aimes" },
  { key: "ce_pour_quoi_tu_es_doue", label: "Tes compétences" },
  { key: "ce_que_lentreprise_recherche", label: "Les attentes" },
  { key: "ce_qui_te_correspond_humainement", label: "Ta personnalité" },
];

export function radarAverage(scores: RadarScores): number {
  return Math.round(
    (scores.ce_que_tu_aimes +
      scores.ce_pour_quoi_tu_es_doue +
      scores.ce_que_lentreprise_recherche +
      scores.ce_qui_te_correspond_humainement) /
      4
  );
}

export function scoresFromAnalysis(a: {
  values_score: number;
  skills_score: number | null;
  overall_score: number;
  personality_score: number;
}): RadarScores {
  return {
    ce_que_tu_aimes: a.values_score,
    ce_pour_quoi_tu_es_doue: a.skills_score ?? a.overall_score,
    ce_que_lentreprise_recherche: a.overall_score,
    ce_qui_te_correspond_humainement: a.personality_score,
  };
}

// Axis tick: label on first line, score% in purple on second line
function makeAxisTick(data: { subject: string; score: number }[]) {
  return function AxisTick({
    x,
    y,
    payload,
    textAnchor,
  }: {
    x?: number;
    y?: number;
    payload?: { value: string };
    textAnchor?: "middle" | "start" | "end" | "inherit";
  }) {
    if (x === undefined || y === undefined || !payload) return null;
    const entry = data.find((d) => d.subject === payload.value);
    const score = entry?.score ?? 0;
    const anchor = textAnchor ?? "middle";
    return (
      <g>
        <text
          x={x}
          y={y}
          textAnchor={anchor}
          fill="#6b6b8a"
          fontSize={11}
          fontWeight={500}
          fontFamily="inherit"
        >
          {payload.value}
        </text>
        <text
          x={x}
          y={y + 16}
          textAnchor={anchor}
          fill="#9b6dff"
          fontSize={14}
          fontWeight={700}
          fontFamily="inherit"
        >
          {score}%
        </text>
      </g>
    );
  };
}

export function IkigaiRadar({ scores }: { scores: RadarScores }) {
  const data = RADAR_AXES.map((axis) => ({
    subject: axis.label,
    score: scores[axis.key],
  }));

  const AxisTick = makeAxisTick(data);

  return (
    <ResponsiveContainer width="100%" height={420}>
      <RadarChart cx="50%" cy="50%" outerRadius="58%" data={data}>
        <PolarGrid gridType="polygon" stroke="#e8dffe" strokeWidth={1.5} />
        <PolarAngleAxis
          dataKey="subject"
          tick={AxisTick as any}
          tickLine={false}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tickCount={5}
          tick={false}
          axisLine={false}
          stroke="transparent"
        />
        <Radar
          name="Match"
          dataKey="score"
          stroke="#9b6dff"
          fill="#CCB8FF"
          fillOpacity={0.45}
          strokeWidth={2}
          dot={{ fill: "#9b6dff", r: 4, strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
