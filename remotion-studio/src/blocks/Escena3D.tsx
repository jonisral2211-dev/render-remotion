import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BloqueProps } from "./common";
import { Capa3D, Camara3D, Part3D } from "../types";
import { Textura } from "../components/Textura";
import { PERFILES, Perfil, TarjetaEstilo } from "../theme";

// MODO B · escena 3D real por ingredientes. El perfil (tema.sub_estilo = B1..B6) decide paleta, tarjetas, textura, cámara y partículas.
// Capas separadas en eje Z dentro de un escenario con perspective + preserve-3d; cámara X/Y/Z con Easing.bezier.
const PERSP = 1200; // el ojo está 1500 px por detrás del plano z = 0
const CAM0: Camara3D = { x: 0, y: 0, z: 0, ry: 0, rx: 0 };
const PERFIL_BASE: Perfil = PERFILES.B2_3D_INGREDIENTES;

const lerpCam = (a: Camara3D, b: Camara3D, e: number): Required<Camara3D> => ({
  x: interpolate(e, [0, 1], [a.x, b.x]),
  y: interpolate(e, [0, 1], [a.y, b.y]),
  z: interpolate(e, [0, 1], [a.z, b.z]),
  ry: interpolate(e, [0, 1], [a.ry ?? 0, b.ry ?? 0]),
  rx: interpolate(e, [0, 1], [a.rx ?? 0, b.rx ?? 0]),
});

const Particulas3D: React.FC<{ tipo: Part3D; frame: number; w: number; h: number }> = ({ tipo, frame, w, h }) => {
  if (tipo === "ninguna") return null;
  const N = 54;
  const cfg = {
    polvo: { color: "rgba(243,235,221,0.55)", size: 3, vy: -0.25, vx: 0.15, blur: 1 },
    brasas: { color: "rgba(255,150,40,0.95)", size: 4, vy: -1.6, vx: 0.4, blur: 2 },
    lluvia: { color: "rgba(200,220,240,0.55)", size: 2, vy: 16, vx: -2, blur: 0 },
    nieve: { color: "rgba(255,255,255,0.8)", size: 5, vy: 1.4, vx: 0.5, blur: 1 },
  }[tipo];
  const out: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const z = [-900, 0, 700][i % 3]; // lejos, medio, muy cerca
    const k = (PERSP + z) / PERSP;
    const sx = random(`px${i}`) * w * 1.2 - w * 0.1;
    const sy = random(`py${i}`) * h * 1.2 - h * 0.1;
    const x = (((sx + frame * cfg.vx * k + Math.sin(frame / 40 + i) * 14) % w) + w) % w;
    const y = (((sy + frame * cfg.vy * k) % h) + h) % h;
    const long = tipo === "lluvia";
    out.push(
      <div
        key={i}
        style={{
          position: "absolute", left: x, top: y,
          width: long ? 1.5 * k : cfg.size * k, height: long ? 26 * k : cfg.size * k,
          borderRadius: 99, background: cfg.color,
          filter: `blur(${z > 300 ? 3 : z < -300 ? 1.5 : cfg.blur}px)`,
          boxShadow: tipo === "brasas" ? "0 0 8px rgba(255,120,20,0.9)" : undefined,
          opacity: 0.35 + 0.65 * random(`po${i}`),
        }}
      />,
    );
  }
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{out}</AbsoluteFill>;
};

// Aspecto de cada tarjeta según nicho
const tarjetaCss = (t: TarjetaEstilo, acento: string, texto: string): React.CSSProperties => {
  switch (t) {
    case "papel": return { background: "rgba(243,235,221,0.94)", color: "#0D0B0A", border: `3px solid ${acento}`, borderRadius: 6 };
    case "dorado": return { background: "linear-gradient(160deg, rgba(40,26,8,0.92), rgba(12,8,3,0.92))", color: "#F6E9CF", border: "3px solid #FFD700", borderRadius: 4, boxShadow: "0 0 40px rgba(255,215,0,0.25), 0 30px 60px rgba(0,0,0,0.6)" };
    case "editorial": return { background: "rgba(14,20,32,0.92)", color: texto, borderLeft: `8px solid ${acento}`, borderRadius: 10 };
    case "expediente": return { background: "rgba(222,208,170,0.92)", color: "#1A1208", border: "2px dashed #5b4a2a", borderRadius: 2, transform: "rotate(-1.2deg)" };
    case "etiqueta": return { background: "rgba(4,12,28,0.78)", color: texto, border: `2px solid ${acento}`, borderRadius: 8, backdropFilter: "blur(6px)" };
    default: return { background: "rgba(10,14,30,0.82)", color: texto, border: `3px solid ${acento}`, borderRadius: 18 };
  }
};

