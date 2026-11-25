import { Paleta, TemaVisual } from "./types";

export const TEMA_BASE: TemaVisual = {
  formato: "9:16",
  paleta: { primaria: "#1E3A8A", secundaria: "#7C3AED", fondo: "#0B1020", texto: "#FFFFFF", acento: "#FFC93C" },
  tipografia: "Montserrat",
  particulas: "suave",
  resaltado_subtitulos: "#FFD700",
  subtitulos: true,
  desenfoque_movimiento: true,
  vineta: false,
  letterbox: 0,
  cierre_s: 0,
};

export const resolveTema = (t?: Partial<TemaVisual> & { paleta?: Partial<Paleta> }): TemaVisual => ({
  ...TEMA_BASE,
  ...(t ?? {}),
  paleta: { ...TEMA_BASE.paleta, ...(t?.paleta ?? {}) },
});

export const isVideo = (p?: string | null) => !!p && /\.(mp4|webm|mov)$/i.test(p);

// ============ MODO B · 6 SUB-ESTILOS POR NICHO ============
export type TarjetaEstilo = "papel" | "dorado" | "editorial" | "expediente" | "etiqueta" | "cristal";
export type Perfil = {
  nombre: string;
  tema: Partial<TemaVisual>;
  tarjeta: TarjetaEstilo;
  textura: boolean; // grano/trama/viñeta tipo película (Textura.tsx)
  tinte?: string; // gradación de color global (rgba) sobre la escena
  vibracion: number; // micro-vibración de cámara en px (0 = ninguna)
  letterbox: number; // fracción de alto de cada barra (anamórfico = 0.06)
  corte_s: [number, number]; // duración recomendada por escena (s)
  particulas: "ninguna" | "polvo" | "brasas" | "lluvia" | "nieve";
  easing: [number, number, number, number]; // Easing.bezier de la cámara
  push: number; // empuje Z por defecto si la escena no trae cam_hasta
  fuente?: string; // familia tipográfica sugerida para titulares
  iris: boolean;
  voz: { nombre: string; alternativas?: string[]; rate: string; pitch: string; pausa_s: number }; // Edge-TTS; pausa_s = silencio de énfasis en giros/clímax (0 = sin pausas extra)
};

