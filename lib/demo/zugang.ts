import type { Tables } from "@/lib/database.types";

export type BerechtigterBenutzer = Tables<"tb_berechtigter_benutzer">;

export type DemoBenutzer = {
  benutzer_id: string;
  name: string;
  email: string;
  rolle: "Eigentümer" | "Brauer";
  erstellt_am: string;
};

export const berechtigteBenutzer = [
  {
    benutzer_id: "11111111-1111-4111-8111-111111111111",
    erstellt_am: "2026-05-01T09:00:00+02:00",
  },
  {
    benutzer_id: "22222222-2222-4222-8222-222222222222",
    erstellt_am: "2026-06-12T14:30:00+02:00",
  },
] satisfies BerechtigterBenutzer[];

export const demoBenutzer: DemoBenutzer[] = [
  {
    benutzer_id: "11111111-1111-4111-8111-111111111111",
    name: "Max Brauer",
    email: "max@brauerei.example",
    rolle: "Eigentümer",
    erstellt_am: "2026-05-01T09:00:00+02:00",
  },
  {
    benutzer_id: "22222222-2222-4222-8222-222222222222",
    name: "Erika Mälzer",
    email: "erika@brauerei.example",
    rolle: "Brauer",
    erstellt_am: "2026-06-12T14:30:00+02:00",
  },
];

export const aktuellerBenutzer = demoBenutzer[0];
