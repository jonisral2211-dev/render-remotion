import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { BloqueProps } from "./common";
import { Fondo } from "./Fondo";

const BEZIER = Easing.bezier(0.25, 0.1, 0.25, 1);

// Imagen con cámara suave: zoom_in, zoom_out o paneo (auto rota por escena). cover => nunca se deforma.
export const Foto25D: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const p = frame / Math.max(1, durationInFrames - 1);
  const e = BEZIER(p); // curva suave de aceleración/desaceleración
  const cam = escena.camara && escena.camara !== "auto" ? escena.camara : (["zoom_in", "zoom_out", "paneo"] as const)[index % 3];

  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let origin = "50% 50%";
  if (cam === "plano_general") {
    zoom = interpolate(e, [0, 1], [1.0, 1.18]);
    panY = interpolate(e, [0, 1], [height * 0.02, -height * 0.02]);
  } else if (cam === "detalle") {
    zoom = interpolate(e, [0, 1], [1.18, 1.02]);
    panX = interpolate(e, [0, 1], [-width * 0.035, width * 0.035]);
  } else if (cam === "zoom_in") {
    zoom = interpolate(e, [0, 1], [1.0, 1.2]);
    origin = "50% 35%";
  } else if (cam === "zoom_out") {
    zoom = interpolate(e, [0, 1], [1.2, 1.02]);
  } else if (cam === "estatica") {
    zoom = 1.06; // plano casi fijo (solo flotación orgánica)
  } else {
    zoom = 1.12; // paneo / paneo_izq
    const d = cam === "paneo_izq" ? -1 : 1;
    panX = interpolate(e, [0, 1], [-width * 0.03 * d, width * 0.03 * d]);
  }
  // Paralaje: leve desplazamiento lateral/vertical acompaña al zoom (sentido alterno por escena)
  const dir = index % 2 === 0 ? 1 : -1;
  panX += interpolate(e, [0, 1], [-width * 0.012 * dir, width * 0.012 * dir]);
  panY += interpolate(e, [0, 1], [height * 0.008, -height * 0.008]);
  // Micro-vibración de cámara en escenas de tensión: ruido suave + sacudidas breves
  let shX = 0, shY = 0, rot = 0;
  if (escena.vibracion) {
    const n = (k: number, f: number) => Math.sin(frame * f + k) + 0.6 * Math.sin(frame * f * 2.3 + k * 3.1);
    const jolt = random(`j${Math.floor(frame / 3)}`) > 0.8 ? 1.8 : 1;
    shX = n(1, 0.9) * 5 * jolt;
    shY = n(2, 1.1) * 5 * jolt;
    rot = n(3, 0.7) * 0.25;
  }
  const floatY = Math.sin(frame / 26) * 5 + panY + shY;
  const floatX = Math.cos(frame / 31) * 4 + panX + shX;

  const layer = (
    <div style={{ position: "absolute", inset: "-8%", transform: `translate(${floatX}px, ${floatY}px) rotate(${rot}deg) scale(${zoom})`, transformOrigin: origin }}>
      <Fondo media={escena.media} style={{ filter: "saturate(1.08) contrast(1.04)" }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo, overflow: "hidden" }}>
      {!escena.media && <AbsoluteFill style={{ background: `linear-gradient(160deg, ${tema.paleta.primaria}, ${tema.paleta.fondo})` }} />}
      {tema.desenfoque_movimiento ? (
        <CameraMotionBlur shutterAngle={90} samples={3}>
          {layer}
        </CameraMotionBlur>
      ) : (
        layer
      )}
    </AbsoluteFill>
  );
};
