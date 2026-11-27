import { Emocion, Escena, ImagenPlano } from "./types";
import { CAM_PRESETS, CamPreset, FOCOS, PRESET_META, normPreset, planosDe, repiteInercia } from "./camara";

// v4 · PLANIFICADOR: se ejecuta una vez sobre todas las escenas antes de montar el vídeo y garantiza:
//  - cámara: ningún micro-plano repite el preset del anterior (ni entre escenas), y se evita repetir los 2 últimos
//  - bloques: Escena3D / Foto25D / DoblePlano (+ Diapositiva / TarjetaDato cuando hay datos) alternados; nunca el mismo en dos escenas seguidas
//  - transiciones variadas (fade / slide / wipe / clock / destello) sin repetir
//  - un solo foco dominante: las tarjetas explicativas de una escena nunca se solapan en el tiempo
//  - emoción de cada escena (gobierna ducking y SFX)

export const inferirEmocion = (e: Escena, i: number, total: number): Emocion => {
  if (e.emocion) return e.emocion;
  if (i === 0) return "gancho";
  if (i === total - 1) return "cierre";
  const t = e.texto ?? "";
  if (/[¡!]/.test(t)) return "climax";
  if (/[¿?…]/.test(t)) return "tension";
  return "calma";
};

type Kind = "escena_3d" | "foto_25d" | "doble" | "split" | "diapositiva" | "tarjeta_dato" | "parallax_pro" | "video_clip";
const CICLO: Kind[] = ["escena_3d", "foto_25d", "doble", "escena_3d", "foto_25d", "doble"];
const TRANS_IMG: Array<NonNullable<ImagenPlano["transicion"]>> = ["slide", "wipe", "zoom", "fade"];
const TRANS: Array<NonNullable<Escena["transicion"]>> = ["fade", "slide", "wipe", "clock", "destello", "slide"];

export const planificar = (escenas: Escena[], fps: number, total: number): Escena[] => {
  const startF = escenas.map((e) => Math.round(e.start * fps));
  const hist: CamPreset[] = [];
  let ciclo = 0;
  let prevKind: Kind | undefined;
  let tr = 0;

  return escenas.map((src, i) => {
    const e: Escena = { ...src };
    const dur = Math.max(1, (i === escenas.length - 1 ? total : startF[i + 1]) - startF[i]);
    e.emocion = inferirEmocion(e, i, escenas.length);
    e.foco = e.foco ?? FOCOS[i % FOCOS.length];

    // ---- bloque ------------------------------------------------------------------------------------------------
    const tieneImg = !!(e.media || e.bg);
    let kind: Kind;
    const fijo = e.bloque_fijo || e.bloque === "video_clip" || e.bloque === "parallax_pro";
    if (fijo) kind = (e.visuales?.length ? "doble" : e.bloque) as Kind;
    else if (e.puntos?.length && e.bloque !== "foto_25d") kind = "diapositiva";
    else if (e.dato && (e.bloque === "tarjeta_dato" || !tieneImg)) kind = "tarjeta_dato";
    else if (e.comparar && e.visuales && e.visuales.length >= 2) kind = "split";
    else if (!tieneImg) kind = "diapositiva";
    else {
      kind = CICLO[ciclo % CICLO.length];
      for (let g = 0; g < CICLO.length && kind === prevKind; g++) kind = CICLO[(ciclo + g + 1) % CICLO.length];
      ciclo++;
    }
    const multi = !fijo && (e.imagenes?.length ?? 0) > 0 && kind !== "diapositiva" && kind !== "tarjeta_dato";
    if (multi && (kind === "doble" || kind === "split")) kind = "foto_25d";
    if (kind === prevKind && !fijo) kind = prevKind === "foto_25d" ? "escena_3d" : "foto_25d"; // red de seguridad
    prevKind = kind;
    if (kind === "doble" || kind === "split") {
      e.bloque = "foto_25d";
      e.visuales = e.visuales && e.visuales.length >= 2 ? e.visuales : [{}, {}];
      e.union = kind === "split" ? "split" : e.union ?? (i % 2 ? "destello" : "fade");
    } else {
      e.bloque = kind as Escena["bloque"];
      if (!fijo) e.visuales = undefined;
    }

    // ---- micro-planos y cámara ---------------------------------------------------------------------------------
    // v4.1: lista de imágenes de la escena (la principal `media` primero si no está ya) -> 1 micro-plano de cámara por imagen
    let imgs: ImagenPlano[] | undefined;
    if (e.imagenes?.length) {
      imgs = e.imagenes.map((x) => (typeof x === "string" ? { media: x } : { ...x }));
      if (e.media && !imgs.some((x) => x.media === e.media)) imgs.unshift({ media: e.media });
      imgs = imgs.slice(0, Math.max(1, Math.floor(dur / 24)));
    }
    const n = imgs && imgs.length > 1 && kind !== "diapositiva" && kind !== "tarjeta_dato" ? imgs.length : kind === "doble" ? 2 : e.planos ?? planosDe(dur, fps);
    const dado = (e.camaras ?? []).map(normPreset);
    const lista: CamPreset[] = [];
    for (let k = 0; k < n; k++) {
      const prev = hist[hist.length - 1];
      const prev2 = hist[hist.length - 2];
      let c = dado[k];
      if (!c || c === prev) {
        const orden = CAM_PRESETS.map((_, j) => CAM_PRESETS[(i * 2 + k + j) % CAM_PRESETS.length]);
        // v4.2: prioridad 1 = distinta ESCALA y distinto EJE de inercia que el plano anterior (y que el penúltimo); si no existe, se relaja
        c = orden.find((x) => x !== prev && x !== prev2 && !repiteInercia(prev, x))
          ?? orden.find((x) => x !== prev && !repiteInercia(prev, x))
          ?? orden.find((x) => x !== prev && PRESET_META[x].eje !== (prev ? PRESET_META[prev].eje : undefined))
          ?? orden.find((x) => x !== prev) ?? "empuje_lateral";
      }
      lista.push(c);
      hist.push(c);
    }
    e.camaras = lista;
    e.planos = n;
    if (imgs) {
      let prevT: string | undefined;
      imgs = imgs.map((im, k) => {
        let tr_ = im.transicion;
        if (k > 0 && (!tr_ || tr_ === prevT)) tr_ = TRANS_IMG.find((x) => x !== prevT && x !== (imgs as ImagenPlano[])[k + 1]?.transicion) ?? "fade";
        if (k > 0) prevT = tr_;
        return { ...im, camara: im.camara ?? lista[k] ?? lista[lista.length - 1], transicion: k > 0 ? tr_ : undefined };
      });
      e.imagenes = imgs;
    }

    // ---- transición de entrada (variada, sin repetir) -------------------------------------------------------------
    if (i > 0 && !src.transicion) {
      e.transicion = TRANS[tr % TRANS.length];
      tr++;
    }

    // ---- un solo foco: tarjetas nunca solapadas ---------------------------------------------------------------------------------
    if (e.tarjetas && e.tarjetas.length) {
      const dsec = dur / fps;
      let libre = 0.3;
      e.tarjetas = [...e.tarjetas]
        .sort((a, b) => a.t - b.t)
        .map((t) => {
          const ini = Math.max(t.t, libre);
          const fin = Math.min(dsec - 0.2, ini + (t.dur ?? 2.4));
          libre = fin + 0.25;
          return { ...t, t: ini, dur: Math.max(0.8, fin - ini) };
        })
        .filter((t) => t.t < dsec - 0.6);
    }
    return e;
  });
};
