// MODO C — efectos de motion graphics: revelado por máscara con guías, elemento con movimiento encadenado/énfasis,
// cámara que sigue el punto de interés y transición por expansión de un objeto hacia la escena siguiente.
import React from "react";
import { Easing, Img, staticFile } from "remotion";
import { getFont } from "../fonts";
import { TemaVisual } from "../types";
import { Dir, TransExpansion } from "./tipos";
import { ElementoPlan } from "./sync";

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Revelado por máscara con guías limpias: la máscara avanza en `dir` y dos líneas finas marcan su borde. */
export const RevealMask: React.FC<{ p: number; dir?: Dir; guias?: boolean; color: string; children: React.ReactNode }> = ({ p, dir = "izq", guias = true, color, children }) => {
  const pr = EASE(clamp01(p));
  const r = (1 - pr) * 100; // % aún oculto
  const clip = dir === "izq" ? `inset(0 ${r}% 0 0)` : dir === "der" ? `inset(0 0 0 ${r}%)` : dir === "arriba" ? `inset(0 0 ${r}% 0)` : `inset(${r}% 0 0 0)`;
  const horiz = dir === "izq" || dir === "der";
  const pos = dir === "izq" || dir === "arriba" ? pr * 100 : (1 - pr) * 100;
  const show = guias && pr > 0.02 && pr < 0.98;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ clipPath: clip }}>{children}</div>
      {show ? (
        <>
          <div style={{ position: "absolute", background: color, opacity: 0.9, boxShadow: `0 0 10px ${color}`, ...(horiz ? { top: -6, bottom: -6, width: 3, left: `${pos}%` } : { left: -6, right: -6, height: 3, top: `${pos}%` }) }} />
          <div style={{ position: "absolute", background: color, opacity: 0.45, ...(horiz ? { top: -6, bottom: -6, width: 1, left: `calc(${pos}% - 10px)` } : { left: -6, right: -6, height: 1, top: `calc(${pos}% - 10px)` }) }} />
        </>
      ) : null}
    </div>
  );
};

/** Un elemento animado: entra (revelado/deslizar/zoom/fade) desde el punto del elemento anterior si está encadenado, y recibe énfasis. */
export const ElementoMov: React.FC<{ plan: ElementoPlan; frame: number; W: number; H: number; tema: TemaVisual }> = ({ plan, frame, W, H, tema }) => {
  const { el, f0, dur, fOut, durOut, from, to } = plan;
  if (frame < f0 || frame > fOut + durOut) return null;
  const pIn = clamp01((frame - f0) / dur);
  const pOut = clamp01((frame - fOut) / durOut);
  const e = EASE(pIn);
  const efecto = el.entrada.efecto;
  const x = (efecto === "deslizar" || el.encadena ? from.x + (to.x - from.x) * e : to.x) * W;
  const y = (efecto === "deslizar" || el.encadena ? from.y + (to.y - from.y) * e : to.y) * H;
  let scale = efecto === "zoom" ? 0.6 + 0.4 * e : 1;
  let color = el.color ?? tema.paleta.texto;
  let dx = 0;
  for (const en of plan.enf) {
    const q = clamp01((frame - en.f) / en.dur);
    if (q <= 0 || q >= 1) continue;
    if (en.efecto === "pulso") scale *= 1 + 0.14 * Math.sin(q * Math.PI);
    else if (en.efecto === "resalte") color = tema.paleta.acento;
    else if (en.efecto === "sacudida") dx += Math.sin(q * Math.PI * 8) * 8 * (1 - q);
  }
  const opacity = (efecto === "fade" || efecto === "zoom" ? e : efecto === "deslizar" ? Math.min(1, pIn * 3) : 1) * (1 - EASE(pOut));
  const ancho = (el.ancho ?? 0.6) * W;
  const font = getFont(tema.tipografia);
  const contenido =
    el.tipo === "texto" ? (
      <div style={{ fontFamily: font.fontFamily, fontWeight: font.weight, color, fontSize: Math.round(W * 0.075), lineHeight: 1.1, textAlign: "center", textShadow: "0 4px 18px rgba(0,0,0,0.45)", WebkitTextStroke: `${Math.round(W * 0.006)}px rgba(30,12,50,0.92)`, paintOrder: "stroke fill", width: ancho }}>{el.texto}</div>
    ) : el.tipo === "imagen" && el.media ? (
      <Img src={staticFile(el.media)} style={{ width: ancho, height: "auto", display: "block" }} />
    ) : (
      <div style={{ width: ancho, height: ancho, background: el.color ?? tema.paleta.acento, borderRadius: el.forma === "circulo" ? "50%" : el.forma === "rombo" ? 0 : 24, transform: el.forma === "rombo" ? "rotate(45deg)" : undefined }} />
    );
  const cuerpo = efecto === "revelado_mascara" ? (
    <RevealMask p={pIn} dir={el.entrada.dir} guias={el.entrada.guias ?? true} color={tema.paleta.acento}>{contenido}</RevealMask>
  ) : contenido;
  return (
    <div style={{ position: "absolute", left: x + dx, top: y, transform: `translate(-50%, -50%) scale(${scale})`, opacity, willChange: "transform, opacity" }}>{cuerpo}</div>
  );
};