const oro = "#FFD700";
export const PERFILES: Record<Exclude<import("./types").SubEstilo, "estandar">, Perfil> = {
  B1_COLLAGE: {
    voz: { nombre: "es-AR-TomasNeural", rate: "+2%", pitch: "-2Hz", pausa_s: 0.30 },
    nombre: "Collage / Archivo Documental", tarjeta: "papel", textura: true, vibracion: 1.6, letterbox: 0, corte_s: [2.5, 4], particulas: "polvo", easing: [0.45, 0, 0.2, 1], push: 380, iris: true,
    tema: { sub_estilo: "B1_COLLAGE", paleta: { primaria: "#F2B45C", secundaria: "#3E6B6B", fondo: "#0D0B0A", texto: "#F3EBDD", acento: "#C6F94D" }, resaltado_subtitulos: oro, vineta: true, particulas: "suave" },
  },
  B2_3D_INGREDIENTES: {
    voz: { nombre: "es-CO-GonzaloNeural", rate: "+3%", pitch: "0Hz", pausa_s: 0 },
    nombre: "Motion Graphics 3D con Ingredientes", tarjeta: "cristal", textura: false, vibracion: 0, letterbox: 0, corte_s: [5, 7], particulas: "polvo", easing: [0.45, 0, 0.2, 1], push: 600, iris: false,
    tema: { sub_estilo: "B2_3D_INGREDIENTES", paleta: { primaria: "#1E3A8A", secundaria: "#7C3AED", fondo: "#0B1020", texto: "#FFFFFF", acento: "#FFC93C" }, resaltado_subtitulos: oro, vineta: true, desenfoque_movimiento: true },
  },
  B3_EPICO_BIBLICO: {
    voz: { nombre: "es-MX-JorgeNeural", rate: "-3%", pitch: "-4Hz", pausa_s: 0.45 },
    nombre: "Épico Bíblico e Histórico 2.5D", tarjeta: "dorado", textura: true, tinte: "rgba(255,170,60,0.06)", vibracion: 0, letterbox: 0.06, corte_s: [5, 7], particulas: "brasas", easing: [0.25, 0.1, 0.25, 1], push: 260, iris: false, fuente: "Cinzel / Lora",
    tema: { sub_estilo: "B3_EPICO_BIBLICO", tipografia: "Cinzel", paleta: { primaria: oro, secundaria: "#7A4B12", fondo: "#0A0705", texto: "#F6E9CF", acento: oro }, resaltado_subtitulos: oro, vineta: true, letterbox: 0.06, desenfoque_movimiento: true },
  },
  B4_FINANZAS_DATOS: {
    voz: { nombre: "es-CL-LorenzoNeural", alternativas: ["es-MX-DaliaNeural"], rate: "+7%", pitch: "+1Hz", pausa_s: 0 },
    nombre: "Finanzas, Negocios y Psicología Viral", tarjeta: "editorial", textura: false, vibracion: 0, letterbox: 0, corte_s: [3, 4], particulas: "ninguna", easing: [0.6, 0, 0.2, 1], push: 500, iris: false, fuente: "Montserrat / Inter",
    tema: { sub_estilo: "B4_FINANZAS_DATOS", tipografia: "Montserrat", paleta: { primaria: "#22C55E", secundaria: "#3B82F6", fondo: "#0B0F17", texto: "#F5F7FA", acento: "#22C55E" }, resaltado_subtitulos: oro, vineta: false, desenfoque_movimiento: true },
  },
  B5_MISTERIO_SUSPENSO: {
    voz: { nombre: "es-AR-ElenaNeural", alternativas: ["es-MX-JorgeNeural"], rate: "-6%", pitch: "-6Hz", pausa_s: 0.50 },
    nombre: "Terror, Conspiraciones y Crimen", tarjeta: "expediente", textura: true, tinte: "rgba(10,60,80,0.18)", vibracion: 2.4, letterbox: 0.04, corte_s: [4, 6], particulas: "polvo", easing: [0.3, 0, 0.7, 1], push: 340, iris: false, fuente: "Special Elite / Oswald",
    tema: { sub_estilo: "B5_MISTERIO_SUSPENSO", tipografia: "Special Elite", paleta: { primaria: "#0E4F5C", secundaria: "#8B0A1F", fondo: "#05090D", texto: "#D8E6EA", acento: "#DC143C" }, resaltado_subtitulos: oro, vineta: true, letterbox: 0.04 },
  },
  B6_CIENCIA_CURIOSIDADES: {
    voz: { nombre: "es-CO-SalomeNeural", rate: "+6%", pitch: "+2Hz", pausa_s: 0 },
    nombre: "Ciencia, Espacio y Curiosidades", tarjeta: "etiqueta", textura: false, vibracion: 0, letterbox: 0, corte_s: [4, 6], particulas: "nieve", easing: [0.5, 0, 0.1, 1], push: 700, iris: false, fuente: "Poppins / Roboto",
    tema: { sub_estilo: "B6_CIENCIA_CURIOSIDADES", paleta: { primaria: "#38BDF8", secundaria: "#A78BFA", fondo: "#040814", texto: "#EAF6FF", acento: "#38BDF8" }, resaltado_subtitulos: oro, vineta: true, desenfoque_movimiento: true },
  },
};
// Alias heredados del turno anterior
export const TEMA_ARCHIVO = PERFILES.B1_COLLAGE.tema;
export const TEMA_3D = PERFILES.B2_3D_INGREDIENTES.tema;
/** Aplica un perfil por nicho: resolveTema(perfilTema("B3_EPICO_BIBLICO")) */
export const perfilTema = (id: keyof typeof PERFILES) => PERFILES[id].tema;
