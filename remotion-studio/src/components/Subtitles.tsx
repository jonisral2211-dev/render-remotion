import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { Escena, TemaVisual } from "../types";
import { getFont } from "../fonts";
import { estiloDe } from "../theme";

// v4 · Subtítulos cortos (máx. 3 palabras) en el tercio inferior (74,5 % del alto): nunca tapan rostros ni tarjetas (las tarjetas van arriba).
// Un look por estilo visual: pop (cuento), tinta (acuarela), comic, barra (editorial).
export const Subtitles: React.FC<{ escenas: Escena[]; tema: TemaVisual }> = ({ escenas, tema }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const escena = escenas.find((s) => t >= s.start && t < s.end);
  if (!tema.subtitulos || !escena || !escena.words.length) return null;

  const est = estiloDe(tema);
  const modo = est?.subs ?? "pop";
  const { fontFamily, weight } = getFont(tema.tipografia);
  const words = escena.words;
  let cur = 0;
  for (let k = 0; k < words.length; k++) if (words[k].start <= t + 1e-6) cur = k;
  const speaking = t < words[cur].end;
  const vertical = height > width;
  // Bloques de 2-3 palabras (cortan en puntuación); nunca una palabra sola salvo que la frase sea de 1.
  const grupos: number[][] = [];
  let acc: number[] = [];
  words.forEach((w, k) => {
    acc.push(k);
    const fin = /[.,;:!?¡¿…]$/.test(w.text);
    if (acc.length >= 3 || (acc.length >= 2 && fin)) { grupos.push(acc); acc = []; }
  });
  if (acc.length) { if (acc.length === 1 && grupos.length && grupos[grupos.length - 1].length < 3) grupos[grupos.length - 1].push(acc[0]); else grupos.push(acc); }
  const gi = Math.max(0, grupos.findIndex((g) => g.includes(cur)));
  const startIdx = grupos[gi][0];
  const group = grupos[gi].map((k) => words[k]);
  const fontSize = vertical ? Math.round(width * (modo === "barra" ? 0.075 : 0.092)) : Math.round(height * 0.063);

  const wrap: React.CSSProperties =
    modo === "tinta" ? { background: "rgba(250,240,220,0.9)", padding: "0.18em 0.5em", borderRadius: "0.35em", border: "3px solid rgba(90,60,30,0.55)", boxShadow: "0 8px 20px rgba(60,40,20,0.35)" }
    : modo === "barra" ? { background: "rgba(8,12,24,0.74)", padding: "0.16em 0.55em", borderRadius: "0.3em", borderBottom: `5px solid ${tema.resaltado_subtitulos}` }
    : {};
  const upper = modo !== "barra" && modo !== "tinta";

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: height * (vertical ? 0.745 : 0.8) }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: "0.5em", rowGap: "0.1em", maxWidth: vertical ? "88%" : "80%", fontFamily, fontWeight: weight, fontSize, lineHeight: 1.12, ...wrap }}>
        {group.map((w, i) => {
          const idx = startIdx + i;
          const active = idx === cur && speaking;
          const sp = active ? spring({ frame: Math.max(0, frame - Math.round(w.start * fps)), fps, config: { damping: 8, stiffness: 190, mass: 0.6 } }) : 1;
          const scale = active ? Math.max(0.5, 0.95 + 0.17 * sp) : 1;
          const colBase = modo === "tinta" ? "#3A2A1A" : tema.paleta.texto;
          const stroke = modo === "tinta" || modo === "barra" ? 0 : Math.round(fontSize * (modo === "comic" ? 0.11 : 0.07));
          return (
            <span
              key={idx}
              style={{
                display: "inline-block", textTransform: upper ? "uppercase" : "none",
                color: active ? tema.resaltado_subtitulos : colBase,
                transform: `scale(${scale}) ${modo === "comic" && active ? `rotate(${(idx % 2 ? 1 : -1) * 2.5}deg)` : ""}`,
                WebkitTextStroke: stroke ? `${stroke}px ${modo === "comic" ? "#000" : "rgba(0,0,0,0.7)"}` : undefined, paintOrder: "stroke fill",
                textShadow: modo === "tinta" || modo === "barra" ? "none" : modo === "comic" ? "5px 5px 0 #000" : "0 6px 0 rgba(0,0,0,0.55), 0 10px 22px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)",
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
