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

// Custom tick to handle long French labels cleanly
function AxisTick({
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
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor ?? "middle"}
      fill="#4b4b6a"
      fontSize={12}
      fontWeight={600}
      fontFamily="inherit"
    >
      {payload.value}
    </text>
  );
}

export function IkigaiRadar({ scores }: { scores: RadarScores }) {
  const data = [
    { subject: "Ce que tu aimes", score: scores.ce_que_tu_aimes },
    { subject: "Tes compétences", score: scores.ce_pour_quoi_tu_es_doue },
    { subject: "Les attentes", score: scores.ce_que_lentreprise_recherche },
    { subject: "Ta personnalité", score: scores.ce_qui_te_correspond_humainement },
  ];

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart cx="50%" cy="50%" outerRadius="62%" data={data}>
        <PolarGrid gridType="polygon" stroke="#e8dffe" strokeWidth={1.5} />
        <PolarAngleAxis dataKey="subject" tick={AxisTick as any} />
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
          fillOpacity={0.5}
          strokeWidth={2}
          dot={{ fill: "#9b6dff", r: 4 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
