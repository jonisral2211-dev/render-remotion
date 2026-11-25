import "@fontsource/cinzel/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/special-elite/400.css";
import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as poppins } from "@remotion/google-fonts/Poppins";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as roboto } from "@remotion/google-fonts/Roboto";
import { loadFont as oswald } from "@remotion/google-fonts/Oswald";
import { loadFont as lora } from "@remotion/google-fonts/Lora";

const sub = { subsets: ["latin" as const, "latin-ext" as const] };
const LOADERS: Record<string, () => { fontFamily: string; weight: number }> = {
  Montserrat: () => ({ fontFamily: montserrat("normal", { weights: ["800"], subsets: [...sub.subsets] }).fontFamily, weight: 800 }),
  Poppins: () => ({ fontFamily: poppins("normal", { weights: ["800"], subsets: [...sub.subsets] }).fontFamily, weight: 800 }),
  Inter: () => ({ fontFamily: inter("normal", { weights: ["800"], subsets: [...sub.subsets] }).fontFamily, weight: 800 }),
  Roboto: () => ({ fontFamily: roboto("normal", { weights: ["900"], subsets: [...sub.subsets] }).fontFamily, weight: 900 }),
  Oswald: () => ({ fontFamily: oswald("normal", { weights: ["700"], subsets: [...sub.subsets] }).fontFamily, weight: 700 }),
  Lora: () => ({ fontFamily: lora("normal", { weights: ["700"], subsets: [...sub.subsets] }).fontFamily, weight: 700 }),
  Cinzel: () => ({ fontFamily: "Cinzel", weight: 700 }), // B3 · @fontsource (offline)
  "Special Elite": () => ({ fontFamily: "'Special Elite'", weight: 400 }), // B5
};

export const getFont = (name: string) => (LOADERS[name] ?? LOADERS.Montserrat)();
