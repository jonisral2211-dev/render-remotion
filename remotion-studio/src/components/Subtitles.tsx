import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Escena, TemaVisual } from "../types";
import { getFont } from "../fonts";

// Subtítulos palabra por palabra, siempre espaciados y sin escalas negativas (nunca texto invertido).
export const Subtitles: React.FC<{ escenas: Escena[]; tema: TemaVisual }> = ({ escenas, tema }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const escena = escenas.find((s) => t >= s.start && t < s.end);
  if (!tema.subtitulos || !escena || !escena.words.length) return null;

  const { fontFamily, weight } = getFont(tema.tipografia);
  const words = escena.words;
  // Palabra actual = la última que ya empezó (por inicio, no por fin): ninguna palabra corta se salta ni el resaltado ni la ventana.
  let cur = 0;
  for (let k = 0; k < words.length; k++) if (words[k].start <= t + 1e-6) cur = k;
  const speaking = t < words[cur].end;
  const vertical = height > width;
  const win = 3; // máximo 3 palabras por bloque
  const startIdx = Math.floor(cur / win) * win;
  const group = words.slice(startIdx, startIdx + win);
  const fontSize = vertical ? Math.round(width * 0.095) : Math.round(height * 0.063);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: height * (vertical ? 0.68 : 0.78) }}>
      <div
        style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.55em", rowGap: "0.12em",
          maxWidth: vertical ? "86%" : "80%", fontFamily, fontWeight: weight, fontSize, lineHeight: 1.12,
        }}
      >
        {group.map((w, i) => {
          const idx = startIdx + i;
          const active = idx === cur && speaking;
          const sp = active
            ? spring({ frame: Math.max(0, frame - Math.round(w.start * fps)), fps, config: { damping: 8, stiffness: 190, mass: 0.6 } })
            : 1;
          const scale = active ? Math.max(0.5, 0.95 + 0.17 * sp) : 1; // asienta en 1.12x
          return (
            <span
              key={idx}
              style={{
                display: "inline-block",
                textTransform: "uppercase",
                color: active ? tema.resaltado_subtitulos : tema.paleta.texto,
                transform: `scale(${scale})`,
                WebkitTextStroke: `${Math.round(fontSize * 0.07)}px rgba(0,0,0,0.7)`,
                paintOrder: "stroke fill",
                textShadow: "0 6px 0 rgba(0,0,0,0.55), 0 10px 22px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
