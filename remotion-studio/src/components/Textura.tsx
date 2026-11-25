import React from "react";
import { AbsoluteFill, random } from "remotion";

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
