import { describe, expect, it } from "vitest";

import {
  lagerbewegungInputSchema,
  rezeptErstellenInputSchema,
  sudErstellenInputSchema,
  sudzutatErsetzenInputSchema,
} from "./validation";

describe("domain validation", () => {
  it("accepts valid movement signs and rejects conflicting ones", () => {
    expect(
      lagerbewegungInputSchema.safeParse({
        lagercharge_id: 1,
        typ: "ZUGANG",
        mengen_delta: 5,
        idempotenzschluessel: "key-1",
      }).success,
    ).toBe(true);

    expect(
      lagerbewegungInputSchema.safeParse({
        lagercharge_id: 1,
        typ: "VERBRAUCH",
        mengen_delta: 5,
        idempotenzschluessel: "key-2",
      }).success,
    ).toBe(false);

    expect(
      lagerbewegungInputSchema.safeParse({
        lagercharge_id: 1,
        typ: "KORREKTUR",
        mengen_delta: 0,
        idempotenzschluessel: "key-3",
      }).success,
    ).toBe(false);
  });

  it("rejects out-of-range percentages and negative quantities", () => {
    expect(
      sudzutatErsetzenInputSchema.safeParse({
        sudzutat_id: 1,
        rohstoff_id: 2,
        alphasaeure_prozent: 101,
      }).success,
    ).toBe(false);

    expect(
      sudzutatErsetzenInputSchema.safeParse({
        sudzutat_id: 1,
        rohstoff_id: 2,
        menge: -1,
      }).success,
    ).toBe(false);
  });

  it("rejects blank required names", () => {
    expect(rezeptErstellenInputSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(sudErstellenInputSchema.safeParse({ rezeptversion_id: 1, name: "" }).success).toBe(
      false,
    );
  });

  it("validates date-only brewing dates", () => {
    expect(
      sudErstellenInputSchema.safeParse({
        rezeptversion_id: 1,
        name: "Sud",
        braudatum: "2026-11-03",
      }).success,
    ).toBe(true);

    expect(
      sudErstellenInputSchema.safeParse({
        rezeptversion_id: 1,
        name: "Sud",
        braudatum: "03.11.2026",
      }).success,
    ).toBe(false);
  });

  it("requires nonblank idempotency keys", () => {
    expect(
      lagerbewegungInputSchema.safeParse({
        lagercharge_id: 1,
        typ: "KORREKTUR",
        mengen_delta: 1,
        idempotenzschluessel: " ",
      }).success,
    ).toBe(false);
  });
});