/** Cámara que sigue el punto de interés: transforma el "mundo" (imagen + elementos) para centrar el foco, con suavizado y sin salir del encuadre. */
export const CamaraSigue: React.FC<{
  frame: number; fps: number; W: number; H: number; zoom: number; suavizado: number;
  puntos: { f: number; x: number; y: number; zoom?: number }[]; children: React.ReactNode;
}> = ({ frame, fps, W, H, zoom, suavizado, puntos, children }) => {
  let fx = 0.5, fy = 0.5, z = 1;
  if (puntos.length) {
    const ps = [...puntos].sort((a, b) => a.f - b.f);
    if (ps[0].f > 0) ps.unshift({ f: 0, x: 0.5, y: 0.5, zoom: 1 }); // parte del encuadre completo y se desplaza al primer punto de interés
    const tr = Math.max(2, Math.round(suavizado * fps));
    let cur = ps[0];
    let prev = ps[0];
    for (const p of ps) if (frame >= p.f) { prev = cur; cur = p; }
    const k = EASE(clamp01((frame - cur.f) / tr));
    fx = prev === cur ? cur.x : prev.x + (cur.x - prev.x) * k;
    fy = prev === cur ? cur.y : prev.y + (cur.y - prev.y) * k;
    const zt = cur.zoom ?? zoom;
    const zp = prev.zoom ?? zoom;
    z = prev === cur ? zt : zp + (zt - zp) * k;
    z = Math.max(1, z * (1 + 0.02 * clamp01(frame / (fps * 4)))); // deriva mínima: nunca 100 % quieto
  }
  const tx = Math.max(W - z * W, Math.min(0, W / 2 - z * fx * W));
  const ty = Math.max(H - z * H, Math.min(0, H / 2 - z * fy * H));
  return <div style={{ position: "absolute", inset: 0, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${z})` }}>{children}</div>;
};

/** Transición por expansión: la escena entrante se revela dentro de una forma que crece desde el objeto de origen; borde luminoso. */
export const ExpansionReveal: React.FC<{ frame: number; dur: number; t: TransExpansion; W: number; H: number; acento: string; children: React.ReactNode }> = ({ frame, dur, t, W, H, acento, children }) => {
  const p = Easing.inOut(Easing.cubic)(clamp01(frame / Math.max(1, dur))); // inOut: el crecimiento de la forma se ve de principio a fin
  const cx = t.origen.x * W, cy = t.origen.y * H;
  const rMax = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * (t.forma === "rombo" ? 1.45 : 1.02);
  const r = rMax * p;
  const done = p >= 1;
  const clip = done ? "none"
    : t.forma === "circulo" ? `circle(${r}px at ${cx}px ${cy}px)`
    : t.forma === "rombo" ? `polygon(${cx}px ${cy - r}px, ${cx + r}px ${cy}px, ${cx}px ${cy + r}px, ${cx - r}px ${cy}px)`
    : `polygon(${cx - r}px ${cy - r}px, ${cx + r}px ${cy - r}px, ${cx + r}px ${cy + r}px, ${cx - r}px ${cy + r}px)`;
  const color = t.color ?? acento;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, clipPath: clip }}>{children}</div>
      {!done && p > 0.01 ? (
        <div style={{ position: "absolute", left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: t.forma === "circulo" ? "50%" : 0, transform: t.forma === "rombo" ? "rotate(45deg) scale(0.7071)" : undefined,
          border: `${Math.max(2, 8 * (1 - p))}px solid ${color}`, boxShadow: `0 0 24px ${color}`, opacity: 1 - p * 0.6, pointerEvents: "none", boxSizing: "border-box" }} />
      ) : null}
    </div>
  );
};
