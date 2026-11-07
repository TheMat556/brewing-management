import type { Tables } from "@/lib/database.types";

export type Geraet = Tables<"tb_geraet">;

export const geraete = [
  {
    id: 1,
    name: "50-Liter-Sudkessel",
    menge: 1,
    lob_faehig: false,
    lob_menge_l: null,
    archiviert: false,
    notizen: "Elektrisch beheizter Kessel.",
  },
  {
    id: 2,
    name: "30-Liter-Gärtank",
    menge: 3,
    lob_faehig: true,
    lob_menge_l: 30,
    archiviert: false,
    notizen: "Edelstahl-Zylinder mit Gärspund.",
  },
  {
    id: 3,
    name: "20-Liter-Keg",
    menge: 4,
    lob_faehig: true,
    lob_menge_l: 20,
    archiviert: false,
    notizen: "Für Druckabfüllung und Ausschank.",
  },
  {
    id: 4,
    name: "20-Liter-Gäreimer",
    menge: 2,
    lob_faehig: false,
    lob_menge_l: null,
    archiviert: false,
    notizen: "Kunststoff, für kleine Versuche.",
  },
  {
    id: 5,
    name: "Kühlspirale",
    menge: 1,
    lob_faehig: false,
    lob_menge_l: null,
    archiviert: false,
    notizen: null,
  },
  {
    id: 6,
    name: "Refraktometer",
    menge: 1,
    lob_faehig: false,
    lob_menge_l: null,
    archiviert: false,
    notizen: "Für Stammwürze-Messungen.",
  },
  {
    id: 7,
    name: "Alte Abfüllanlage",
    menge: 1,
    lob_faehig: false,
    lob_menge_l: null,
    archiviert: true,
    notizen: "Ersetzt, bleibt für die Historie erhalten.",
  },
] satisfies Geraet[];
