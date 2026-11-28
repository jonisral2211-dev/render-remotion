import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { UniversalProps } from "./types";
import { resolveTema, estiloDe } from "./theme";
import { planificar } from "./plan";
import { TexturaEstilo } from "./components/Textura";
import { Easing } from "remotion";
import { bloqueDe } from "./blocks";
import { DoblePlano } from "./blocks/DoblePlano";
import { Subtitles } from "./components/Subtitles";
import { Atmosphere } from "./components/Atmosphere";
import { Clima } from "./components/Clima";
import { Cine, EntradaZoom, LightLeak } from "./components/Cine";
import { InfografiaAnimada } from "./blocks/InfografiaAnimada";

const T = 10; // frames de transición por defecto (fundido rápido)
const TDUR = (k?: string) => (k === "wipe" || k === "clock" ? 16 : k === "slide" ? 12 : T); // máscaras necesitan algo más de tiempo
const MUSIC_TALK = 0.14; // música mientras habla el narrador
const MUSIC_PAUSE = 0.3; // música en las pausas
// v4 · ducking según la etapa emocional: [habla, pausa]
const DUCK_EMO: Record<string, [number, number]> = { gancho: [0.13, 0.28], calma: [0.16, 0.34], tension: [0.11, 0.24], climax: [0.2, 0.42], cierre: [0.15, 0.3] };

// Auto-ducking: curva de volumen por frame a partir de las palabras (voz) — baja rápido al hablar, sube despacio en pausas.
const buildDuck = (escenas: UniversalProps["escenas"], fps: number, total: number): number[] => {
  const talk = new Array(total).fill(false);
  const words = escenas.flatMap((e) => e.words);
  const GAP = 0.28; // huecos menores se consideran habla continua
  for (let k = 0; k < words.length; k++) {
    const a = Math.floor(words[k].start * fps);
    const nextStart = k + 1 < words.length ? words[k + 1].start : words[k].end;
    const b = Math.ceil((nextStart - words[k].end < GAP ? nextStart : words[k].end) * fps);
    for (let f = Math.max(0, a); f < Math.min(total, b); f++) talk[f] = true;
  }
  const out: number[] = [];
  let g = MUSIC_PAUSE;
  const starts = escenas.map((e) => Math.round(e.start * fps));
  let si = 0;
  for (let f = 0; f < total; f++) {
    while (si + 1 < starts.length && f >= starts[si + 1]) si++;
    const [dt, dp] = DUCK_EMO[escenas[si]?.emocion ?? "calma"] ?? [MUSIC_TALK, MUSIC_PAUSE];
    const target = talk[f] ? dt : dp;
    g += (target - g) * (target < g ? 0.35 : 0.07); // ataque rápido, liberación suave
    out.push(g);
  }
  return out;
};

