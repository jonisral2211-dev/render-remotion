// MODO C — animación / motion graphics. Esquema propio (no mezcla con Escena/UniversalProps de los modos A/B).
import { TemaVisual, Word } from "../types";

// Ancla temporal: "t:1.2" (s desde el inicio de la escena) | "palabra:3" (índice) | "palabra:texto" (1ª coincidencia) | "beat:4" (k-ésimo pulso) | "fin" (fin de la escena)
export type Ancla = string;
export type EfectoEntrada = "revelado_mascara" | "deslizar" | "zoom" | "fade";
export type Dir = "izq" | "der" | "arriba" | "abajo";

export type Elemento = {
  id: string;
  tipo: "texto" | "imagen" | "forma";
  texto?: string;
  media?: string; // relativo a public/
  forma?: "circulo" | "rect" | "rombo";
  color?: string;
  x: number; y: number; // centro, fracción del lienzo (0-1)
  ancho?: number; // fracción del ancho del lienzo
  entrada: { ancla: Ancla; efecto: EfectoEntrada; dir?: Dir; dur?: number; guias?: boolean }; // dur en s
  salida?: { ancla?: Ancla; dur?: number };
  encadena?: boolean; // arranca donde/cuando termina el elemento anterior (movimiento continuo, sin corte seco)
  desde?: { x: number; y: number }; // origen del movimiento si no encadena
  enfasis?: { ancla: Ancla; efecto: "pulso" | "resalte" | "sacudida"; dur?: number }[]; // énfasis sincronizados con la narración
  foco?: boolean; // la cámara sigue a este elemento mientras es el punto de interés
};

export type TransExpansion = {
  forma: "circulo" | "rombo" | "rect";
  origen: { x: number; y: number }; // punto de arranque (fracción 0-1), normalmente la posición del objeto
  dur?: number; // s (por defecto 0,7)
  elemento?: string; // id del elemento que se transforma en la expansión
  color?: string; // color del borde luminoso de la expansión
};

export type CamaraMotion = {
  sigue?: "foco" | "auto" | "fija"; // foco: elementos con foco:true; auto: el último elemento que entró
  zoom?: number; // 1,0-1,6 (por defecto 1,14)
  suavizado?: number; // s de desplazamiento entre puntos de interés (por defecto 0,6)
  keys?: { t: number; x: number; y: number; zoom?: number }[]; // puntos de interés manuales (t en s desde el inicio de la escena)
};

export type EscenaMotion = {
  texto: string;
  start: number; end: number; words: Word[];
  media?: string | null; // imagen de Flow (estilo ya aplicado en el prompt)
  elementos?: Elemento[];
  camara?: CamaraMotion;
  transicion_salida?: TransExpansion; // la escena SIGUIENTE entra expandiéndose desde este objeto
  emocion?: string;
};

export type MotionProps = {
  modo: "C_MOTION";
  fps: number; width: number; height: number; durationInFrames: number;
  audio: string; music?: string | null; music_ducked?: boolean;
  tema: TemaVisual;
  estilo_motion: string; // id del catálogo (estilos_motion.ts / scripts/estilos_visuales.py)
  ritmo?: { bpm: number; snap?: boolean }; // rejilla de pulsos para "beat:k" y ajuste de entradas al ritmo
  escenas: EscenaMotion[];
};
