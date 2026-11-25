import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { TemaVisual } from "../types";

const COUNT = { ninguna: 0, suave: 22, media: 45, alta: 75 } as const;

// Partículas de luz con el color de acento del tema (dos capas para paralaje) + viñeta en el nivel alto.
export const Atmosphere: React.FC<{ tema: TemaVisual }> = ({ tema }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = COUNT[tema.particulas] ?? 0;
  if (!n) return null;
  const c = tema.paleta.acento;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const near = i % 3 === 0;
        const speed = (near ? 1.3 : 0.55) + random(`s${i}`) * 0.6;
        const x = random(`x${i}`) * width + Math.sin(frame / 38 + i) * (near ? 34 : 16);
        const y = height - ((frame * speed * 1.6 + random(`y${i}`) * height) % (height + 60)) + 30;
        const size = (near ? 6 : 3) + random(`z${i}`) * (near ? 7 : 3);
        const tw = 0.35 + 0.55 * Math.abs(Math.sin(frame / 17 + i * 1.7));
        return (
          <div
            key={i}
            style={{
              position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%",
              background: c, opacity: tw * (near ? 0.85 : 0.6), filter: near ? "blur(1.5px)" : undefined,
              boxShadow: `0 0 ${size * 2.5}px ${c}`,
            }}
          />
        );
      })}
      {tema.particulas === "alta" && (
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%)" }} />
      )}
    </AbsoluteFill>
  );
};