const fmt = (n: number, dec = 0) => n.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const Capa: React.FC<{ capa: Capa3D; frame: number; width: number; foco: number | undefined; perfil: Perfil; paleta: { texto: string; acento: string }; dur: number }> = ({ capa, frame, width, foco, perfil, paleta, dur }) => {
  const k = (PERSP + capa.z) / PERSP; // a su profundidad conserva el tamaño pedido
  const w = (capa.ancho ?? 1) * width * k;
  const f = capa.flota ?? (capa.tipo === "sujeto" ? 6 : 0);
  const fy = f ? Math.sin(frame / 28 + capa.z) * f : 0;
  const blur = foco === undefined ? 0 : Math.min(14, Math.abs(capa.z - foco) / 140); // SIN foco_z explícito: cero desenfoque (nitidez total) // desenfoque óptico entre planos
  const sombra = capa.sombra ?? capa.tipo === "sujeto";
  const base: React.CSSProperties = {
    position: "absolute", left: "50%", top: "50%", width: w,
    transform: `translate3d(${(capa.x ?? 0) - w / 2}px, ${(capa.y ?? 0) + fy}px, ${-capa.z}px) translateY(-50%)`,
    filter: `${blur > 0.4 ? `blur(${blur.toFixed(2)}px) ` : ""}${sombra ? `drop-shadow(${perfil.textura ? 0 : 14}px 26px 28px rgba(0,0,0,0.65))` : ""}`.trim() || undefined,
    backfaceVisibility: "hidden",
  };
  const entra = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  if (capa.tipo === "etiqueta") {
    // Señalador animado con línea guía (B6): la línea se dibuja y luego aparece el rótulo
    const to = capa.linea_a ?? { x: 0, y: 0 };
    const len = Math.hypot(to.x - (capa.x ?? 0), to.y - (capa.y ?? 0));
    const dibuja = interpolate(frame, [6, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return (
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate3d(0,0,${-capa.z}px)`, width: 0, height: 0 }}>
        <svg width={width} height={width} viewBox={`${-width / 2} ${-width / 2} ${width} ${width}`} style={{ position: "absolute", left: -width / 2, top: -width / 2, overflow: "visible" }}>
          <line x1={capa.x ?? 0} y1={capa.y ?? 0} x2={to.x} y2={to.y} stroke={paleta.acento} strokeWidth={3} strokeDasharray={len} strokeDashoffset={len * (1 - dibuja)} />
          <circle cx={to.x} cy={to.y} r={10 * dibuja} fill={paleta.acento} />
        </svg>
        <div style={{ position: "absolute", transform: `translate(${(capa.x ?? 0)}px, ${(capa.y ?? 0)}px) translate(-50%,-50%)`, opacity: interpolate(frame, [18, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), padding: "14px 24px", whiteSpace: "nowrap", fontFamily: "inherit", ...tarjetaCss("etiqueta", paleta.acento, paleta.texto) }}>
          {capa.texto ? <div style={{ fontSize: 34, letterSpacing: 2, textTransform: "uppercase" }}>{capa.texto}</div> : null}
          {capa.dato ? <div style={{ fontSize: 56, fontWeight: 800, color: paleta.acento }}>{capa.dato}</div> : null}
        </div>
      </div>
    );
  }
  if (capa.tipo === "tarjeta") {
    const c = capa.contador;
    const prog = interpolate(frame, [4, Math.min(dur - 6, 54)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const cifra = c ? `${c.prefijo ?? ""}${fmt(c.desde + (c.hasta - c.desde) * prog, c.decimales ?? 0)}${c.sufijo ?? ""}` : capa.dato;
    const sub = interpolate(frame, [14, 34], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    const css = tarjetaCss(perfil.tarjeta, paleta.acento, paleta.texto);
    return (
      <div style={{ ...base, padding: "28px 36px", opacity: entra, boxShadow: "0 30px 60px rgba(0,0,0,0.55)", fontFamily: "inherit", ...css, transform: `${base.transform}${css.transform ? " " + css.transform : ""}` }}>
        {capa.texto ? <div style={{ fontSize: 30, letterSpacing: 4, textTransform: "uppercase", opacity: 0.85 }}>{capa.texto}</div> : null}
        {cifra ? <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05, color: perfil.tarjeta === "papel" ? "#8A5A12" : perfil.tarjeta === "expediente" ? "#7a0f1f" : paleta.acento, fontVariantNumeric: "tabular-nums" }}>{cifra}</div> : null}
        {capa.subrayar ? <div style={{ marginTop: 10, height: 6, width: `${sub}%`, background: perfil.tarjeta === "expediente" ? "#B3122E" : paleta.acento, borderRadius: 3 }} /> : null}
      </div>
    );
  }
  return <Img src={staticFile(capa.media)} style={{ ...base, height: "auto" }} />;
};


// ---------------------------------------------------------------------------------------------------------------
// ESCENA 3D DE 3 CAPAS (bg / subject / fg) con 6 presets de cámara de cine. Planos de ~3,4 s; respiración orgánica continua.
export const PRESETS_CAMARA = ["dolly_in_epico", "orbita_3d", "tilt_revelacion", "whip_pan_blur", "zoom_impacto_spring", "flotacion_suave"] as const;
const SHOT_S = 3.4;

const camaraPreset = (nombre: string, p: number, fl: number, fps: number): Required<Camara3D> & { whip: number } => {
  const e = Easing.bezier(0.25, 0.1, 0.25, 1)(p);
  let c = { x: 0, y: 0, z: 0, ry: 0, rx: 0, whip: 0 };
  switch (nombre) {
    case "dolly_in_epico": c = { ...c, z: interpolate(e, [0, 1], [0, 300]), y: interpolate(e, [0, 1], [30, -20]) }; break;
    case "orbita_3d": c = { ...c, ry: interpolate(e, [0, 1], [-9, 9]), x: interpolate(e, [0, 1], [-60, 60]), z: interpolate(e, [0, 1], [20, 110]) }; break;
    case "tilt_revelacion": c = { ...c, y: interpolate(e, [0, 1], [190, -190]), rx: interpolate(e, [0, 1], [4, -4]), z: interpolate(e, [0, 1], [40, 120]) }; break;
    case "whip_pan_blur": {
      const w = interpolate(fl, [0, 9], [1, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
      c = { ...c, x: w * 900 + interpolate(e, [0, 1], [-20, 20]), z: interpolate(e, [0, 1], [0, 90]), whip: w };
      break;
    }
    case "zoom_impacto_spring": {
      const sp = spring({ frame: fl, fps, config: { damping: 7, stiffness: 120, mass: 0.8 } });
      c = { ...c, z: sp * 280 + interpolate(e, [0, 1], [0, 50]), ry: (1 - sp) * 4 };
      break;
    }
    default: c = { ...c, x: Math.sin(fl / 38) * 45, y: Math.cos(fl / 31) * 35, z: interpolate(e, [0, 1], [0, 70]), ry: Math.sin(fl / 52) * 3 }; // flotacion_suave
  }
  return c;
};

const Escena3Capas: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const n = Math.max(1, Math.round(durationInFrames / (SHOT_S * fps)));
  const len = durationInFrames / n;
  const k = Math.min(n - 1, Math.floor(frame / len));
  const fl = frame - k * len;
  const p = Math.min(1, fl / Math.max(1, len - 1));
  const nombre = escena.camaras?.[k] ?? PRESETS_CAMARA[(index * 2 + k) % PRESETS_CAMARA.length];
  const cam = camaraPreset(nombre, p, fl, fps);
  // respiración orgánica: nunca hay un fotograma 100 % quieto
  const rx = Math.sin(frame / 37) * 7, ry = Math.cos(frame / 29) * 6, rz = Math.sin(frame / 83) * 0.35;
  const punch = k > 0 ? interpolate(fl, [0, 6], [1.05, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
  const sd = cam.whip * 38;
  const capas: Capa3D[] = [
    { media: escena.bg as string, tipo: "fondo", z: 380, ancho: 1, sombra: false, flota: 0 },
    ...(escena.subject ? [{ media: escena.subject, tipo: "sujeto" as const, z: 0, ancho: 1, sombra: false, flota: 0 }] : []),
    ...(escena.fg ? [{ media: escena.fg, tipo: "primer_plano" as const, z: -220, ancho: 1, sombra: false, flota: 0 }] : []),
  ];
  const perfil: Perfil = PERFIL_BASE;
  return (
    <AbsoluteFill style={{ background: tema.paleta.fondo, overflow: "hidden", filter: sd > 0.5 ? "url(#whipblur)" : undefined, transform: `scale(${punch})` }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="whipblur" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation={`${sd.toFixed(1)} 0`} /></filter>
      </svg>
      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translate3d(${-cam.x + rx}px, ${-cam.y + ry}px, ${cam.z}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${rz}deg)` }}>
          {capas.map((c, i) => (
            <Capa key={i} capa={c} frame={frame} width={width} foco={undefined} perfil={perfil} paleta={tema.paleta} dur={durationInFrames} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Escena3D: React.FC<BloqueProps> = (props) => (props.escena.bg ? <Escena3Capas {...props} /> : <Escena3DLegacy {...props} />);

const Escena3DLegacy: React.FC<BloqueProps> = ({ escena, tema }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const perfil: Perfil = (tema.sub_estilo && tema.sub_estilo !== "estandar" ? PERFILES[tema.sub_estilo] : undefined) ?? PERFIL_BASE;
  const ease = Easing.bezier(...perfil.easing);
  const p = frame / Math.max(1, durationInFrames - 1);
  const cam = lerpCam(escena.cam_desde ?? CAM0, escena.cam_hasta ?? { x: 0, y: 0, z: perfil.push, ry: 0 }, ease(p));
  // Micro-vibración orgánica de cámara (B1, B5) o pedida en la escena
  const v = escena.vibracion ? Math.max(perfil.vibracion, 2) : perfil.vibracion;
  const tem = v > 0 ? { x: (Math.sin(frame * 0.9) + 0.6 * Math.sin(frame * 2.1)) * v, y: (Math.cos(frame * 1.1) + 0.6 * Math.cos(frame * 1.9)) * v } : { x: 0, y: 0 };
  const foco = escena.foco_z;
  const capas = [...(escena.capas ?? [])].sort((a, b) => b.z - a.z); // lejos primero
  const iris = escena.iris ?? (perfil.iris ? { x: 0.5, y: 0.5 } : undefined);
  const irisR = iris ? interpolate(frame, [0, 14], [0, Math.hypot(width, height)], { extrapolateRight: "clamp", easing: ease }) : 0;
  const clip = iris && frame < 16 ? `circle(${irisR}px at ${iris.x * 100}% ${iris.y * 100}%)` : undefined;
  const parts = escena.particulas3d ?? perfil.particulas;

  return (
    <AbsoluteFill style={{ background: tema.paleta.fondo, clipPath: clip, overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: "50% 50%" }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translate3d(${-cam.x + tem.x}px, ${-cam.y + tem.y}px, ${cam.z}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg)` }}>
          {capas.map((c, i) => (
            <Capa key={i} capa={c} frame={frame} width={width} foco={foco} perfil={perfil} paleta={tema.paleta} dur={durationInFrames} />
          ))}
        </div>
      </AbsoluteFill>
      <Particulas3D tipo={parts} frame={frame} w={width} h={height} />
      {perfil.textura ? <Textura frame={frame} tinte={perfil.tinte} letterbox={perfil.letterbox} /> : perfil.letterbox > 0 ? <Textura frame={frame} letterbox={perfil.letterbox} /> : null}
    </AbsoluteFill>
  );
};
