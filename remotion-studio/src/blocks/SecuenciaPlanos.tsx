import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { BloqueProps } from "./common";
import { Foto25D } from "./Foto25D";
import { Escena3D } from "./Escena3D";
import { Escena, ImagenPlano } from "../types";
import { FOCOS, normPreset } from "../camara";

// v4.1 · SECUENCIA DE PLANOS: una escena con varias imágenes (`imagenes[]`) las reparte DENTRO de su duración, con cortes alineados a
// palabras de la narración (o a marcas `t` en segundos desde el inicio de la escena) y transiciones cortas y variadas (slide/wipe/fade/zoom).
// Cada imagen lleva su propio preset de cámara (CAM_PRESETS, asignado por plan.ts sin repetirse) y alterna Escena3D / Foto25D.
// Duración exacta: segmento k = d_k + T_k (T_k = solape con el siguiente) => la suma de la TransitionSeries == duración de la escena,
// así audio (voice_XX), música y subtítulos no se desfasan ni un fotograma.
const MIN_SEG = 24; // frames (0,8 s) mínimo por imagen
export const T_CORTE = 8; // frames de transición entre imágenes de una misma escena

/** Frames locales (0..dur) donde empieza cada imagen. Respeta `t`; si no, reparte en partes iguales ajustando al inicio de palabra más cercano. */
export const cortes = (imgs: ImagenPlano[], escena: Escena, dur: number, fps: number): number[] => {
  const n = imgs.length;
  const out: number[] = [0];
  for (let k = 1; k < n; k++) {
    let f = imgs[k].t !== undefined ? Math.round(imgs[k].t! * fps) : Math.round((dur * k) / n);
    if (imgs[k].t === undefined && escena.words?.length) {
      let best = f, bd = 1e9;
      for (const w of escena.words) {
        const wf = Math.round((w.start - escena.start) * fps);
        if (Math.abs(wf - f) < bd) { bd = Math.abs(wf - f); best = wf; }
      }
      if (bd <= fps * 0.8) f = best; // corte en el ataque de una palabra
    }
    f = Math.max(out[k - 1] + MIN_SEG, Math.min(f, dur - MIN_SEG * (n - k)));
    out.push(f);
  }
  return out;
};

const Entrada: React.FC<{ zoom: boolean; children: React.ReactNode }> = ({ zoom, children }) => {
  const frame = useCurrentFrame();
  const s = zoom ? interpolate(frame, [0, 12], [1.14, 1], { extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0.9, 0.25, 1) }) : 1;
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

export const SecuenciaPlanos: React.FC<BloqueProps> = ({ escena, index, tema }) => {
  const { fps, durationInFrames: dur } = useVideoConfig();
  let imgs = (escena.imagenes ?? []).filter((i) => i && i.media);
  const maxN = Math.max(1, Math.floor(dur / MIN_SEG));
  imgs = imgs.slice(0, maxN);
  if (imgs.length < 2) {
    const B = escena.bloque === "escena_3d" ? Escena3D : Foto25D;
    return <B escena={{ ...escena, media: imgs[0]?.media ?? escena.media }} index={index} tema={tema} />;
  }
  const cuts = cortes(imgs, escena, dur, fps);
  const base3D = escena.bloque === "escena_3d";
  const nodes: React.ReactNode[] = [];
  imgs.forEach((im, k) => {
    const last = k === imgs.length - 1;
    const d = (last ? dur : cuts[k + 1]) - cuts[k];
    const kind = last ? "fade" : imgs[k + 1].transicion ?? "fade"; // la transición describe cómo ENTRA la imagen k+1
    const T = last ? 0 : kind === "wipe" ? 10 : T_CORTE;
    const preset = normPreset(im.camara) ?? normPreset(escena.camaras?.[k]);
    const sub: Escena = {
      ...escena, media: im.media, bg: k === 0 ? escena.bg : undefined, subject: k === 0 ? escena.subject : undefined, fg: k === 0 ? escena.fg : undefined,
      bloque: (k % 2 === 0 ? base3D : !base3D) ? "escena_3d" : "foto_25d", camaras: preset ? [preset] : undefined, planos: 1,
      foco: FOCOS[(index + k) % FOCOS.length], imagenes: undefined, visuales: undefined,
    };
    const B = sub.bloque === "escena_3d" ? Escena3D : Foto25D;
    nodes.push(
      <TransitionSeries.Sequence key={`i${k}`} durationInFrames={d + T}>
        <Entrada zoom={k > 0 && imgs[k].transicion === "zoom"}>
          <B escena={sub} index={index + k} tema={tema} />
        </Entrada>
      </TransitionSeries.Sequence>,
    );
    if (!last) {
      const nk = imgs[k + 1].transicion ?? "fade";
      const pres = (
        nk === "slide" ? slide({ direction: (k + index) % 2 ? "from-left" : "from-right" })
        : nk === "wipe" ? wipe({ direction: (k + index) % 2 ? "from-top-left" : "from-bottom-right" })
        : fade() // fade y zoom (zoom = fade + golpe de escala en la imagen entrante)
      ) as any;
      nodes.push(
        <TransitionSeries.Transition key={`t${k}`} presentation={pres} timing={linearTiming({ durationInFrames: T, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })} />,
      );
    }
  });
  return <TransitionSeries>{nodes}</TransitionSeries>;
};
