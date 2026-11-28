import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { EstiloDef } from "../theme";

// Grano de película que cambia 15 veces/s, trama horizontal fina, viñeta oscura, parpadeo de exposición leve y tinte opcional.
// B1 (archivo), B3 (épico, tinte cálido) y B5 (misterio, tinte frío).
export const Textura: React.FC<{ frame: number; fps?: number; tinte?: string; letterbox?: number }> = ({ frame, fps = 30, tinte, letterbox = 0 }) => {
  const paso = Math.floor((frame / fps) * 15);
  const seed = Math.floor(random(`g${paso}`) * 1000);
  const parpadeo = 0.03 * Math.sin(frame * 1.7) + 0.02 * random(`f${paso}`);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.38 }}>
        <filter id="grano">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grano)" />
      </svg>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 3px)", mixBlendMode: "multiply" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 48%, rgba(5,5,5,0.78) 100%)" }} />
      <AbsoluteFill style={{ background: `rgba(242,180,92,${Math.max(0, parpadeo)})`, mixBlendMode: "soft-light" }} />
      {tinte ? <AbsoluteFill style={{ background: tinte, mixBlendMode: "color" }} /> : null}
      {letterbox > 0 ? (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${letterbox * 100}%`, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${letterbox * 100}%`, background: "#000" }} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// v4 · textura de superficie por estilo visual (no desenfoca la imagen; solo capas de mezcla).

export const TexturaEstilo: React.FC<{ est: EstiloDef }> = ({ est }) => {
  const frame = useCurrentFrame();
  const base = (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.38) 100%)" }} /> // legibilidad de subtítulos (tercio inferior)
  );
  if (est.textura === "limpia") return <AbsoluteFill style={{ pointerEvents: "none" }}>{base}</AbsoluteFill>;
  if (est.textura === "papel_acuarela") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.2 }}>
          <filter id="papel"><feTurbulence type="fractalNoise" baseFrequency="0.04 0.9" numOctaves="3" seed={7} /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width="100%" height="100%" filter="url(#papel)" />
        </svg>
        <AbsoluteFill style={{ boxShadow: "inset 0 0 160px 40px rgba(120,80,40,0.28)" }} />
        <AbsoluteFill style={{ background: "rgba(214,170,110,0.07)", mixBlendMode: "multiply" }} />
        {base}
      </AbsoluteFill>
    );
  }
  if (est.textura === "halftone") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.55) 1.6px, transparent 2px)", backgroundSize: "11px 11px", mixBlendMode: "multiply", opacity: 0.16 }} />
        <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(255,230,0,0.10), transparent 40%, rgba(255,61,110,0.10))", mixBlendMode: "overlay" }} />
        {base}
      </AbsoluteFill>
    );
  }
  // bloom_suave (cuento 3D luminoso): resplandor cálido que respira
  const b = est.luz.bloom * (0.75 + 0.25 * Math.sin(frame / 30));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, rgba(255,236,190,${0.32 * b}), transparent 62%)`, mixBlendMode: "screen" }} />
      {est.luz.tinte ? <AbsoluteFill style={{ background: est.luz.tinte, mixBlendMode: "soft-light" }} /> : null}
      {base}
    </AbsoluteFill>
  );
};
