import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BloqueProps } from "./common";
import { getFont } from "../fonts";
import { Tarjeta } from "../types";

// MODO B · motor "parallax_pro": una imagen quieta de Flow -> película multicapa.
//  Capa 1: plato de fondo HD (sujeto rellenado) + rayos de luz + destellos.
//  Capa 2: recorte del sujeto (alfa) con movimiento propio, perspective/rotateX/rotateY y acercamientos.
//  Capa 3: tarjetas explicativas animadas con spring() cada ~2,5-3 s.
// Planos de 2,5-3,5 s dentro de cada escena (cada plano = otro encuadre de la misma imagen). SIN blur: nada se desenfoca.
const PLANO_S = 3.0;
const ease = Easing.bezier(0.25, 0.1, 0.25, 1);

type Cam = { bg: [number, number]; su: [number, number]; panBg: [number, number]; panSu: [number, number]; ry: [number, number]; rx: [number, number]; oy: number };
const PRESETS: Cam[] = [
  { bg: [1.04, 1.12], su: [1.04, 1.2], panBg: [0, 0], panSu: [0, 0], ry: [-5, 5], rx: [0, 2], oy: 50 }, // general: empuje + giro
  { bg: [1.25, 1.4], su: [1.35, 1.62], panBg: [0, 0], panSu: [0, 0], ry: [3, -3], rx: [2, -2], oy: 38 }, // acercamiento dramático al sujeto
  { bg: [1.14, 1.14], su: [1.18, 1.24], panBg: [-0.035, 0.035], panSu: [-0.08, 0.08], ry: [-7, 7], rx: [0, 0], oy: 50 }, // paneo lateral con parallax
  { bg: [1.2, 1.08], su: [1.3, 1.1], panBg: [0.02, -0.02], panSu: [0.05, -0.05], ry: [4, -4], rx: [-2, 1], oy: 45 }, // aleja
];

const Destellos: React.FC<{ frame: number; w: number; h: number; color: string }> = ({ frame, w, h, color }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {new Array(26).fill(0).map((_, i) => {
      const x = random(`x${i}`) * w;
      const y0 = random(`y${i}`) * h;
      const sp = 0.25 + random(`s${i}`) * 0.7;
      const y = (y0 - frame * sp * 1.4 + h * 2) % h;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame / (14 + random(`t${i}`) * 20) + i));
      const r = 3 + random(`r${i}`) * 7;
      return <div key={i} style={{ position: "absolute", left: x, top: y, width: r, height: r, borderRadius: "50%", background: color, opacity: tw * 0.85, boxShadow: `0 0 ${r * 3}px ${r}px ${color}88` }} />;
    })}
  </AbsoluteFill>
);

const Rayos: React.FC<{ frame: number; color: string }> = ({ frame, color }) => (
  <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none", overflow: "hidden" }}>
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          position: "absolute", top: "-20%", left: `${8 + i * 24}%`, width: "16%", height: "150%",
          background: `linear-gradient(180deg, ${color}aa, ${color}00 75%)`, transformOrigin: "50% 0%",
          transform: `rotate(${-18 + i * 9 + Math.sin(frame / 60 + i) * 3}deg)`,
          opacity: 0.16 + 0.1 * Math.sin(frame / 38 + i * 1.7),
        }}
      />
    ))}
  </AbsoluteFill>
);

