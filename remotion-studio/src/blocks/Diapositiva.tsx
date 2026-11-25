import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BloqueProps } from "./common";
import { getFont } from "../fonts";

// Diapositiva por código: degradado sutil, título y puntos que aparecen cuando la voz llega a ese punto de la frase.
export const Diapositiva: React.FC<BloqueProps> = ({ escena, tema }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { fontFamily, weight } = getFont(tema.tipografia);
  const vertical = height > width;
  const puntos = escena.puntos ?? [];
  const words = escena.words;
  const t = frame / fps + escena.start; // tiempo absoluto: la secuencia de esta escena arranca en escena.start
  const reveal = (k: number) => {
    if (!words.length) return escena.start + 0.4 + k * 0.8;
    const w = words[Math.min(words.length - 1, Math.floor((k * words.length) / Math.max(1, puntos.length)))];
    return Math.max(escena.start + 0.35, w.start);
  };
  const tTitle = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const unit = vertical ? width : height;
  const P = tema.paleta;

  return (
    <AbsoluteFill style={{ background: `linear-gradient(155deg, ${P.fondo} 0%, ${P.primaria} 70%, ${P.secundaria} 140%)`, fontFamily }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 80% 15%, ${P.acento}22, transparent 55%)` }} />
      <AbsoluteFill style={{ padding: unit * 0.09, justifyContent: "flex-start", paddingTop: height * (vertical ? 0.1 : 0.12) }}>
        {escena.titulo && (
          <div style={{ color: P.texto, fontWeight: weight, fontSize: unit * (vertical ? 0.092 : 0.075), lineHeight: 1.1, opacity: tTitle, transform: `translateY(${(1 - tTitle) * 30}px)` }}>
            {escena.titulo}
            <div style={{ width: unit * 0.16, height: unit * 0.012, background: P.acento, borderRadius: 99, marginTop: unit * 0.025 }} />
          </div>
        )}
        <div style={{ marginTop: unit * 0.06, display: "flex", flexDirection: "column", gap: unit * 0.035 }}>
          {puntos.map((pt, k) => {
            const tr = reveal(k);
            const s = interpolate(t, [tr, tr + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: unit * 0.03, opacity: s, transform: `translateX(${(1 - s) * -40}px)`, color: P.texto, fontWeight: 600, fontSize: unit * (vertical ? 0.058 : 0.046), lineHeight: 1.2 }}>
                <span style={{ flex: "0 0 auto", width: unit * 0.022, height: unit * 0.022, borderRadius: "50%", background: P.acento }} />
                <span>{pt}</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
