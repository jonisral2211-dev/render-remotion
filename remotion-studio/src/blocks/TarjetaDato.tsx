import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BloqueProps } from "./common";
import { Fondo } from "./Fondo";
import { getFont } from "../fonts";

// Fondo (imagen o video) difuminado + tarjeta limpia con una frase, cifra o concepto clave.
export const TarjetaDato: React.FC<BloqueProps> = ({ escena, tema }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { fontFamily, weight } = getFont(tema.tipografia);
  const P = tema.paleta;
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const unit = Math.min(width, height);
  const vertical = height > width;
  const texto = escena.dato ?? escena.titulo ?? "";
  return (
    <AbsoluteFill style={{ backgroundColor: P.fondo, overflow: "hidden", fontFamily }}>
      {escena.media ? (
        <AbsoluteFill style={{ transform: "scale(1.12)" }}>
          <Fondo media={escena.media} style={{ filter: "blur(16px) brightness(0.55) saturate(1.1)" }} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ background: `linear-gradient(155deg, ${P.fondo}, ${P.primaria})` }} />
      )}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: vertical ? height * 0.12 : 0 }}>
        <div
          style={{
            width: vertical ? "80%" : "58%", padding: unit * 0.07, borderRadius: unit * 0.05,
            background: "rgba(255,255,255,0.12)", border: `2px solid ${P.acento}66`, backdropFilter: "blur(10px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)", textAlign: "center", color: P.texto,
            opacity: s, transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + 0.04 * s})`,
          }}
        >
          {escena.etiqueta && (
            <div style={{ color: P.acento, fontWeight: 600, fontSize: unit * 0.04, letterSpacing: 3, textTransform: "uppercase", marginBottom: unit * 0.025 }}>
              {escena.etiqueta}
            </div>
          )}
          <div style={{ fontWeight: weight, fontSize: unit * (texto.length < 14 ? 0.17 : 0.085), lineHeight: 1.1 }}>{texto}</div>
          {escena.dato && escena.titulo && (
            <div style={{ marginTop: unit * 0.03, fontWeight: 600, fontSize: unit * 0.045, opacity: 0.9 }}>{escena.titulo}</div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
