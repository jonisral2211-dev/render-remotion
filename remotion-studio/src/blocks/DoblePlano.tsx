import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BloqueProps } from "./common";
import { BLOQUES } from "./index";
import { isVideo } from "../theme";
import { Escena, Visual } from "../types";

const F = 14; // frames de unión entre el plano A y el B

const Entrada: React.FC<{ destello: boolean; color: string; children: React.ReactNode }> = ({ destello, color, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, F], [0, 1], { extrapolateRight: "clamp" });
  const flash = destello ? interpolate(frame, [0, F / 2, F], [0, 0.55, 0], { extrapolateRight: "clamp" }) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: destello ? 1 : o }}>{children}</AbsoluteFill>
      {destello && (
        <AbsoluteFill style={{ opacity: flash, mixBlendMode: "screen", background: `radial-gradient(circle at 50% 45%, ${color}, transparent 70%)` }} />
      )}
    </AbsoluteFill>
  );
};

// Doble plano: la escena se divide en dos mitades. A (plano general): zoom-in + deriva vertical.
// B (detalle): zoom-out + paneo horizontal. Se unen con fade o destello cálido de 14 frames.
export const DoblePlano: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const vis = (escena.visuales ?? []).slice(0, 2);
  const half = Math.floor(durationInFrames / 2);

  const build = (v: Visual, fromFrame: number, cam: "plano_general" | "detalle"): Escena => {
    const bloque = v.bloque ?? (v.puntos ? "diapositiva" : v.dato ? "tarjeta_dato" : isVideo(v.media) ? "video_clip" : "foto_25d");
    const start = escena.start + fromFrame / fps;
    const words = escena.words.filter((w) => w.end > start);
    return { ...escena, ...v, bloque, camara: v.camara ?? cam, start, words: words.length ? words : escena.words, visuales: undefined };
  };
  const render = (e: Escena) => {
    const B = BLOQUES[e.bloque] ?? BLOQUES.foto_25d;
    return <B escena={e} index={index} tema={tema} />;
  };
  if (vis.length < 2) return render(build(vis[0] ?? {}, 0, "plano_general"));

  return (
    <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo }}>
      <Sequence from={0} durationInFrames={half + F}>
        {render(build(vis[0], 0, "plano_general"))}
      </Sequence>
      <Sequence from={half} durationInFrames={Math.max(1, durationInFrames - half)}>
        <Entrada destello={escena.union === "destello"} color={tema.paleta.acento}>
          {render(build(vis[1], half, "detalle"))}
        </Entrada>
      </Sequence>
    </AbsoluteFill>
  );
};
