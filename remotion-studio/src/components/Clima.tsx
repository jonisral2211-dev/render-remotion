import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Atmosfera } from "../types";
import { GodRays, LucesProfundidad } from "./Volumetrico";

// Capas de ambiente por escena (se montan dentro de un <Sequence>, así `frame` es local a la escena).

const Polvo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      {Array.from({ length: 34 }, (_, i) => {
        const near = i % 4 === 0;
        const x = (random(`px${i}`) * width + frame * (0.35 + random(`pv${i}`) * 0.5) + Math.sin(frame / 50 + i) * 22) % (width + 40);
        const y = ((random(`py${i}`) * height - frame * (0.25 + random(`pw${i}`) * 0.4)) % height + height) % height;
        const size = (near ? 5 : 2.5) + random(`ps${i}`) * 3;
        const tw = 0.25 + 0.6 * Math.abs(Math.sin(frame / 22 + i * 2.1));
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%",
            background: "#FFE6A8", opacity: tw * (near ? 0.75 : 0.5), filter: near ? "blur(1.4px)" : undefined,
            boxShadow: `0 0 ${size * 3}px rgba(255,214,140,.8)` }} />
        );
      })}
    </AbsoluteFill>
  );
};

const Lluvia: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const N = 90;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "rgba(10,20,40,0.16)" }} />
      {Array.from({ length: N }, (_, i) => {
        const near = i % 3 === 0;
        const speed = near ? 46 : 30;
        const len = near ? 150 : 80;
        const cycle = height + 300;
        const y = ((frame * speed + random(`ry${i}`) * cycle) % cycle) - 150;
        const x = ((random(`rx${i}`) * (width + 500) - y * 0.32) % (width + 500)) - 100;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: near ? 3 : 2, height: len,
            background: "linear-gradient(to bottom, rgba(220,235,255,0), rgba(220,235,255,0.7))",
            opacity: near ? 0.55 : 0.32, transform: "rotate(18deg)", transformOrigin: "top left" }} />
        );
      })}
    </AbsoluteFill>
  );
};

// Relámpagos: destellos breves (doble parpadeo) de baja opacidad en instantes pseudoaleatorios deterministas.
const Relampago: React.FC = () => {
  const frame = useCurrentFrame();
  let o = 0;
  for (let k = 0; k < 12; k++) {
    const t0 = 18 + k * 52 + Math.floor(random(`fl${k}`) * 30);
    const d = frame - t0;
    if (d >= 0 && d < 12) o = Math.max(o, d < 3 ? 0.4 : d < 5 ? 0.12 : d < 7 ? 0.32 : 0.32 * (1 - (d - 7) / 5));
  }
  return o > 0 ? <AbsoluteFill style={{ background: "#DCE8FF", opacity: o, mixBlendMode: "screen" }} /> : null;
};

const Bio: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: 38 }, (_, i) => {
        const near = i % 4 === 0;
        const sp = 0.5 + random(`bs${i}`) * 0.9;
        const y = height - ((frame * sp + random(`by${i}`) * height) % (height + 60)) + 30;
        const x = random(`bx${i}`) * width + Math.sin(frame / 40 + i * 1.3) * (near ? 40 : 18);
        const size = (near ? 8 : 3.5) + random(`bz${i}`) * (near ? 8 : 3);
        const hue = random(`bh${i}`) > 0.5 ? "90,255,235" : "110,190,255";
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / 19 + i * 1.9));
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%",
            background: `rgba(${hue},0.9)`, opacity: tw * (near ? 0.9 : 0.65), filter: near ? "blur(1.5px)" : undefined,
            boxShadow: `0 0 ${size * 3.5}px rgba(${hue},0.9)` }} />
        );
      })}
    </AbsoluteFill>
  );
};

export const Clima: React.FC<{ tipos: Atmosfera[]; dur: number }> = ({ tipos, dur }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 12, dur - 12, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {tipos.includes("polvo") && <Polvo />}
      {(tipos as string[]).includes("rayos") && <GodRays />}
      {(tipos as string[]).includes("luces") && <LucesProfundidad />}
      {tipos.includes("bioluminiscencia") && <Bio />}
      {tipos.includes("lluvia") && <Lluvia />}
      {tipos.includes("relampago") && <Relampago />}
    </AbsoluteFill>
  );
};
