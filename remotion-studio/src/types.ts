// Esquema universal: todo lo visual viene del JSON del guion (tema_visual + escenas). Nada fijo en el código.
export type Word = { text: string; start: number; end: number }; // segundos
export type BloqueTipo = "foto_25d" | "video_clip" | "diapositiva" | "tarjeta_dato" | "escena_3d" | "parallax_pro";
export type EstiloVisual = "cuento_3d_luminoso" | "libro_ilustrado_acuarela" | "comic_dinamico" | "editorial_limpio";
export type Emocion = "gancho" | "calma" | "tension" | "climax" | "cierre";
export type SubEstilo = "estandar" | "B1_COLLAGE" | "B2_3D_INGREDIENTES" | "B3_EPICO_BIBLICO" | "B4_FINANZAS_DATOS" | "B5_MISTERIO_SUSPENSO" | "B6_CIENCIA_CURIOSIDADES";
export type ImagenPlano = { media: string; t?: number; camara?: string; transicion?: "fade" | "slide" | "wipe" | "zoom"; visual_prompt?: string }; // t = segundos desde el inicio de la escena en que ENTRA esta imagen (si falta: reparto por palabras)
export type Capa3D = {
  media: string; // PNG con alpha (recorte) o imagen de fondo, relativo a public/
  tipo?: "fondo" | "sujeto" | "primer_plano" | "tarjeta" | "etiqueta" | "personaje" | "artefacto"; // etiqueta = señalador con línea guía (B6)
  z: number; // profundidad en px: 0 = plano de la pantalla, mayor = más lejos
  x?: number; y?: number; // desplazamiento en px respecto al centro
  ancho?: number; // fracción del ancho del lienzo (a su propia profundidad), por defecto 1
  sombra?: boolean; // sombra proyectada blanda
  texto?: string; dato?: string; // tarjeta 3D
  contador?: { desde: number; hasta: number; prefijo?: string; sufijo?: string; decimales?: number }; // cifra animada (B4/B6)
  subrayar?: boolean; // subrayado animado bajo el texto (B5)
  linea_a?: { x: number; y: number }; // etiqueta: punta de la línea guía (px respecto al centro)
  flota?: number; // amplitud (px) de la flotación orgánica
  // v4.6 · capas vivas (personajes/props recortados de croma #00FF00): animación propia + entrada/salida
  anim?: "respirar" | "rebote" | "mecer" | "temblar" | "pulso" | "flota" | "caminar" | "orar";
  amp?: number; fase?: number; // intensidad (1 = normal) y desfase
  entrada?: { t?: number; palabra?: string; efecto?: "rebote" | "deslizar" | "zoom" | "fade"; dir?: "izq" | "der" | "arriba" | "abajo"; dur?: number };
  salida_t?: number; // s desde el inicio de la escena en que sale (fundido)
  mueve?: { x: number; y: number; t0?: number; t1?: number }; // desplazamiento px (camina/entra) entre t0 y t1 (s)
  // trayectoria propia (v4.6b): keyframes en s desde el inicio de la escena (o `palabra`: ancla a la narración). x,y px respecto al centro; z = acercamiento(+)/alejamiento(-) en px;
  // rot grados; esc escala; op opacidad; e = suavizado del tramo que TERMINA en ese punto; arco = altura (px) de parábola del tramo (lanzamiento/salto); giro = grados extra en el tramo.
  ruta?: { t?: number; palabra?: string; x: number; y: number; z?: number; rot?: number; esc?: number; op?: number; e?: "suave" | "rebote" | "lineal" | "salida" | "resorte"; arco?: number; giro?: number }[];
  pies?: number; aspect?: number; // suelo (y px) donde apoya la capa y alto/ancho del recorte: sombra de contacto coherente
  flip?: boolean; halo?: string; // espejo horizontal / halo de luz (color) detrás del recorte
};
export type Camara3D = { x: number; y: number; z: number; ry?: number; rx?: number };
export type Part3D = "ninguna" | "polvo" | "brasas" | "lluvia" | "nieve";
// plano_general: zoom-in 1.0->1.18 + deriva vertical; detalle: zoom-out 1.18->1.02 + paneo horizontal (se usan en el doble plano)
export type CamaraTipo = "auto" | "zoom_in" | "zoom_out" | "paneo" | "plano_general" | "detalle" | "paneo_izq" | "estatica";
export type Particulas = "ninguna" | "suave" | "media" | "alta";

export type Paleta = { primaria: string; secundaria: string; fondo: string; texto: string; acento: string };
export type TemaVisual = {
  zona_segura_916?: boolean; // 16:9 con banners/tarjetas que caben en el tercio central (el recorte 9:16 no los corta)
  formato: "9:16" | "16:9";
  paleta: Paleta;
  tipografia: string; // Montserrat | Poppins | Inter | Roboto | Oswald | Lora | Cinzel | Special Elite
  particulas: Particulas;
  resaltado_subtitulos: string; // color de la palabra activa
  subtitulos: boolean;
  desenfoque_movimiento: boolean;
  vineta?: boolean; // viñeta + gradación de color cinematográfica
  letterbox?: number; // fracción de alto de cada barra (0 = sin barras), p. ej. 0.04
  cierre_s?: number; // segundos de cierre suave tras la voz (la música baja y la imagen se mantiene)
  estilo_visual?: EstiloVisual; // v4: preset visual intercambiable (paleta, textura, luz, partículas, tipografía, subtítulos)
  sub_estilo?: SubEstilo; // MODO B: uno de los 6 perfiles por nicho (ver PERFILES en theme.ts)
};
export type Atmosfera = "polvo" | "lluvia" | "relampago" | "bioluminiscencia";
export type Sfx = string; // nombres separados por "+": whoosh, impacto, campana, destello, lluvia, ambiente, martillo

