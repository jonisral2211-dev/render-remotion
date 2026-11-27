// MODO C — "vida": partículas ambientales, movimientos de cámara de anuncio, personaje (sujeto recortado) con movimiento propio y cuenta regresiva interactiva.
// Todo es determinista por fotograma (random() de Remotion con semilla): el render es reproducible y sin estado.
import React from "react";
import { AbsoluteFill, Easing, Img, random, staticFile } from "remotion";
import { getFont } from "../fonts";
import { TemaVisual } from "../types";
import { CuentaCfg, EscenaMotion, ParticulasCfg, VidaCfg } from "./tipos";
import { resolverAncla } from "./sync";

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Movimientos de cámara de anuncio sobre TODA la escena (se apila sobre CamaraSigue). dur = fotogramas de la escena. */
export const MovCamara: React.FC<{ frame: number; fps: number; dur: number; mov?: string; dir?: number; children: React.ReactNode }> = ({ frame, fps, dur, mov, dir = 1, children }) => {
  const p = clamp01(frame / Math.max(1, dur));
  const pe = Easing.inOut(Easing.quad)(p);
  let sc = 1, tx = 0, ty = 0, rot = 0, blur = 0;
  switch (mov) {
    case "push_in": sc = 1.02 + 0.11 * pe; break;
    case "pull_out": sc = 1.13 - 0.11 * pe; break;
    case "whip_in": {
      const fw = Math.max(4, Math.round(0.45 * fps));
      if (frame < fw) { const q = EASE(frame / fw); tx = dir * 24 * (1 - q); blur = 18 * (1 - q); sc = 1.06 + 0.08 * (1 - q); }
      else sc = 1.06 - 0.01 * Math.min(1, (frame - fw) / (fps * 2)) + 0.05 * pe;
      break;
    }
    case "orbit": rot = dir * (-1.7 + 3.4 * pe); tx = dir * (-2.2 + 4.4 * pe); sc = 1.1; break;
    case "tracking": tx = dir * (-4.5 + 9 * pe); sc = 1.1; break;
    case "rack_focus": blur = 10 * (1 - EASE(clamp01(frame / (fps * 1.1)))); sc = 1.04 + 0.04 * p; break;
    case "speed_ramp": sc = 1.02 + 0.2 * Math.pow(p, 2.6); blur = 6 * Math.pow(clamp01((p - 0.82) / 0.18), 2); break;
    default: break;
  }
  if (!mov) return <>{children}</>;
  return (
    <div style={{ position: "absolute", inset: 0, transformOrigin: "50% 50%", transform: `translate(${tx}%, ${ty}%) rotate(${rot}deg) scale(${sc})`, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
      {children}
    </div>
  );
};

/** Fondo + personaje recortado con vida propia: respiración, balanceo desde los pies, flotación y empuje propio (paralaje contra el fondo). */
export const CapasVivas: React.FC<{ capas: { fondo: string; sujeto: string }; frame: number; fps: number; dur: number; vida?: VidaCfg; H: number }> = ({ capas, frame, fps, dur, vida, H }) => {
  const t = frame / fps;
  const p = clamp01(frame / Math.max(1, dur));
  const bal = vida?.balanceo ?? 1.2;
  const res = vida?.respiracion ?? 0.014;
  const flo = vida?.flota ?? 0.006;
  const ph = vida?.fase ?? 0;
  const rot = Math.sin(t * 1.7 + ph) * bal;
  const sc = 1 + res * Math.sin(t * 2.4 + ph) + 0.055 * p;
  const dy = Math.sin(t * 1.3 + ph) * flo * H;
  const dx = Math.sin(t * 0.9 + ph + 1) * flo * H * 0.5;
  const img: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };
  return (
    <>
      <Img src={staticFile(capas.fondo)} style={{ ...img, transform: `scale(${1 + 0.018 * p}) translate(${(-0.4 * p).toFixed(3)}%, 0)` }} />
      <Img src={staticFile(capas.sujeto)} style={{ ...img, transformOrigin: "50% 94%", transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${sc.toFixed(4)})`, filter: "drop-shadow(0 14px 18px rgba(0,0,0,0.30))" }} />
    </>
  );
};

const BASE: Record<ParticulasCfg["tipo"], number> = { polvo: 46, brillos: 26, lluvia: 90, lana: 18, agua: 30, chispas: 34, hojas: 16 };

/** Partículas ambientales (polvo, brillos, lluvia, lana, agua, chispas, hojas). */
export const Particulas: React.FC<{ cfgs: ParticulasCfg[]; frame: number; W: number; H: number; seed: string }> = ({ cfgs, frame, W, H, seed }) => (
  <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
    {cfgs.flatMap((c) => {
      const n = Math.max(1, Math.round(BASE[c.tipo] * (c.densidad ?? 1)));
      return Array.from({ length: n }, (_, k) => {
        const r = (s: string) => random(`${seed}${c.tipo}${s}${k}`);
        const x0 = r("x"), y0 = r("y"), v = 0.5 + r("v"), ph = r("p") * 6.28;
        const base: React.CSSProperties = { position: "absolute", pointerEvents: "none" };
        switch (c.tipo) {
          case "polvo": {
            const s = 2 + r("s") * 4;
            const x = x0 * W + Math.sin(frame * 0.02 * v + ph) * 36;
            const y = mod(y0 * H - frame * 0.5 * v, H);
            return <div key={`${c.tipo}${k}`} style={{ ...base, left: x, top: y, width: s, height: s, borderRadius: "50%", background: c.color ?? "rgba(255,244,214,0.6)", opacity: 0.35 + 0.35 * Math.sin(frame * 0.05 + ph) ** 2 }} />;
          }
          case "brillos": {
            const s = 7 + r("s") * 14;
            const x = x0 * W + Math.sin(frame * 0.015 + ph) * 20;
            const y = y0 * H + Math.cos(frame * 0.012 + ph) * 16;
            const o = 0.15 + 0.85 * Math.max(0, Math.sin(frame * 0.1 * v + ph)) ** 2;
            return <div key={`${c.tipo}${k}`} style={{ ...base, left: x, top: y, width: s, height: s, borderRadius: "50%", background: `radial-gradient(circle, ${c.color ?? "#FFF1B0"} 0%, rgba(255,230,140,0.0) 70%)`, opacity: o, transform: `scale(${0.7 + 0.5 * o})` }} />;
          }
          case "lluvia": {
            const len = 40 + r("s") * 60;
            const sp = 30 + v * 14;
            const y = mod(y0 * (H + 200) + frame * sp, H + 200) - 100;
            const x = mod(x0 * (W + 300) - frame * sp * 0.2, W + 300) - 150;
            return <div key={`${c.tipo}${k}`} style={{ ...base, left: x, top: y, width: 2, height: len, background: c.color ?? "rgba(210,225,255,0.55)", transform: "rotate(12deg)", borderRadius: 2 }} />;
          }
          case "lana": {
            const s = 14 + r("s") * 22;
            const x = mod(x0 * W + frame * 0.7 * v, W + 60) - 30;
            const y = y0 * H + Math.sin(frame * 0.02 * v + ph) * 26;
            return <div key={`${c.tipo}${k}`} style={{ ...base, left: x, top: y, width: s, height: s * 0.8, borderRadius: "50%", background: `radial-gradient(circle at 40% 40%, ${c.color ?? "rgba(255,255,255,0.95)"}, rgba(240,240,240,0.55) 70%, rgba(255,255,255,0))`, transform: `rotate(${frame * 0.6 * v + ph * 20}deg)`, opacity: 0.8 }} />;
          }
          case "agua": {
            const s = 8 + r("s") * 20;
            const y = mod(y0 * H - frame * 1.4 * v, H + 40) - 20;
            const x = x0 * W + Math.sin(frame * 0.04 * v + ph) * 22;
            return <div key={`${c.tipo}${k}`} style={{ ...base, left: x, top: y, width: s, height: s, borderRadius: "50%", border: `2px solid ${c.color ?? "rgba(200,235,255,0.85)"}`, background: "rgba(120,190,255,0.22)", boxShadow: "inset -2px -2px 4px rgba(255,255,255,0.5)" }} />;
          }
          case "chispas": {
            const s = 3 + r("s") * 5;
            const life = mod(frame * 0.012 * v + r("l"), 1);
            const x = x0 * W + Math.sin(life * 9 + ph) * 34;
            const y = H * (1.0 - life * 1.05);
            return <div key={`${c.tipo}${k}`} style={{ ...base, left: x, top: y, width: s, height: s, borderRadius: "50%", background: c.color ?? "#FFB347", boxShadow: `0 0 ${s * 3}px ${c.color ?? "#FF9A2E"}`, opacity: Math.sin(life * Math.PI) }} />;
          }
          case "hojas": {
            const s = 12 + r("s") * 14;
            const y = mod(y0 * H + frame * 1.3 * v, H + 60) - 30;
            const x = x0 * W + Math.sin(frame * 0.03 * v + ph) * 70;
            return <div key={`${c.tipo}${k}`} style={{ ...base, left: x, top: y, width: s, height: s * 0.55, borderRadius: "100% 0 100% 0", background: c.color ?? (k % 2 ? "#8DB33A" : "#C98B2B"), transform: `rotate(${frame * 2.2 * v + ph * 40}deg)`, opacity: 0.9 }} />;
          }
          default: return null;
        }
      });
    })}
  </AbsoluteFill>
);

/** Momento interactivo: cuenta regresiva visual de `desde` segundos (3-2-1) con anillo que se vacía y pregunta; no tapa el centro de la acción. */
export const Cuenta: React.FC<{ cfg: CuentaCfg; e: EscenaMotion; frame: number; fps: number; W: number; H: number; tema: TemaVisual }> = ({ cfg, e, frame, fps, W, H, tema }) => {
  const desde = cfg.desde ?? 3;
  // ancla "fin": la cuenta ocupa justo los últimos `desde` segundos de la escena (la pausa de silencio que deja espacio para responder)
  const f0 = cfg.ancla === "fin" ? Math.round((e.end - desde - e.start) * fps) : Math.round((resolverAncla(cfg.ancla, e) - e.start) * fps);
  const f = frame - f0;
  const total = desde * fps;
  if (f < -8 || f > total + Math.round(0.5 * fps)) return null;
  const sec = Math.min(desde - 1, Math.max(0, Math.floor(f / fps)));
  const num = desde - sec;
  const within = clamp01(f / fps - sec);
  const pop = 1 + 0.38 * Math.pow(1 - clamp01(within * 2.2), 2);
  const aparece = clamp01((f + 8) / 8) * (1 - clamp01((f - total) / (0.5 * fps)));
  const vert = H > W;
  const D = Math.round(vert ? W * 0.36 : H * 0.27);
  const cx = (cfg.x ?? 0.5) * W, cy = (cfg.y ?? (vert ? 0.27 : 0.64)) * H; // centro-inferior: no tapa caras y en la pausa interactiva no hay subtitulos // siempre en la columna central: sobrevive al recorte 9:16 centrado // vertical: zona segura central-alta (lejos de los botones laterales y de la barra inferior de TikTok)
  const font = getFont(tema.tipografia);
  const ang = 360 * (1 - within);
  const col = tema.paleta.acento;
  return (
    <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%, -50%) scale(${f < 0 ? 0.6 + 0.4 * aparece : 1})`, opacity: aparece, pointerEvents: "none" }}>
      <div style={{ width: D, height: D, borderRadius: "50%", background: `conic-gradient(${col} ${ang}deg, rgba(255,255,255,0.22) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.35)" }}>
        <div style={{ width: D * 0.82, height: D * 0.82, borderRadius: "50%", background: "rgba(20,14,40,0.78)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: font.fontFamily, fontWeight: font.weight, fontSize: D * 0.5, color: "#FFFFFF", transform: `scale(${pop})`, textShadow: `0 0 28px ${col}` }}>{num}</span>
        </div>
      </div>
      {cfg.texto ? (
        <div style={{ marginTop: 14, textAlign: "center", fontFamily: font.fontFamily, fontWeight: font.weight, fontSize: Math.round(vert ? W * 0.06 : H * 0.05), color: "#fff", background: col, padding: "0.18em 0.7em", borderRadius: 999, boxShadow: "0 6px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>{cfg.texto}</div>
      ) : null}
    </div>
  );
};