const CartaAnimada: React.FC<{ t: Tarjeta; frame: number; fps: number; tema: BloqueProps["tema"] }> = ({ t, frame, fps, tema }) => {
  const { fontFamily, weight } = getFont(tema.tipografia);
  const { width, height } = useVideoConfig();
  const ini = Math.round(t.t * fps);
  const dur = Math.round((t.dur ?? 2.4) * fps);
  const f = frame - ini;
  if (f < 0 || f > dur) return null;
  const sIn = spring({ frame: f, fps, config: { damping: 11, stiffness: 140, mass: 0.7 } });
  const sOut = interpolate(f, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const unit = width;
  const top = t.pos === "medio" ? height * 0.3 : height * 0.075;
  const col = t.color ?? tema.paleta.acento;
  const side = t.lado === "izq" ? -1 : t.lado === "der" ? 1 : 0;
  return (
    <div
      style={{
        position: "absolute", left: "50%", top, transform: `translateX(-50%) translateX(${side * unit * 0.1}px) translateY(${(1 - sIn) * -60}px) scale(${(0.6 + 0.4 * sIn) * (0.9 + 0.1 * sOut)}) rotate(${(1 - sIn) * -6 + side * 2}deg)`,
        opacity: Math.min(1, sIn) * sOut, display: "flex", alignItems: "center", gap: unit * 0.025, padding: `${unit * 0.025}px ${unit * 0.05}px`,
        borderRadius: unit * 0.05, background: "rgba(255,255,255,0.96)", border: `${unit * 0.007}px solid ${col}`,
        boxShadow: `0 ${unit * 0.015}px ${unit * 0.04}px rgba(0,0,0,0.35)`, fontFamily, whiteSpace: "nowrap",
      }}
    >
      {t.icono ? <div style={{ fontSize: unit * 0.1, lineHeight: 1, transform: `rotate(${Math.sin(f / 7) * 6}deg) scale(${1 + 0.08 * Math.sin(f / 5)})` }}>{t.icono}</div> : null}
      <div>
        {t.sub ? <div style={{ fontSize: unit * 0.032, fontWeight: 600, color: col, letterSpacing: 2, textTransform: "uppercase" }}>{t.sub}</div> : null}
        <div style={{ fontSize: unit * 0.066, fontWeight: weight, color: "#2B2B3A", lineHeight: 1.1 }}>{t.texto}</div>
      </div>
    </div>
  );
};

export const Parallax3D: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const n = Math.max(1, Math.round(durationInFrames / (PLANO_S * fps)));
  const len = durationInFrames / n;
  const k = Math.min(n - 1, Math.floor(frame / len));
  const fl = frame - k * len;
  const p = ease(Math.min(1, fl / Math.max(1, len - 1)));
  const cam = PRESETS[(index + k * 2 + (index % 2)) % PRESETS.length];
  const lerp = (r: [number, number]) => interpolate(p, [0, 1], r);
  const punch = k > 0 ? interpolate(fl, [0, 7], [1.07, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1; // corte en movimiento
  const respira = Math.sin(frame / 30) * 0.004;
  const hasSu = !!escena.sujeto;
  const bgT = `translate(${lerp(cam.panBg) * width}px, 0) scale(${(lerp(cam.bg) + respira) * punch})`;
  const suT = `translate(${lerp(cam.panSu) * width}px, ${Math.sin(frame / 24) * 6}px) perspective(1000px) rotateY(${lerp(cam.ry)}deg) rotateX(${lerp(cam.rx)}deg) scale(${(lerp(cam.su) + respira * 2) * punch})`;
  const img = (src: string): React.CSSProperties => ({ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transformOrigin: `50% ${cam.oy}%` });
  const luz = tema.paleta.primaria;
  return (
    <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: bgT, transformOrigin: `50% ${cam.oy}%` }}>
        {escena.media ? <Img src={staticFile(escena.media)} style={img(escena.media)} /> : null}
      </AbsoluteFill>
      <Rayos frame={frame} color={luz} />
      {hasSu ? (
        <AbsoluteFill style={{ transform: suT, transformOrigin: `50% ${cam.oy}%` }}>
          <Img src={staticFile(escena.sujeto as string)} style={{ ...img(escena.sujeto as string), filter: "drop-shadow(0 18px 22px rgba(0,0,0,0.35))" }} />
        </AbsoluteFill>
      ) : null}
      <Destellos frame={frame} w={width} h={height} color={"#FFE9A8"} />
    </AbsoluteFill>
  );
};