// Un recurso visual (una mitad de una escena de doble plano, o la escena completa).
export type Visual = {
  bloque?: BloqueTipo; // si falta se deduce: puntos -> diapositiva, dato -> tarjeta_dato, .mp4 -> video_clip, si no foto_25d
  media?: string | null; // ruta relativa a public/ (imagen o .mp4)
  camara?: CamaraTipo;
  titulo?: string;
  puntos?: string[];
  dato?: string;
  etiqueta?: string;
};

export type Tarjeta = { texto: string; sub?: string; icono?: string; t: number; dur?: number; pos?: "arriba" | "medio"; lado?: "izq" | "der" | "centro"; color?: string; svg?: string; contador?: { desde: number; hasta: number; prefijo?: string; sufijo?: string } }; // svg: arca|lluvia|regla|libro|corazon|estrella|sol|arcoiris|paloma|martillo|animales; t = segundos desde el inicio de la escena

export type Escena = Visual & {
  bg?: string; subject?: string; fg?: string; // escena_3d de 3 capas: fondo, recorte alfa del sujeto, primer plano alfa
  emocion?: Emocion; // etapa emocional: gobierna el ducking de la música y el SFX (si falta se infiere)
  imagenes?: ImagenPlano[]; // v4.1: varias imágenes secuenciales dentro de la escena (la 1.ª puede ser `media`); cortes sobre palabras de la narración
  planos?: number; // nº de micro-planos de cámara (por defecto 2-3 según duración)
  foco?: { x: number; y: number }; // punto focal 0-1 para macro-zoom / origen de zoom
  comparar?: boolean; // pantalla dividida: visuales[0] vs visuales[1] a la vez
  bloque_fijo?: boolean; // no reasignar bloque/cámara automáticamente
  camaras?: string[]; // preset por plano: dolly_in_epico|orbita_3d|tilt_revelacion|whip_pan_blur|zoom_impacto_spring|flotacion_suave
  sujeto?: string; // parallax_pro: PNG con alfa del sujeto (misma resolución que media)
  tarjetas?: Tarjeta[]; // parallax_pro: tarjetas explicativas animadas
  texto: string; // narración (también alimenta los subtítulos)
  bloque: BloqueTipo;
  visuales?: Visual[]; // doble plano: [A, B] dividen el tiempo de la escena en dos mitades
  union?: "fade" | "destello" | "split"; // unión entre A y B (por defecto fade)
  transicion?: "fade" | "slide" | "destello" | "wipe" | "clock"; // máscaras: wipe (barrido) / clock (reloj) // transición de ENTRADA (destello = fundido rápido + light leak)
  atmosfera?: Atmosfera[]; // capas de partículas/clima sobre la escena
  vibracion?: boolean; // micro-vibración de cámara (escenas de tensión)
  camara_dir?: 1 | -1; // dirección lateral de la cámara (coordinada con la ruta de los props)
  coreo?: string; // nota de coreografía cámara-props (opuesta | sigue | acerca | revela); documenta, el guion fija camaras + camara_dir
  capas_vivas?: boolean; // v4.6: escena_3d con capas animadas (croma #00FF00) + cámara multifase
  luz?: string; // color de luz viva (parpadeo cálido de antorcha/lámpara) en los bordes
  cuenta?: { desde?: number; texto?: string; x?: number; y?: number }; // momento interactivo: cuenta regresiva 3-2-1 al final de la escena
  capas?: Capa3D[]; // escena_3d: ingredientes separados (fondo, sujeto, primer plano, tarjetas)
  cam_desde?: Camara3D; cam_hasta?: Camara3D; // escena_3d: cámara X/Y/Z
  foco_z?: number; // profundidad nítida; el resto se desenfoca
  particulas3d?: Part3D;
  iris?: { x: number; y: number }; // B1: la escena se abre en iris desde este punto (fracción 0-1)
  sfx?: Sfx; // efecto de sonido al inicio de la escena
  sfx_t?: [string, string | number, number?][]; // v4.7: efectos sincronizados con la accion: [nombre, ancla(palabra+off | t:seg | fin-seg | seg), volumen]
  start: number;
  end: number;
  words: Word[];
};

export type UniversalProps = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  audio: string; // relativo a public/
  music?: string | null;
  sfx?: Record<string, string | undefined>; // rutas relativas a public/
  music_ducked?: boolean; // la musica ya trae sidechain real de FFmpeg (no aplicar ducking en Remotion)
  tema: TemaVisual;
  escenas: Escena[];
};
