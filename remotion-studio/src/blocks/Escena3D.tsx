import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BloqueProps } from "./common";
import { Capa3D, Camara3D, Escena, Part3D } from "../types";
import { Textura } from "../components/Textura";
import { PERFILES, Perfil, TarjetaEstilo, estiloDe } from "../theme";
import { CAM_PRESETS, CamPreset, microPlano, normPreset, pose } from "../camara";

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
// v4 · ESCENA 3D DE 3 CAPAS (bg / subject / fg) con cámara MULTIFASE (camara.ts): 2-3 micro-planos por escena, impulso de entrada,
// traslación + rotación X/Y/Z + zoom y remate a detalle. Si solo hay `media` (sin capas separadas) esa imagen hace de fondo.
export const PRESETS_CAMARA = CAM_PRESETS;

const Escena3Capas: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();
  const mp = microPlano(frame, durationInFrames, fps, escena.planos);
  const nombre: CamPreset = normPreset(escena.camaras?.[mp.k]) ?? CAM_PRESETS[(index * 2 + mp.k) % CAM_PRESETS.length];
  const dir: 1 | -1 = (index + mp.k) % 2 === 0 ? 1 : -1;
  const c = pose(nombre, mp.p, mp.fl, fps, dir);
  const foco = escena.foco ?? { x: 0.5, y: 0.4 };
  const est = estiloDe(tema);
  const camZ = PERSP * (1 - 1 / c.zoom); // zoom -> avance de cámara en Z (escala = PERSP/(PERSP - z))
  const rx = Math.sin(frame / 37) * 7, ry = Math.cos(frame / 29) * 6, rz = Math.sin(frame / 83) * 0.35; // respiración orgánica
  const sd = c.whip * 38;
  const bg = (escena.bg ?? escena.media) as string;
  const capas: Capa3D[] = [
    { media: bg, tipo: "fondo", z: 380, ancho: 1, sombra: false, flota: 0 },
    ...(escena.subject ? [{ media: escena.subject, tipo: "sujeto" as const, z: 0, ancho: 1, sombra: false, flota: 0 }] : []),
    ...(escena.fg ? [{ media: escena.fg, tipo: "primer_plano" as const, z: -220, ancho: 1, sombra: false, flota: 0 }] : []),
  ];
  const perfil: Perfil = PERFIL_BASE;
  return (
    <AbsoluteFill style={{ background: tema.paleta.fondo, overflow: "hidden", filter: sd > 0.5 ? "url(#whipblur)" : undefined }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="whipblur" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation={`${sd.toFixed(1)} 0`} /></filter>
      </svg>
      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: `${foco.x * 100}% ${foco.y * 100}%`, filter: `saturate(${est?.saturacion ?? 1}) contrast(${est?.contraste ?? 1})` }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translate3d(${-c.tx * width * 1.1 + rx}px, ${-c.ty * width * 1.1 + ry}px, ${camZ}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz + rz}deg)` }}>
          {capas.map((cp, i) => (
            <Capa key={i} capa={cp} frame={frame} width={width} foco={undefined} perfil={perfil} paleta={tema.paleta} dur={durationInFrames} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


// ---------------------------------------------------------------------------------------------------------------
// v4.6 · ESCENA DE CAPAS VIVAS (croma #00FF00): fondo + personajes + artefactos recortados, cada uno con SU PROPIA animación (anim) y TRAYECTORIA
// (ruta: entrada desde un lado/arriba/abajo, diagonal, arco, giro, rebote, acercamiento/alejamiento y salida) sincronizada con la narración,
// bajo la cámara multifase (camara.ts) cuya dirección (camara_dir) dialoga con la de los props. Siempre en movimiento; partículas + luz viva.
const EASE_T: Record<string, (t: number) => number> = {
  suave: Easing.inOut(Easing.cubic),
  lineal: (t) => t,
  salida: Easing.in(Easing.cubic),
  rebote: Easing.out(Easing.back(2.2)),
  resorte: Easing.out(Easing.elastic(1.3)),
};
type RutaPt = NonNullable<Capa3D["ruta"]>[number];
type EscT = { start: number; words: { text: string; start: number }[] };
const tAncla = (pt: RutaPt, escena: EscT): number => {
  if (pt.palabra) {
    const q = pt.palabra.toLowerCase();
    const w = escena.words.find((x) => x.text.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, "").startsWith(q));
    if (w) return Math.max(0, w.start - escena.start);
  }
  return pt.t ?? 0;
};
const evalRuta = (capa: Capa3D, tSec: number, escena: EscT) => {
  const R = capa.ruta;
  const base = { x: 0, y: 0, z: 0, rot: 0, esc: 1, op: 1 };
  if (!R || !R.length) return base;
  // Orden de autoría respetado (NO se reordena por tiempo): un punto anclado a una palabra que cae DESPUÉS de los puntos siguientes
  // desplaza a todos los posteriores (mantiene sus duraciones) en vez de invertir la entrada y dejar la capa invisible.
  let shift = 0, prevT = -1;
  const pts = R.map((p, i) => {
    const orig = p.t ?? 0;
    let t = orig + shift;
    if (p.palabra) { const tw = tAncla(p, escena); if (tw !== orig || tw > 0) t = tw; }
    if (i > 0 && t < prevT + 0.05) t = prevT + 0.05;
    shift = t - orig; prevT = t;
    return { ...p, t };
  });
  const val = (p: (typeof pts)[number]) => ({ x: p.x, y: p.y, z: p.z ?? 0, rot: p.rot ?? 0, esc: p.esc ?? 1, op: p.op ?? 1 });
  if (tSec <= pts[0].t) return { ...val(pts[0]), op: pts[0].t > 0.05 ? 0 : pts[0].op ?? 1 }; // oculto hasta su entrada
  const last = pts[pts.length - 1];
  if (tSec >= last.t) return val(last);
  let i = 0;
  while (i < pts.length - 2 && tSec > pts[i + 1].t) i++;
  const a = pts[i], b = pts[i + 1];
  const u0 = (tSec - a.t) / Math.max(0.001, b.t - a.t);
  const u = (EASE_T[b.e ?? "suave"] ?? EASE_T.suave)(Math.min(1, Math.max(0, u0)));
  const va = val(a), vb = val(b);
  const m = (k: keyof typeof va) => va[k] + (vb[k] - va[k]) * u;
  const arco = (b.arco ?? 0) * 4 * u0 * (1 - u0); // parábola: sube y baja dentro del tramo (lanzamiento / salto)
  const giro = (b.giro ?? 0) * u;
  return { x: m("x"), y: m("y") - arco, z: m("z"), rot: m("rot") + giro, esc: m("esc"), op: Math.min(1, m("op")) };
};

const CapaViva: React.FC<{ capa: Capa3D; frame: number; fps: number; width: number; escena: EscT }> = ({ capa, frame, fps, width, escena }) => {
  const t = frame / fps;
  const r = evalRuta(capa, t, escena);
  const r0 = evalRuta(capa, Math.max(0, t - 0.1), escena);
  const k = (PERSP + capa.z) / PERSP;
  const w = (capa.ancho ?? 1) * width * k * r.esc;
  const A = capa.amp ?? 1, ph = capa.fase ?? 0;
  let ix = 0, iy = 0, irot = 0, isx = 1, isy = 1, org = "50% 100%";
  switch (capa.anim) {
    case "respirar": isy = 1 + 0.016 * A * Math.sin(t * 2.3 + ph); isx = 1 - 0.006 * A * Math.sin(t * 2.3 + ph); break;
    case "orar": isy = 1 + 0.012 * A * Math.sin(t * 1.6 + ph); irot = 0.9 * A * Math.sin(t * 0.8 + ph); break;
    case "rebote": iy = -Math.abs(Math.sin(t * 4.2 + ph)) * 22 * A; isy = 1 + 0.03 * A * Math.cos(t * 8.4 + ph); break;
    case "mecer": irot = 2.6 * A * Math.sin(t * 1.9 + ph); break;
    case "temblar": ix = 3 * A * Math.sin(t * 38 + ph); iy = 1.5 * A * Math.sin(t * 31 + ph); irot = 0.7 * A * Math.sin(t * 27 + ph); break;
    case "pulso": isx = isy = 1 + 0.045 * A * Math.sin(t * 3.2 + ph); org = "50% 50%"; break;
    case "flota": iy = Math.sin(t * 1.5 + ph) * 12 * A; irot = Math.sin(t * 1.1 + ph) * 1.4 * A; org = "50% 50%"; break;
    case "caminar": iy = -Math.abs(Math.sin(t * 6.4 + ph)) * 13 * A; irot = 1.8 * A * Math.sin(t * 6.4 + ph); break;
    default: break;
  }
  // Los personajes que se desplazan por su ruta caminan solos (pasitos + balanceo) aunque su animación sea de reposo.
  const vel = Math.hypot(r.x - r0.x, r.y - r0.y) / 0.1;
  if (capa.tipo === "personaje" && vel > 55 && capa.anim !== "caminar") { iy += -Math.abs(Math.sin(t * 6.4 + ph)) * 12; irot += 1.6 * Math.sin(t * 6.4 + ph); }
  const sal = capa.salida_t != null ? Math.min(1, Math.max(0, (t - capa.salida_t) / 0.35)) : 0;
  const op = r.op * (1 - sal);
  if (op <= 0.003) return null;
  const sombra = capa.sombra ?? true;
  const xC = (capa.ruta?.length ? 0 : capa.x ?? 0) + r.x;
  const yC = (capa.ruta?.length ? 0 : capa.y ?? 0) + r.y;
  // Sombra de contacto: elipse en el suelo (capa.pies) bajo el objeto; se difumina y encoge si está en el aire (salto, caída, vuelo).
  let sh: React.ReactNode = null;
  if (capa.pies != null && capa.aspect) {
    const feet = yC + (w * capa.aspect) / 2 + iy;
    const alt = Math.max(0, capa.pies - feet);
    const a = Math.min(1, alt / 420);
    const sw = w * (0.78 - 0.35 * a), shh = Math.max(10, sw * 0.17);
    sh = <div style={{ position: "absolute", left: "50%", top: "50%", width: sw, height: shh, borderRadius: "50%", opacity: op * (0.62 - 0.45 * a), pointerEvents: "none",
      background: "radial-gradient(ellipse at center, rgba(15,8,0,0.85) 0%, rgba(15,8,0,0.45) 45%, rgba(15,8,0,0) 72%)", transformOrigin: "50% 50%",
      transform: `translate3d(${xC - sw / 2}px, ${capa.pies - shh / 2}px, ${-capa.z + r.z}px)` }} />;
  }
  return (
    <>
      {sh}
      <div style={{ position: "absolute", left: "50%", top: "50%", width: w, opacity: op, backfaceVisibility: "hidden", transformOrigin: "50% 50%",
        transform: `translate3d(${xC - w / 2}px, ${yC}px, ${-capa.z + r.z}px) translateY(-50%) rotate(${r.rot}deg)` }}>
        {capa.halo ? <div style={{ position: "absolute", left: "-25%", top: "-18%", width: "150%", height: "136%", borderRadius: "50%", background: `radial-gradient(circle, ${capa.halo} 0%, rgba(255,240,170,0) 68%)`, opacity: 0.38 + 0.18 * Math.sin(t * 2.2 + ph) }} /> : null}
        <div style={{ transformOrigin: org, transform: `translate(${ix}px, ${iy}px) rotate(${irot}deg) scale(${isx * (capa.flip ? -1 : 1)}, ${isy})` }}>
          <Img src={staticFile(capa.media)} style={{ display: "block", width: "100%", height: "auto", filter: sombra && capa.pies == null ? "drop-shadow(10px 22px 22px rgba(0,0,0,0.5))" : undefined }} />
        </div>
      </div>
    </>
  );
};

const LuzViva: React.FC<{ color: string; frame: number }> = ({ color, frame }) => {
  const f = 0.62 + 0.18 * Math.sin(frame * 0.21) + 0.12 * Math.sin(frame * 0.53 + 1.3) + 0.08 * Math.sin(frame * 1.07); // parpadeo de llama
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "soft-light", opacity: f * 0.7,
      background: `radial-gradient(ellipse at 8% 100%, ${color} 0%, rgba(0,0,0,0) 38%), radial-gradient(ellipse at 94% 6%, ${color} 0%, rgba(0,0,0,0) 30%)` }} />
  );
};

const CuentaViva: React.FC<{ cfg: NonNullable<Escena["cuenta"]>; frame: number; fps: number; dur: number; acento: string }> = ({ cfg, frame, fps, dur, acento }) => {
  const desde = cfg.desde ?? 3;
  const f = frame - (dur - desde * fps);
  if (f < -8 || f > desde * fps + 14) return null;
  const sec = Math.min(desde - 1, Math.max(0, Math.floor(f / fps)));
  const within = Math.min(1, Math.max(0, f / fps - sec));
  const pop = 1 + 0.38 * Math.pow(1 - Math.min(1, within * 2.2), 2);
  const ap = Math.min(1, Math.max(0, (f + 8) / 8));
  const D = 210;
  return (
    <div style={{ position: "absolute", left: `${(cfg.x ?? 0.5) * 100}%`, top: `${(cfg.y ?? 0.2) * 100}%`, transform: "translate(-50%,-50%)", opacity: ap, pointerEvents: "none" }}>
      <div style={{ width: D, height: D, borderRadius: "50%", background: `conic-gradient(${acento} ${360 * (1 - within)}deg, rgba(255,255,255,0.25) 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ width: D * 0.82, height: D * 0.82, borderRadius: "50%", background: "rgba(20,14,40,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: D * 0.5, fontWeight: 800, color: "#fff", transform: `scale(${pop})`, textShadow: `0 0 28px ${acento}` }}>{desde - sec}</span>
        </div>
      </div>
      {cfg.texto ? <div style={{ marginTop: 14, textAlign: "center", fontSize: 44, fontWeight: 800, color: "#fff", background: acento, padding: "0.15em 0.7em", borderRadius: 999, whiteSpace: "nowrap" }}>{cfg.texto}</div> : null}
    </div>
  );
};

