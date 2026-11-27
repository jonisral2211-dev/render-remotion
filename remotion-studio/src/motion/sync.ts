// MODO C — resolución de anclas (narración / ritmo) y planificación de elementos encadenados. Funciones puras (testeables sin render).
import { Elemento, EscenaMotion, MotionProps } from "./tipos";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]/g, "");

/** Anclas -> segundos ABSOLUTOS. Si el ancla no se puede resolver cae al inicio de la escena (nunca NaN). */
export const resolverAncla = (a: string | undefined, e: EscenaMotion, ritmo?: MotionProps["ritmo"]): number => {
  const ini = e.start;
  if (!a) return ini;
  const [k, v = ""] = a.split(":");
  let t = ini;
  if (k === "t") t = ini + (parseFloat(v) || 0);
  else if (k === "fin") t = e.end;
  else if (k === "palabra") {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && /^\d+$/.test(v.trim())) t = e.words[Math.min(Math.max(0, n), e.words.length - 1)]?.start ?? ini;
    else {
      const q = norm(v);
      t = e.words.find((w) => q && norm(w.text).startsWith(q))?.start ?? ini;
    }
  } else if (k === "beat" && ritmo?.bpm) t = ini + (parseInt(v, 10) || 0) * (60 / ritmo.bpm);
  if (ritmo?.snap && ritmo.bpm) {
    const p = 60 / ritmo.bpm;
    const s = Math.round(t / p) * p;
    if (Math.abs(s - t) <= 0.08) t = s; // ajusta al pulso solo si cae a ≤ 80 ms (no desplaza la palabra)
  }
  return Math.max(ini, Math.min(e.end, t));
};

export type ElementoPlan = {
  el: Elemento;
  f0: number; dur: number; // fotogramas LOCALES a la escena
  fOut: number; durOut: number;
  from: { x: number; y: number }; to: { x: number; y: number };
  enf: { f: number; dur: number; efecto: "pulso" | "resalte" | "sacudida" }[];
};

const SOLAPE = 4; // fotogramas de solape en el encadenado

/** Planifica los elementos de una escena: entrada sobre la narración, encadenado sin cortes secos, salida y énfasis. */
export const planificarElementos = (e: EscenaMotion, fps: number, ritmo?: MotionProps["ritmo"]): ElementoPlan[] => {
  const out: ElementoPlan[] = [];
  const durEsc = Math.max(1, Math.round((e.end - e.start) * fps));
  for (const el of e.elementos ?? []) {
    const prev = out[out.length - 1];
    const dur = Math.max(4, Math.round((el.entrada.dur ?? 0.55) * fps));
    let f0 = Math.round((resolverAncla(el.entrada.ancla, e, ritmo) - e.start) * fps);
    let from = el.desde ?? offsetDir(el.entrada.dir, el.x, el.y);
    if (el.encadena && prev) {
      f0 = Math.max(0, prev.f0 + prev.dur - SOLAPE); // arranca cuando el anterior termina su entrada
      from = { ...prev.to }; // continúa desde donde terminó el anterior (movimiento continuo)
    }
    f0 = Math.min(f0, durEsc - 2);
    const durOut = Math.max(3, Math.round((el.salida?.dur ?? 0.35) * fps));
    const fOut = el.salida?.ancla ? Math.round((resolverAncla(el.salida.ancla, e, ritmo) - e.start) * fps) : durEsc + durOut; // sin salida explícita: permanece
    out.push({
      el, f0, dur, fOut, durOut, from, to: { x: el.x, y: el.y },
      enf: (el.enfasis ?? []).map((x) => ({ f: Math.round((resolverAncla(x.ancla, e, ritmo) - e.start) * fps), dur: Math.max(4, Math.round((x.dur ?? 0.5) * fps)), efecto: x.efecto })),
    });
  }
  return out;
};

function offsetDir(d: string | undefined, x: number, y: number) {
  const k = 0.16;
  return d === "izq" ? { x: x - k, y } : d === "der" ? { x: x + k, y } : d === "arriba" ? { x, y: y - k } : d === "abajo" ? { x, y: y + k } : { x, y };
}

/** Puntos de interés de la cámara: manuales (keys) o derivados de los elementos (foco / auto). Tiempos en fotogramas locales. */
export const puntosCamara = (e: EscenaMotion, plan: ElementoPlan[], fps: number): { f: number; x: number; y: number; zoom?: number }[] => {
  const c = e.camara;
  if (c?.keys && c.keys.length) return c.keys.map((k) => ({ f: Math.round(k.t * fps), x: k.x, y: k.y, zoom: k.zoom }));
  if (c?.sigue === "fija") return [];
  const base = plan.filter((p) => (c?.sigue === "auto" ? true : p.el.foco));
  return base.map((p) => ({ f: p.f0, x: p.to.x, y: p.to.y }));
};

/** Comprobación de alineado (usada también por scripts/verificar_motion.py vía esbuild): entradas dentro de la escena y ordenadas. */
export const revisarAlineado = (p: MotionProps): string[] => {
  const err: string[] = [];
  p.escenas.forEach((e, i) => {
    const dur = (e.end - e.start) * p.fps;
    for (const x of planificarElementos(e, p.fps, p.ritmo)) {
      if (x.f0 < 0 || x.f0 >= dur) err.push(`escena ${i + 1}: '${x.el.id}' entra fuera de la escena (f ${x.f0}/${Math.round(dur)})`);
      if (x.el.encadena && x.f0 < 0) err.push(`escena ${i + 1}: '${x.el.id}' encadenado sin elemento previo`);
    }
  });
  return err;
};
