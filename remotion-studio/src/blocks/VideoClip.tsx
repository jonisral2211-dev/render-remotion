import React from "react";
import { AbsoluteFill } from "remotion";
import { BloqueProps } from "./common";
import { Fondo } from "./Fondo";

// Clip .mp4 en movimiento (silenciado: la narración es la pista de voz), en bucle si es más corto que la escena.
export const VideoClip: React.FC<BloqueProps> = ({ escena, tema }) => (
  <AbsoluteFill style={{ backgroundColor: tema.paleta.fondo }}>
    <Fondo media={escena.media} />
  </AbsoluteFill>
);
