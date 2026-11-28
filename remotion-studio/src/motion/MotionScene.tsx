// MODO C — composición de animación / motion graphics. Se activa con props.modo === "C_MOTION" (ver Root.tsx).
// Capas alineadas al mismo reloj: [fondo + escenas (cámara que sigue + elementos + expansión)] · acabado de estilo · subtítulos · voz · música.
import React from "react";
import { AbsoluteFill, Easing, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { MotionProps, EscenaMotion } from "./tipos";
import { planificarElementos, puntosCamara } from "./sync";
import { CamaraSigue, ElementoMov, ExpansionReveal } from "./efectos";
import { ESTILOS_MOTION } from "./estilos_motion";
import { EstiloOverlay } from "./EstiloOverlay";
import { CapasVivas, Cuenta, MovCamara, Particulas } from "./vida";
import { Subtitles } from "../components/Subtitles";
import { resolveTema } from "../theme";

const FADE = 8; // fotogramas: nunca corte seco cuando no hay expansión
const EXP_DEF = 0.7; // s

const Escena: React.FC<{ e: EscenaMotion; props: MotionProps; frame: number }> = ({ e, props, frame }) => {
  const { fps, width: W, height: H } = props;
  const tema = resolveTema(props.tema);
  const plan = React.useMemo(() => planificarElementos(e, fps, props.ritmo), [e, fps, props.ritmo]);
  const puntos = React.useMemo(() => puntosCamara(e, plan, fps), [e, plan, fps]);
  const est = ESTILOS_MOTION[props.estilo_motion];
  const durF = Math.max(1, Math.round((e.end - e.start) * fps));
  return (
    <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo }}>
      <MovCamara frame={frame} fps={fps} dur={durF} mov={e.camara?.mov} dir={e.camara?.dir}>
        <CamaraSigue frame={frame} fps={fps} W={W} H={H} zoom={e.camara?.zoom ?? 1.14} suavizado={e.camara?.suavizado ?? 0.6} puntos={puntos}>
          {e.capas ? <CapasVivas capas={e.capas} frame={frame} fps={fps} dur={durF} vida={e.vida} H={H} /> : e.media ? <Img src={staticFile(e.media)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: est?.filtro || undefined, imageRendering: est?.overlay === "pixelado" ? "pixelated" : undefined }} /> : null}
          {plan.map((p) => <ElementoMov key={p.el.id} plan={p} frame={frame} W={W} H={H} tema={tema} />)}
          {e.particulas && e.particulas.length ? <Particulas cfgs={e.particulas} frame={frame} W={W} H={H} seed={`s${Math.round(e.start * 10)}`} /> : null}
        </CamaraSigue>
      </MovCamara>
      {e.cuenta ? <Cuenta cfg={e.cuenta} e={e} frame={frame} fps={fps} W={W} H={H} tema={tema} /> : null}
    </AbsoluteFill>
  );
};

export const MotionScene: React.FC<MotionProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const tema = resolveTema(props.tema);
  const est = ESTILOS_MOTION[props.estilo_motion];
  const escenas = props.escenas;
  const startF = escenas.map((e) => Math.round(e.start * fps));
  const fadeOut = Math.round(1.2 * fps);
  return (
    <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo }}>
      {props.audio ? <Audio src={staticFile(props.audio)} /> : null}
      {props.music ? (
        <Audio
          src={staticFile(props.music)}
          loop
          loopVolumeCurveBehavior="extend"
          volume={(f: number) => (props.music_ducked ? 1 : 0.18) * Math.min(1, f / (fps * 2)) * Math.min(1, Math.max(0, (durationInFrames - f) / fadeOut))}
        />
      ) : null}
      {escenas.map((e, i) => {
        const last = i === escenas.length - 1;
        const prevExp = i > 0 ? escenas[i - 1].transicion_salida : undefined;
        const expDur = prevExp ? Math.max(4, Math.round((prevExp.dur ?? EXP_DEF) * fps)) : 0;
        const lead = i === 0 ? 0 : prevExp ? expDur : FADE; // la escena entrante empieza antes para solapar (expansión o fundido)
        const from = Math.max(0, startF[i] - lead);
        const to = last ? durationInFrames : startF[i + 1];
        const dur = Math.max(2, to - from + (last ? 0 : 0));
        return (
          <Sequence key={i} from={from} durationInFrames={dur} layout="none">
            <EscenaCapa e={e} props={props} localOffset={startF[i] - from} expDur={prevExp ? expDur : 0} exp={prevExp} acento={tema.paleta.acento} fade={i > 0 && !prevExp} />
          </Sequence>
        );
      })}
      {est ? <EstiloOverlay id={est.overlay} acento={tema.paleta.acento} /> : null}
      <Subtitles escenas={escenas as never} tema={tema} />
    </AbsoluteFill>
  );
};

// Capa de una escena dentro de su Sequence: frame local = f - from. El reloj de la escena (elementos/cámara) arranca en startF (localOffset).
const EscenaCapa: React.FC<{ e: EscenaMotion; props: MotionProps; localOffset: number; expDur: number; exp?: EscenaMotion["transicion_salida"]; acento: string; fade: boolean }> = ({ e, props, localOffset, expDur, exp, acento, fade }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = props;
  const fEsc = f - localOffset; // fotogramas desde el inicio narrativo de la escena (negativo durante el solape)
  const cuerpo = <Escena e={e} props={props} frame={Math.max(0, fEsc)} />;
  if (exp) {
    return <ExpansionReveal frame={f} dur={expDur} t={exp} W={W} H={H} acento={acento}>{cuerpo}</ExpansionReveal>;
  }
  const op = fade ? Easing.bezier(0.2, 0.8, 0.2, 1)(Math.max(0, Math.min(1, f / FADE))) : 1;
  return <AbsoluteFill style={{ opacity: op }}>{cuerpo}</AbsoluteFill>;
};
