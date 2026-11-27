// MODO C — capa de acabado propia de cada estilo visual (complementa el prompt de Flow; no sustituye a la imagen).
import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { OverlayId } from "./estilos_motion";

export const EstiloOverlay: React.FC<{ id: OverlayId; acento: string }> = ({ id, acento }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const fill: React.CSSProperties = { pointerEvents: "none" };
  switch (id) {
    case "scanlines":
      return <AbsoluteFill style={{ ...fill, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 5px)", mixBlendMode: "multiply", opacity: 0.55 }} />;
    case "halftone":
      return <AbsoluteFill style={{ ...fill, backgroundImage: "radial-gradient(rgba(0,0,0,0.5) 1.2px, transparent 1.6px)", backgroundSize: "9px 9px", mixBlendMode: "multiply", opacity: 0.28 }} />;
    case "cuadricula":
      return <AbsoluteFill style={{ ...fill, backgroundImage: "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)", backgroundSize: "54px 54px" }} />;
    case "vineta":
      return <AbsoluteFill style={{ ...fill, background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.42) 100%)" }} />;
    case "bloom":
      return <AbsoluteFill style={{ ...fill, background: `radial-gradient(circle at 50% 40%, ${acento}33, transparent 60%)`, mixBlendMode: "screen" }} />;
    case "brillo_vidrio":
    case "brillo_plastico": {
      const x = ((frame * 3) % (W * 2.4)) - W * 0.7; // reflejo diagonal que barre la imagen
      return <AbsoluteFill style={{ ...fill, background: `linear-gradient(105deg, transparent ${x - 160}px, rgba(255,255,255,0.22) ${x}px, transparent ${x + 160}px)`, mixBlendMode: "screen" }} />;
    }
    case "grano_antiguo": {
      const flick = 0.04 * random(`fl${Math.floor(frame / 2)}`); // parpadeo de proyector
      const lines = Array.from({ length: 3 }, (_, k) => ({ x: random(`sx${Math.floor(frame / 3)}_${k}`) * W, o: 0.06 + 0.14 * random(`so${Math.floor(frame / 3)}_${k}`) }));
      return (
        <AbsoluteFill style={fill}>
          <AbsoluteFill style={{ background: `rgba(255,255,255,${flick})`, mixBlendMode: "overlay" }} />
          {lines.map((l, i) => <div key={i} style={{ position: "absolute", left: l.x, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.8)", opacity: l.o }} />)}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)" }} />
        </AbsoluteFill>
      );
    }
    case "papel":
      return <AbsoluteFill style={{ ...fill, backgroundImage: "radial-gradient(rgba(120,100,70,0.10) 1px, transparent 1.4px)", backgroundSize: "5px 5px", mixBlendMode: "multiply", opacity: 0.7 }} />;
    case "polvo_tiza": {
      const motas = Array.from({ length: 28 }, (_, k) => ({ x: random(`px${k}`) * W, y: ((random(`py${k}`) * H + frame * (0.4 + random(`pv${k}`))) % H), r: 1 + random(`pr${k}`) * 2.2 }));
      return <AbsoluteFill style={fill}>{motas.map((m, i) => <div key={i} style={{ position: "absolute", left: m.x, top: m.y, width: m.r, height: m.r, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />)}</AbsoluteFill>;
    }
    case "lluvia_matrix": {
      const cols = Array.from({ length: 22 }, (_, k) => ({ x: (k + 0.5) * (W / 22), y: ((random(`mc${k}`) * H * 2 + frame * (6 + random(`mv${k}`) * 9)) % (H * 1.4)) - H * 0.2 }));
      return (
        <AbsoluteFill style={{ ...fill, mixBlendMode: "screen" }}>
          {cols.map((c, i) => <div key={i} style={{ position: "absolute", left: c.x, top: c.y - 360, width: 3, height: 360, background: "linear-gradient(transparent, #00FF41)", opacity: 0.55 }} />)}
        </AbsoluteFill>
      );
    }
    case "pixelado":
    case "ninguno":
    default:
      return null;
  }
};
