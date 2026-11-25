import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { UniversalProps } from "./types";
import { resolveTema } from "./theme";
import { BLOQUES } from "./blocks";
import { DoblePlano } from "./blocks/DoblePlano";
import { Subtitles } from "./components/Subtitles";
import { Atmosphere } from "./components/Atmosphere";
import { Clima } from "./components/Clima";
import { Cine, EntradaZoom, LightLeak } from "./components/Cine";

const T = 10; // frames de transición entre escenas (fundido rápido)
const MUSIC_TALK = 0.15; // música mientras habla el narrador
const MUSIC_PAUSE = 0.4; // música en las pausas

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
  for (let f = 0; f < total; f++) {
    const target = talk[f] ? MUSIC_TALK : MUSIC_PAUSE;
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
export const UniversalExplainer: React.FC<UniversalProps> = ({ escenas, audio, music, sfx, tema: temaIn }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const tema = resolveTema(temaIn);
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
            (duck[Math.min(f, duck.length - 1)] ?? MUSIC_TALK) * Math.min(1, f / (fps * 2)) * Math.min(1, Math.max(0, (durationInFrames - f) / fadeOut))
          }
        />
      ) : null}
      {sfx
        ? escenas.flatMap((e, i) => {
            const items: React.ReactNode[] = [];
            const k = e.sfx ?? "";
            if (k.includes("impacto") && sfx.impacto)
              items.push(<Sequence key={`si${i}`} from={startF[i]}><Audio src={staticFile(sfx.impacto)} volume={0.9} /></Sequence>);
            if (k.includes("whoosh") && sfx.whoosh)
              items.push(<Sequence key={`sw${i}`} from={Math.max(0, startF[i] - 8)}><Audio src={staticFile(sfx.whoosh)} volume={0.6} /></Sequence>);
            return items;
          })
        : null}
      <TransitionSeries>
        {escenas.flatMap((escena, i) => {
          const last = i === escenas.length - 1;
          const dur = Math.max(T + 1, (last ? durationInFrames : startF[i + 1]) - startF[i]);
          const Bloque = escena.visuales && escena.visuales.length ? DoblePlano : BLOQUES[escena.bloque] ?? BLOQUES.foto_25d;
          const out: React.ReactNode[] = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={dur + (last ? 0 : T)}>
              <EntradaZoom><Bloque escena={escena} index={i} tema={tema} /></EntradaZoom>
            </TransitionSeries.Sequence>,
          ];
          if (!last) {
            const kind = escenas[i + 1].transicion ?? "fade"; // destello usa fundido + light leak
            out.push(
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={kind === "slide" ? slide({ direction: i % 2 === 0 ? "from-right" : "from-left" }) : fade()}
                timing={linearTiming({ durationInFrames: T })}
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
            <Clima tipos={e.atmosfera} dur={Math.max(1, (i === escenas.length - 1 ? durationInFrames : startF[i + 1]) - startF[i])} />
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
      <Cine tema={tema} />
      <Subtitles escenas={escenas} tema={tema} />
    </AbsoluteFill>
  );
};
