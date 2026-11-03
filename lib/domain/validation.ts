import { z } from "zod";

export const rohstoffKategorien = z.enum(["MALZ", "HOPFEN", "HEFE", "GEWUERZ", "SONSTIGES"]);

export const basiseinheiten = z.enum(["g", "ml", "Stueck"]);

export const rezeptversionStatus = z.enum(["ENTWURF", "FREIGEGEBEN"]);

export const sudStatus = z.enum(["GEPLANT", "IN_ARBEIT", "ABGESCHLOSSEN", "VERWORFEN"]);

export const lagerbewegungTypen = z.enum(["ZUGANG", "VERBRAUCH", "KORREKTUR", "ENTSORGUNG"]);

export const prozessschrittTypen = z.enum([
  "EINMAISCHEN",
  "RAST",
  "NACHGUSS",
  "KOCHEN",
  "GAERUNG",
  "KALTHOPFUNG",
  "REIFUNG",
  "ABFUELLUNG",
  "SONSTIGES",
]);

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format");

const nonBlank = z.string().trim().min(1, "Must not be blank");

const positiveId = z.number().int().positive();

const nonNegative = z.number().finite().min(0);

const percentage = z.number().finite().min(0).max(100);

export const rohstoffInputSchema = z.object({
  name: nonBlank,
  kategorie: rohstoffKategorien,
  basiseinheit: basiseinheiten,
  archiviert: z.boolean().optional(),
  notizen: z.string().nullable().optional(),
});

export const lagerchargeInputSchema = z.object({
  rohstoff_id: positiveId,
  lieferanten_chargennummer: z.string().nullable().optional(),
  lieferdatum: dateOnly,
  mhd: dateOnly.nullable().optional(),
  alphasaeure_prozent: percentage.nullable().optional(),
  ebc: nonNegative.nullable().optional(),
  notizen: z.string().nullable().optional(),
});

export const lagerbewegungInputSchema = z
  .object({
    lagercharge_id: positiveId,
    sudzutat_id: positiveId.nullable().optional(),
    typ: lagerbewegungTypen,
    mengen_delta: z
      .number()
      .finite()
      .refine((value) => value !== 0, "Must not be zero"),
    idempotenzschluessel: nonBlank,
    zeitpunkt: z.string().datetime({ offset: true }).optional(),
    notizen: z.string().nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.typ === "ZUGANG" && value.mengen_delta <= 0) {
      context.addIssue({
        code: "custom",
        path: ["mengen_delta"],
        message: "ZUGANG requires a positive delta",
      });
    }
    if ((value.typ === "VERBRAUCH" || value.typ === "ENTSORGUNG") && value.mengen_delta >= 0) {
      context.addIssue({
        code: "custom",
        path: ["mengen_delta"],
        message: `${value.typ} requires a negative delta`,
      });
    }
  });

export const rezeptErstellenInputSchema = z.object({
  name: nonBlank,
  beschreibung: z.string().nullable().optional(),
  infos: z.string().nullable().optional(),
});

export const sudErstellenInputSchema = z.object({
  rezeptversion_id: positiveId,
  name: nonBlank,
  sudnummer: nonBlank.optional(),
  braudatum: dateOnly.nullable().optional(),
});

export const sudzutatErsetzenInputSchema = z.object({
  sudzutat_id: positiveId,
  rohstoff_id: positiveId,
  menge: nonNegative.nullable().optional(),
  alphasaeure_prozent: percentage.nullable().optional(),
  ebc: nonNegative.nullable().optional(),
  notizen: z.string().nullable().optional(),
});

export const sudzutatIstMengeSchema = z.object({
  sudzutat_id: positiveId,
  ist_menge: nonNegative.nullable(),
  aus_lager: z.boolean().optional(),
});

export type RohstoffInput = z.infer<typeof rohstoffInputSchema>;
export type LagerchargeInput = z.infer<typeof lagerchargeInputSchema>;
export type LagerbewegungInput = z.infer<typeof lagerbewegungInputSchema>;
export type RezeptErstellenInput = z.infer<typeof rezeptErstellenInputSchema>;
export type SudErstellenInput = z.infer<typeof sudErstellenInputSchema>;
export type SudzutatErsetzenInput = z.infer<typeof sudzutatErsetzenInputSchema>;
export type SudzutatIstMengeInput = z.infer<typeof sudzutatIstMengeSchema>;
