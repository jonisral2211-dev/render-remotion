import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BloqueProps } from "./common";
import { bloqueDe } from "./index";
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

// v4 · Doble plano: la escena se divide en dos mitades (A general / B detalle), cada una con su micro-plano de cámara (camaras[0] / camaras[1]),
// unidas con fade o destello. Con union:"split" (+ comparar) A y B se ven a la vez en pantalla dividida con divisor y etiquetas.
export const DoblePlano: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const vis = (escena.visuales ?? []).slice(0, 2);
  const half = Math.floor(durationInFrames / 2);

  const build = (v: Visual, fromFrame: number, cam: "plano_general" | "detalle"): Escena => {
    const bloque = v.bloque ?? (v.puntos ? "diapositiva" : v.dato ? "tarjeta_dato" : isVideo(v.media) ? "video_clip" : "foto_25d");
    const start = escena.start + fromFrame / fps;
    const words = escena.words.filter((w) => w.end > start);
    const ci = cam === "plano_general" ? 0 : 1;
    const im = escena.imagenes ?? [];
    const mitad = Math.ceil(im.length / 2);
    const parte = im.length > 1 ? (ci === 0 ? im.slice(0, mitad) : im.slice(mitad)) : undefined; // v4.1: las imágenes se reparten entre A y B
    return {
      ...escena, ...v, bloque, camara: v.camara ?? cam,
      camaras: escena.camaras ? [escena.camaras[ci] ?? escena.camaras[0]] : undefined, planos: 1, imagenes: parte && parte.length ? parte.map((p) => ({ ...p, t: undefined })) : undefined,
      start, words: words.length ? words : escena.words, visuales: undefined,
    };
  };
  const render = (e: Escena) => {
    const B = bloqueDe(e);
    return <B escena={e} index={index} tema={tema} />;
  };
  if (vis.length < 2) return render(build(vis[0] ?? {}, 0, "plano_general"));

  if (escena.union === "split") {
    const vertical = height > width;
    const col = tema.paleta.acento;
    const mitad = (v: Visual, ci: 0 | 1) => {
      const pos: React.CSSProperties = vertical
        ? { left: 0, right: 0, height: "50%", ...(ci ? { bottom: 0 } : { top: 0 }) }
        : { top: 0, bottom: 0, width: "50%", ...(ci ? { right: 0 } : { left: 0 }) };
      const shift: React.CSSProperties = vertical ? { top: "-50%", left: 0, width: "100%", height: "200%" } : { left: "-50%", top: 0, width: "200%", height: "100%" };
      return (
        <div key={ci} style={{ position: "absolute", overflow: "hidden", ...pos }}>
          <div style={{ position: "absolute", ...shift }}>{render(build(v, 0, ci ? "detalle" : "plano_general"))}</div>
          {v.etiqueta ? (
            <div style={{ position: "absolute", left: 24, ...(ci ? { top: 24 } : { bottom: 24 }), padding: "10px 22px", background: "rgba(10,14,30,0.82)", color: "#fff", borderRadius: 12, border: `3px solid ${col}`, fontSize: width * 0.04, fontWeight: 800, fontFamily: "inherit" }}>
              {v.etiqueta}
            </div>
          ) : null}
        </div>
      );
    };
    return (
      <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo }}>
        {mitad(vis[0], 0)}
        {mitad(vis[1], 1)}
        <div style={{ position: "absolute", background: col, boxShadow: `0 0 24px ${col}`, ...(vertical ? { left: 0, right: 0, top: "50%", height: 8, marginTop: -4 } : { top: 0, bottom: 0, left: "50%", width: 8, marginLeft: -4 }) }} />
      </AbsoluteFill>
    );
  }

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
