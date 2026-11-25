import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { TemaVisual } from "../types";

// Textura de cine: viñeta, gradación (sombras frías / luces cálidas), grano ligero y barras letterbox.
export const Cine: React.FC<{ tema: TemaVisual }> = ({ tema }) => {
  const lb = tema.letterbox ?? 0;
  if (!tema.vineta && !lb) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {tema.vineta && (
        <>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.55) 100%)" }} />
          <AbsoluteFill style={{ mixBlendMode: "soft-light", opacity: 0.35, background: "linear-gradient(180deg, #1F4E79 0%, rgba(0,0,0,0) 45%, #B8742A 100%)" }} />
        </>
      )}
      {lb > 0 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${lb * 100}%`, background: "#000" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${lb * 100}%`, background: "#000" }} />
        </>
      )}
    </AbsoluteFill>
  );
};

// Entrada con impacto: zoom 1.05 -> 1.0 en los primeros 8 frames de cada escena.
export const EntradaZoom: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 8], [1.05, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

// Light leak: destello cálido que sube y baja en pocos frames (cambios de acto).
export const LightLeak: React.FC<{ color: string }> = ({ color }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 5, 14], [0, 0.75, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: o, mixBlendMode: "screen", pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 15% 25%, ${color} 0%, rgba(255,120,40,0.5) 30%, transparent 70%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(255,180,90,0.45), transparent 55%)" }} />
    </AbsoluteFill>
  );
};
