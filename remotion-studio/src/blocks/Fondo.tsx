import React from "react";
import { Img, staticFile } from "remotion";
import { Video } from "@remotion/media";
import { isVideo } from "../theme";

// Imagen o clip a pantalla completa (cover, sin deformar). Si no hay media, no pinta nada.
export const Fondo: React.FC<{ media?: string | null; style?: React.CSSProperties }> = ({ media, style }) => {
  if (!media) return null;
  const base: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover", ...style };
  return isVideo(media) ? <Video src={staticFile(media)} muted loop style={base} /> : <Img src={staticFile(media)} style={base} />;
};
