import React from "react";
import { Composition } from "remotion";
import { UniversalExplainer } from "./UniversalExplainer";
import { UniversalProps } from "./types";
import { TEMA_BASE } from "./theme";
import { MotionScene } from "./motion/MotionScene";

const defaultProps: UniversalProps = {
  fps: 30, width: 1080, height: 1920, durationInFrames: 150, audio: "", music: null, tema: TEMA_BASE,
  escenas: [{
    texto: "Escena de ejemplo", bloque: "diapositiva", titulo: "Título", puntos: ["Primer punto", "Segundo punto"],
    start: 0, end: 5, words: [{ text: "Escena", start: 0, end: 1.5 }, { text: "de", start: 1.5, end: 2.5 }, { text: "ejemplo", start: 2.5, end: 5 }],
  }],
};

// MODO C (animación / motion graphics): se activa SOLO con props.modo === "C_MOTION"; el resto de modos no cambia.
const Router: React.FC<any> = (props) => (props.modo === "C_MOTION" ? <MotionScene {...props} /> : <UniversalExplainer {...props} />);

export const Root: React.FC = () => (
  <Composition
    id="Main"
    component={Router}
    durationInFrames={defaultProps.durationInFrames}
    fps={defaultProps.fps}
    width={defaultProps.width}
    height={defaultProps.height}
    defaultProps={defaultProps}
    calculateMetadata={({ props }: { props: any }) => ({
      durationInFrames: props.durationInFrames, fps: props.fps, width: props.width, height: props.height,
    })}
  />
);