// Motor único: lee tema_visual + escenas del JSON.
// - Cada escena empieza en round(start*fps) (sin acumular redondeos) y dura hasta el inicio de la siguiente (+T de solape),
//   así su inicio coincide con el audio aunque las transiciones solapen.
// - La última escena se extiende hasta el último fotograma de la composición (sin negro al cierre).
// - La música va en el contenedor raíz: continua, en bucle, sin reiniciarse entre escenas.
export const UniversalExplainer: React.FC<UniversalProps> = ({ escenas: escenasIn, audio, music, music_ducked, sfx, tema: temaIn }) => {
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const tema = resolveTema(temaIn);
  const est = estiloDe(tema);
  const escenas = React.useMemo(() => planificar(escenasIn, fps, durationInFrames), [escenasIn, fps, durationInFrames]); // v4: bloques/cámara/transiciones sin repetir
  const startF = escenas.map((e) => Math.round(e.start * fps));
  const duck = React.useMemo(() => buildDuck(escenas, fps, durationInFrames), [escenas, fps, durationInFrames]);
  const fadeOut = Math.round(1.2 * fps); // cierre suave de 1.2 s
  return (
    <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo }}>
      {audio ? <Audio src={staticFile(audio)} /> : null}
      {music ? (
        <Audio
          src={staticFile(music)}
          loop
          loopVolumeCurveBehavior="extend"
          volume={(f: number) =>
            (music_ducked ? 1 : (duck[Math.min(f, duck.length - 1)] ?? MUSIC_TALK)) * Math.min(1, f / (fps * 2)) * Math.min(1, Math.max(0, (durationInFrames - f) / fadeOut))
          }
        />
      ) : null}
      {sfx
        ? escenas.flatMap((e, i) => {
            const items: React.ReactNode[] = [];
            const durEsc = Math.max(1, (i === escenas.length - 1 ? durationInFrames : startF[i + 1]) - startF[i]);
            const AMB = ["lluvia", "ambiente"]; // se repiten durante toda la escena, suaves
            const VOL: Record<string, number> = { impacto: 0.9, whoosh: 0.5, campana: 0.5, destello: 0.55, martillo: 0.6, lluvia: 0.22, ambiente: 0.2, magia: 0.5, construccion: 0.6, revelacion: 0.55, transicion: 0.45 };
            String(e.sfx ?? "").split(/[+,]/).map((x) => x.trim()).filter(Boolean).forEach((k, j) => {
              const src = (sfx as Record<string, string | undefined>)[k];
              if (!src) return;
              const from = (k === "whoosh" || k === "transicion") ? Math.max(0, startF[i] - 8) : startF[i] + (["campana", "destello", "magia", "revelacion"].includes(k) ? 6 : 0);
              items.push(
                <Sequence key={`s${i}_${j}`} from={from} durationInFrames={AMB.includes(k) ? durEsc : undefined}>
                  <Audio src={staticFile(src)} volume={VOL[k] ?? 0.5} loop={AMB.includes(k)} />
                </Sequence>,
              );
            });
            return items;
          })
        : null}
      {sfx
        ? escenas.flatMap((e, i) =>
            ((e.sfx_t ?? []) as [string, string | number, number?][]).map(([k, anc, vol], j) => {
              const src = (sfx as Record<string, string | undefined>)[k];
              if (!src) return null;
              // v4.7 · sfx_t: el efecto suena EN el punto de acción: segundos desde el inicio de la escena | "t:1.2" | "fin-0.8" | "palabra[+-seg]"
              const durE = e.end - e.start;
              const m = String(anc).match(/^([^+\-]*)([+-]\d+(?:\.\d+)?)?$/);
              let t = 0;
              if (typeof anc === "number") t = anc;
              else if (String(anc).startsWith("t:")) t = parseFloat(String(anc).slice(2)) || 0;
              else if (String(anc).startsWith("fin")) t = durE + (parseFloat(String(anc).slice(3)) || 0);
              else if (m) {
                const q = m[1].toLowerCase().replace(/[^a-záéíóúñ0-9]/g, "");
                const w = e.words.find((x) => x.text.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, "").startsWith(q));
                t = (w ? w.start - e.start : 0) + (m[2] ? parseFloat(m[2]) : 0);
              }
              const from = Math.max(0, startF[i] + Math.round(Math.max(0, Math.min(durE, t)) * fps));
              return (
                <Sequence key={`st${i}_${j}`} from={from}>
                  <Audio src={staticFile(src)} volume={vol ?? 0.5} />
                </Sequence>
              );
            }),
          )
        : null}
      <TransitionSeries>
        {escenas.flatMap((escena, i) => {
          const last = i === escenas.length - 1;
          const Tn = last ? 0 : TDUR(escenas[i + 1].transicion);
          const dur = Math.max(Tn + 1, (last ? durationInFrames : startF[i + 1]) - startF[i]);
          const Bloque = escena.visuales && escena.visuales.length ? DoblePlano : bloqueDe(escena);
          const out: React.ReactNode[] = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={dur + Tn}>
              <EntradaZoom><Bloque escena={escena} index={i} tema={tema} /></EntradaZoom>
            </TransitionSeries.Sequence>,
          ];
          if (!last) {
            const kind = escenas[i + 1].transicion ?? "fade"; // destello usa fundido + light leak
            out.push(
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={(
                  kind === "slide" ? slide({ direction: i % 2 === 0 ? "from-right" : "from-left" })
                  : kind === "wipe" ? wipe({ direction: i % 2 === 0 ? "from-left" : "from-right" })
                  : kind === "clock" ? clockWipe({ width, height })
                  : fade()
                ) as any}
                timing={linearTiming({ durationInFrames: Tn, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })}
              />,
            );
          }
          return out;
        })}
      </TransitionSeries>
      <Atmosphere tema={tema} />
      {escenas.map((e, i) =>
        e.atmosfera && e.atmosfera.length ? (
          <Sequence key={`c${i}`} from={startF[i]} durationInFrames={Math.max(1, (i === escenas.length - 1 ? durationInFrames : startF[i + 1]) - startF[i])} layout="none">
            <Clima color={tema.paleta.acento} tipos={e.atmosfera} dur={Math.max(1, (i === escenas.length - 1 ? durationInFrames : startF[i + 1]) - startF[i])} />
          </Sequence>
        ) : null,
      )}
      {escenas.map((e, i) =>
        i > 0 && e.transicion === "destello" ? (
          <Sequence key={`l${i}`} from={Math.max(0, startF[i] - 2)} durationInFrames={16} layout="none">
            <LightLeak color={tema.paleta.acento} />
          </Sequence>
        ) : null,
      )}
      {escenas.map((e, i) =>
        e.tarjetas && e.tarjetas.length ? (
          <Sequence key={`tj${i}`} from={startF[i]} durationInFrames={Math.max(1, (i === escenas.length - 1 ? durationInFrames : startF[i + 1]) - startF[i])} layout="none">
            <TarjetasEscena tarjetas={e.tarjetas} tema={tema} />
          </Sequence>
        ) : null,
      )}
      {est ? <TexturaEstilo est={est} /> : null}
      <Cine tema={tema} />
      <Subtitles escenas={escenas} tema={tema} />
    </AbsoluteFill>
  );
};

const TarjetasEscena: React.FC<{ tarjetas: NonNullable<UniversalProps["escenas"][number]["tarjetas"]>; tema: ReturnType<typeof resolveTema> }> = ({ tarjetas, tema }) => {
  const frame = useCurrentFrame();
  return <>{tarjetas.map((t, i) => <InfografiaAnimada key={i} t={t} frame={frame} tema={tema} />)}</>;
};
