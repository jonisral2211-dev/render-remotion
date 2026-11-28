import { Escena } from "../types";

// Ejemplos de escena para el MODO B. Rutas relativas a public/ (img/ = capas descargadas de Flow y recortadas).
// B2 Â· Motion Graphics 3D con Ingredientes: fondo (z lejos) + sujeto recortado (z medio) + primer plano (z cerca) + tarjeta 3D.
export const ejemploB2: Escena = {
  bloque: "escena_3d",
  texto: "ElÃ­as camina hacia la cueva mientras el viento levanta el polvo del desierto.",
  start: 0,
  end: 6,
  words: [],
  capas: [
    { tipo: "fondo", media: "img/fondo_desierto.jpg", z: 2200, ancho: 1.1 },
    { tipo: "sujeto", media: "img/elias_recorte.png", z: 300, ancho: 0.55, y: 140, sombra: true },
    { tipo: "primer_plano", media: "img/roca_primer_plano.png", z: -250, ancho: 0.45, x: -260, y: 520 },
    { tipo: "tarjeta", media: "", z: 150, x: 300, y: -560, texto: "Monte Horeb", dato: "40 dÃ­as" },
  ],
  cam_desde: { x: -60, y: 20, z: 0, ry: -3 },
  cam_hasta: { x: 60, y: -10, z: 700, ry: 3 },
  foco_z: 300,
  particulas3d: "polvo",
};

// B1 Â· Collage / Archivo: la misma escena con textura de papel/grano, temblor de cÃ¡mara e iris de entrada.
// (se activa con tema = perfilTema("B1_COLLAGE"), ver PERFILES en theme.ts)
export const ejemploB1: Escena = { ...ejemploB2, iris: { x: 0.5, y: 0.45 } };

// B4 Â· Finanzas/Datos: cifra animada en tarjeta editorial (se usa con tema = perfilTema("B4_FINANZAS_DATOS")).
export const ejemploB4: Escena = {
  bloque: "escena_3d", texto: "El interÃ©s compuesto convierte mil pesos en una fortuna.", start: 0, end: 3.5, words: [],
  capas: [
    { tipo: "fondo", media: "img/fondo_oficina.jpg", z: 1800, ancho: 1.1 },
    { tipo: "sujeto", media: "img/monedas_recorte.png", z: 250, ancho: 0.5, y: 220, sombra: true },
    { tipo: "tarjeta", media: "", z: 100, y: -520, texto: "En 30 aÃ±os", contador: { desde: 1000, hasta: 17449, prefijo: "$" }, subrayar: true },
  ],
};
// B6 Â· Ciencia: etiqueta seÃ±aladora con lÃ­nea guÃ­a animada sobre un sujeto generado en Flow.
export const ejemploB6: Escena = {
  bloque: "escena_3d", texto: "JÃºpiter es tan grande que cabrÃ­an mil trescientas Tierras.", start: 0, end: 5, words: [],
  capas: [
    { tipo: "fondo", media: "img/fondo_espacio.jpg", z: 2400, ancho: 1.15 },
    { tipo: "sujeto", media: "img/jupiter_recorte.png", z: 400, ancho: 0.8, y: 60 },
    { tipo: "etiqueta", media: "", z: 150, x: -260, y: -520, linea_a: { x: -40, y: -140 }, texto: "Gran Mancha Roja", dato: "16 000 km" },
  ],
  foco_z: 400,
};

