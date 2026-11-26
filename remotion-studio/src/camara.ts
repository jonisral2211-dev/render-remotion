import { Easing } from "remotion";

// v4 · MOTOR DE CÁMARA MULTIFASE. Cada segmento de voz (escena) se divide en 2-3 micro-planos; cada micro-plano tiene 3 fases:
//   1) ENTRADA con impulso (patada de zoom + rotación que decae en ~0,35 s, curva Easing.bezier con rebote)
//   2) MOVIMIENTO combinado traslación + rotación sutil (rotateX/Y/Z) + zoom progresivo
//   3) REMATE: acercamiento a detalle sobre el punto focal (último 28 %)
// Los presets nunca se repiten en micro-planos consecutivos (ver plan.ts).

export const CAM_PRESETS = ["dolly_orbital", "holandes", "macro_zoom", "tilt_revelacion", "whip_impulso", "empuje_lateral"] as const;
export type CamPreset = (typeof CAM_PRESETS)[number] | "estatica";

// nombres heredados (v3) -> v4
const LEGACY: Record<string, CamPreset> = {
  dolly_in_epico: "dolly_orbital", orbita_3d: "dolly_orbital", tilt_revelacion: "tilt_revelacion",
  whip_pan_blur: "whip_impulso", zoom_impacto_spring: "macro_zoom", flotacion_suave: "empuje_lateral",
};
export const normPreset = (n?: string): CamPreset | undefined => {
  if (!n) return undefined;
  if ((CAM_PRESETS as readonly string[]).includes(n) || n === "estatica") return n as CamPreset;
  return LEGACY[n];
};

/** nº de micro-planos de una escena: <3 s => 1; si no, 2 o 3 (~2,6 s cada uno). */
export const planosDe = (durFrames: number, fps: number, forzar?: number): number => {
  if (forzar && forzar > 0) return Math.round(forzar);
  const s = durFrames / fps;
  if (s < 3) return 1;
  return Math.max(2, Math.min(3, Math.round(s / 2.6)));
};

export type Pose = { tx: number; ty: number; zoom: number; rx: number; ry: number; rz: number; whip: number }; // tx,ty en fracción del lienzo; ángulos en grados

const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
const impulso = Easing.bezier(0.2, 0.9, 0.25, 1.15); // entrada con rebote
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** p: progreso 0-1 del micro-plano · fl: frames desde su inicio · dir: ±1 (alterna el sentido) */
export const pose = (preset: CamPreset, p: number, fl: number, fps: number, dir: 1 | -1 = 1): Pose => {
  const m = ease(Math.min(1, Math.max(0, p)));
  const kick = 1 - impulso(Math.min(1, fl / (0.35 * fps))); // 1 -> 0 (impulso de entrada)
  const rem = sstep(0.72, 1, p); // remate a detalle
  const o: Pose = { tx: 0, ty: 0, zoom: 1, rx: 0, ry: 0, rz: 0, whip: 0 };
  switch (preset) {
    case "dolly_orbital": // órbita 3D: traslación lateral + yaw + leve cabeceo + zoom
      o.tx = dir * lerp(-0.05, 0.05, m); o.ry = dir * lerp(-8, 8, m); o.rx = lerp(1.5, -1.5, m); o.rz = dir * lerp(-0.6, 0.6, m); o.zoom = lerp(1.04, 1.15, m); break;
    case "holandes": // plano holandés: inclinación dinámica
      o.rz = dir * lerp(-4.2, 4.2, m); o.ty = lerp(0.02, -0.02, m); o.tx = dir * lerp(0.02, -0.02, m); o.zoom = lerp(1.1, 1.2, m); break;
    case "macro_zoom": // macro-zoom al punto focal
      o.zoom = lerp(1.04, 1.5, m); o.ry = dir * lerp(2, -2, m); o.rz = dir * lerp(0.8, -0.8, m); break;
    case "tilt_revelacion": // tilt vertical de revelación
      o.ty = lerp(0.07, -0.07, m); o.rx = lerp(5, -3, m); o.zoom = lerp(1.12, 1.2, m); break;
    case "whip_impulso": { // latigazo lateral con desenfoque direccional que decae
      const w = Math.pow(1 - Math.min(1, fl / 9), 2);
      o.tx = dir * (w * 0.3 + lerp(-0.015, 0.015, m)); o.zoom = lerp(1.1, 1.18, m); o.whip = w; break;
    }
    case "empuje_lateral":
      o.tx = dir * lerp(-0.05, 0.05, m); o.zoom = lerp(1.12, 1.2, m); o.rz = lerp(-0.8, 0.8, m); break;
    default: // estatica
      o.zoom = 1.06;
  }
  o.zoom += kick * 0.06 + rem * 0.07;
  o.rz += dir * kick * 1.4;
  o.ry += dir * kick * 2.2;
  return o;
};

/** Localiza el micro-plano activo. */
export const microPlano = (frame: number, durFrames: number, fps: number, forzar?: number) => {
  const n = planosDe(durFrames, fps, forzar);
  const len = durFrames / n;
  const k = Math.min(n - 1, Math.floor(frame / len));
  const fl = frame - k * len;
  return { n, k, fl, p: Math.min(1, fl / Math.max(1, len - 1)) };
};

export const FOCOS = [{ x: 0.5, y: 0.38 }, { x: 0.36, y: 0.45 }, { x: 0.64, y: 0.4 }, { x: 0.5, y: 0.55 }];
