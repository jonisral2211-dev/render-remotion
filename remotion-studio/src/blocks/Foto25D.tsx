import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { BloqueProps } from "./common";
import { Fondo } from "./Fondo";
import { estiloDe } from "../theme";
import { CamPreset, microPlano, normPreset, pose } from "../camara";

// v4 · Foto con CÁMARA MULTIFASE: la escena se parte en 2-3 micro-planos; cada uno = impulso de entrada + traslación/rotación 3D + zoom + remate a detalle.
// cover + inset -10 % => los bordes nunca asoman al rotar.
export const Foto25D: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height, fps } = useVideoConfig();
  const mp = microPlano(frame, durationInFrames, fps, escena.planos);
  const preset: CamPreset = normPreset(escena.camaras?.[mp.k]) ?? (escena.camara === "estatica" ? "estatica" : (["dolly_orbital", "empuje_lateral", "macro_zoom", "holandes"] as CamPreset[])[(index + mp.k) % 4]);
  const dir: 1 | -1 = (index + mp.k) % 2 === 0 ? 1 : -1;
  const c = pose(preset, mp.p, mp.fl, fps, dir);
  const foco = escena.foco ?? { x: 0.5, y: 0.4 };
  const est = estiloDe(tema);
  // respiración orgánica: ningún fotograma 100 % quieto
  const bx = Math.cos(frame / 31) * 4, by = Math.sin(frame / 26) * 5;
  const filtro = `saturate(${est?.saturacion ?? 1.08}) contrast(${est?.contraste ?? 1.04})`;
  const layer = (
    <div style={{ position: "absolute", inset: "-10%", transform: `translate(${c.tx * width + bx}px, ${c.ty * height + by}px) perspective(1400px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg) scale(${c.zoom})`, transformOrigin: `${foco.x * 100}% ${foco.y * 100}%`, filter: c.whip > 0.05 ? "url(#whipf)" : undefined }}>
      <Fondo media={escena.media} style={{ filter: filtro }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo, overflow: "hidden" }}>
      {!escena.media && <AbsoluteFill style={{ background: `linear-gradient(160deg, ${tema.paleta.primaria}, ${tema.paleta.fondo})` }} />}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="whipf" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation={`${(c.whip * 38).toFixed(1)} 0`} /></filter>
      </svg>
      {tema.desenfoque_movimiento ? <CameraMotionBlur shutterAngle={90} samples={3}>{layer}</CameraMotionBlur> : layer}
    </AbsoluteFill>
  );
};
