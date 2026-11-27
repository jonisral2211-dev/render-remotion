import { Foto25D } from "./Foto25D";
import { VideoClip } from "./VideoClip";
import { Diapositiva } from "./Diapositiva";
import { TarjetaDato } from "./TarjetaDato";

import { Parallax3D } from "./Parallax3D";
import { Escena3D } from "./Escena3D";
import { SecuenciaPlanos } from "./SecuenciaPlanos";

export const BLOQUES = { foto_25d: Foto25D, video_clip: VideoClip, diapositiva: Diapositiva, tarjeta_dato: TarjetaDato, escena_3d: Escena3D, parallax_pro: Parallax3D, secuencia: SecuenciaPlanos };
/** v4.1: escenas con 2+ imágenes usan SecuenciaPlanos (excepto bloques de código/vídeo). */
export const bloqueDe = (e: { bloque: string; imagenes?: unknown[] }) => ((e.imagenes?.length ?? 0) > 1 && (e.bloque === "foto_25d" || e.bloque === "escena_3d") ? SecuenciaPlanos : (BLOQUES as Record<string, any>)[e.bloque] ?? Foto25D);
