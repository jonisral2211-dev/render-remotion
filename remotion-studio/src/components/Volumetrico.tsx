import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";

// Atmósfera volumétrica (sin blur sobre la imagen): god rays, partículas de luz en profundidad y viñeta suave.
export const GodRays: React.FC<{ color?: string; intensidad?: number }> = ({ color = "#FFE9A8", intensidad = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none", overflow: "hidden" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute", top: "-25%", left: `${-4 + i * 22}%`, width: "14%", height: "160%",
            background: `linear-gradient(180deg, ${color}cc, ${color}00 78%)`, transformOrigin: "50% 0%",
            transform: `rotate(${-22 + i * 10 + Math.sin(frame / 70 + i * 1.3) * 3.5}deg)`,
            opacity: (0.11 + 0.08 * Math.sin(frame / 41 + i * 1.9)) * intensidad,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// Partículas de luz a 3 profundidades (lejanas pequeñas y lentas, cercanas grandes y rápidas = paralaje).
export const LucesProfundidad: React.FC<{ color?: string; n?: number }> = ({ color = "#FFF1C2", n = 30 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const capa = i % 3; // 0 lejos, 1 media, 2 cerca
        const v = [0.35, 0.8, 1.5][capa];
        const size = [3, 6, 11][capa] * (0.7 + random(`ls${i}`) * 0.6);
        const x = (random(`lx${i}`) * width + Math.sin(frame / (30 + capa * 12) + i) * (10 + capa * 14)) % width;
        const y = ((random(`ly${i}`) * height - frame * v * 0.9) % height + height) % height;
        const tw = 0.3 + 0.7 * Math.abs(Math.sin(frame / (15 + capa * 6) + i * 1.7));
        return (
          <div
            key={i}
            style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color, opacity: tw * (0.5 + capa * 0.2), boxShadow: `0 0 ${size * 3}px ${size}px ${color}66` }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const VinetaSuave: React.FC<{ fuerza?: number }> = ({ fuerza = 0.28 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 58%, rgba(20,10,0,${fuerza}) 100%)` }} />
);
