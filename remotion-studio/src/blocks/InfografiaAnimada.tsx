import React from "react";
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import { Tarjeta, TemaVisual } from "../types";
import { getFont } from "../fonts";

// Iconos vectoriales que se DIBUJAN en pantalla (strokeDashoffset). viewBox 64x64.
const ICONOS: Record<string, string[]> = {
  arca: ["M6 36 L58 36 L50 52 L14 52 Z", "M20 36 L20 24 L44 24 L44 36", "M32 24 L32 12", "M32 12 L42 16 L32 18"],
  lluvia: ["M18 34 C8 34 8 20 20 20 C22 10 40 10 42 20 C54 20 54 34 44 34 Z", "M20 42 L17 52", "M32 42 L29 52", "M44 42 L41 52"],
  regla: ["M6 22 L58 22 L58 42 L6 42 Z", "M14 22 L14 32", "M22 22 L22 28", "M30 22 L30 32", "M38 22 L38 28", "M46 22 L46 32", "M54 22 L54 28"],
  libro: ["M8 14 L30 18 L30 52 L8 48 Z", "M56 14 L34 18 L34 52 L56 48 Z", "M14 24 L24 26", "M14 32 L24 34"],
  corazon: ["M32 54 C6 36 10 12 24 14 C28 14 31 17 32 20 C33 17 36 14 40 14 C54 12 58 36 32 54 Z"],
  estrella: ["M32 6 L39 24 L58 25 L43 37 L48 56 L32 45 L16 56 L21 37 L6 25 L25 24 Z"],
  sol: ["M32 20 A12 12 0 1 1 31.9 20 Z", "M32 4 L32 12", "M32 52 L32 60", "M4 32 L12 32", "M52 32 L60 32", "M12 12 L18 18", "M46 46 L52 52", "M52 12 L46 18", "M12 52 L18 46"],
  arcoiris: ["M6 50 A26 26 0 0 1 58 50", "M13 50 A19 19 0 0 1 51 50", "M20 50 A12 12 0 0 1 44 50"],
  paloma: ["M10 38 C22 36 30 28 34 18 C38 28 48 32 56 30 C50 40 40 48 26 48 Z", "M34 18 L40 12"],
  martillo: ["M14 18 L40 18 L40 30 L14 30 Z", "M27 30 L27 56", "M40 22 L52 22"],
  animales: ["M12 40 C12 28 24 24 32 28 C40 24 52 28 52 40 L48 52 L16 52 Z", "M18 28 L14 16", "M46 28 L50 16"],
};

const Icono: React.FC<{ nombre: string; frame: number; color: string; size: number }> = ({ nombre, frame, color, size }) => {
  const trazos = ICONOS[nombre] ?? ICONOS.estrella;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: "visible", flex: "none" }}>
      {trazos.map((d, i) => {
        const p = interpolate(frame, [i * 5, i * 5 + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
        return <path key={i} d={d} pathLength={1} fill="none" stroke={color} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} />;
      })}
    </svg>
  );
};

// Tarjeta glassmorphism infantil (traslúcida y luminosa; SIN backdrop-blur: la imagen debe seguir nítida).
export const InfografiaAnimada: React.FC<{ t: Tarjeta; frame: number; tema: TemaVisual }> = ({ t, frame, tema }) => {
  const { fps, width, height } = useVideoConfig();
  const { fontFamily, weight } = getFont(tema.tipografia);
  const ini = Math.round(t.t * fps);
  const dur = Math.round((t.dur ?? 2.6) * fps);
  const f = frame - ini;
  if (f < 0 || f > dur) return null;
  const sIn = spring({ frame: f, fps, config: { damping: 11, stiffness: 140, mass: 0.7 } });
  const sOut = interpolate(f, [dur - 8, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const u = width;
  const col = t.color ?? tema.paleta.acento;
  const c = t.contador;
  const prog = interpolate(f, [4, Math.min(dur - 10, 40)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const cifra = c ? `${c.prefijo ?? ""}${Math.round(c.desde + (c.hasta - c.desde) * prog).toLocaleString("es-MX")}${c.sufijo ?? ""}` : null;
  const top = t.pos === "medio" ? height * 0.3 : height * 0.075;
  return (
    <div
      style={{
        position: "absolute", left: "50%", top, whiteSpace: "nowrap", fontFamily, display: "flex", alignItems: "center", gap: u * 0.025,
        padding: `${u * 0.024}px ${u * 0.05}px`, borderRadius: u * 0.055,
        background: "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,246,224,0.72))",
        border: `${u * 0.006}px solid rgba(255,255,255,0.95)`, outline: `${u * 0.004}px solid ${col}`,
        boxShadow: `0 ${u * 0.014}px ${u * 0.04}px rgba(60,30,0,0.30), inset 0 0 ${u * 0.03}px rgba(255,255,255,0.8)`,
        opacity: Math.min(1, sIn) * sOut,
        transform: `translateX(-50%) translateY(${(1 - sIn) * -60}px) scale(${(0.6 + 0.4 * sIn) * (0.9 + 0.1 * sOut)}) rotate(${(1 - sIn) * -5}deg)`,
      }}
    >
      {t.svg ? <Icono nombre={t.svg} frame={f} color={col} size={u * 0.12} /> : t.icono ? <div style={{ fontSize: u * 0.1, lineHeight: 1 }}>{t.icono}</div> : null}
      <div>
        {t.sub ? <div style={{ fontSize: u * 0.031, fontWeight: 700, color: col, letterSpacing: 2, textTransform: "uppercase" }}>{t.sub}</div> : null}
        <div style={{ fontSize: u * (cifra ? 0.085 : 0.064), fontWeight: weight, color: "#2B2B3A", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
          {cifra ? <span style={{ color: col }}>{cifra} </span> : null}
          {t.texto}
        </div>
      </div>
    </div>
  );
};