const EscenaCapasVivas: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const mp = microPlano(frame, durationInFrames, fps, escena.planos);
  const nombre: CamPreset = normPreset(escena.camaras?.[mp.k]) ?? CAM_PRESETS[(index * 2 + mp.k) % CAM_PRESETS.length]; // nunca estática
  const cd = escena.camara_dir;
  const dir: 1 | -1 = cd ? (mp.k % 2 === 0 ? cd : ((-cd) as 1 | -1)) : (index + mp.k) % 2 === 0 ? 1 : -1;
  const c = pose(nombre, mp.p, mp.fl, fps, dir);
  const foco = escena.foco ?? { x: 0.5, y: 0.45 };
  const est = estiloDe(tema);
  const camZ = PERSP * (1 - 1 / c.zoom);
  const rx = Math.sin(frame / 37) * 7, ry = Math.cos(frame / 29) * 6, rz = Math.sin(frame / 83) * 0.35;
  const sd = c.whip * 38;
  const capas = [...(escena.capas ?? [])].sort((a, b) => b.z - a.z);
  const parts = escena.particulas3d ?? "polvo";
  return (
    <AbsoluteFill style={{ background: tema.paleta.fondo, overflow: "hidden", filter: sd > 0.5 ? "url(#whipblur2)" : undefined }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="whipblur2" x="-20%" y="-5%" width="140%" height="110%"><feGaussianBlur stdDeviation={`${sd.toFixed(1)} 0`} /></filter>
      </svg>
      <AbsoluteFill style={{ perspective: PERSP, perspectiveOrigin: `${foco.x * 100}% ${foco.y * 100}%`, filter: `saturate(${est?.saturacion ?? 1}) contrast(${est?.contraste ?? 1})` }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `translate3d(${-c.tx * width * 1.1 + rx}px, ${-c.ty * width * 1.1 + ry}px, ${camZ}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz + rz}deg)` }}>
          {capas.map((cp, i) =>
            cp.tipo === "fondo"
              ? <Capa key={i} capa={cp} frame={frame} width={width} foco={undefined} perfil={PERFIL_BASE} paleta={tema.paleta} dur={durationInFrames} />
              : <CapaViva key={i} capa={cp} frame={frame} fps={fps} width={width} escena={escena} />)}
        </div>
      </AbsoluteFill>
      <Particulas3D tipo={parts} frame={frame} w={width} h={height} />
      {escena.luz ? <LuzViva color={escena.luz} frame={frame} /> : null}
      {escena.cuenta ? <CuentaViva cfg={escena.cuenta} frame={frame} fps={fps} dur={durationInFrames} acento={tema.paleta.acento} /> : null}
    </AbsoluteFill>
  );
};

export const Escena3D: React.FC<BloqueProps> = (props) => (props.escena.capas_vivas ? <EscenaCapasVivas {...props} /> : props.escena.bg || (props.escena.media && !props.escena.capas?.length) ? <Escena3Capas {...props} /> : <Escena3DLegacy {...props} />);

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
