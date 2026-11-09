"use client";

import { CheckCircle2, FilePlus2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { DemoDialogShell } from "@/components/demo/demo-action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Rezept, Rezeptversion, Rohstoff } from "@/lib/demo";
import { basiseinheitLabels, prozessschrittTypLabels } from "@/lib/labels";

const stepTitles = ["Stammdaten", "Zutaten", "Schritte", "Zielwerte", "Prüfen"] as const;

type WizardStep = {
  key: string;
  position: string;
  typ: keyof typeof prozessschrittTypLabels;
  name: string;
  temperatur: string;
  dauer: string;
  wasser: string;
  anweisung: string;
};

type WizardIngredient = {
  key: string;
  rohstoff: string;
  menge: string;
  einheit: keyof typeof basiseinheitLabels;
  schritt: string;
  alpha: string;
  ebc: string;
  zugabe: string;
  notizen: string;
};

type WizardTargets = {
  ausschlagmenge: string;
  stammwuerze: string;
  abv: string;
  ibu: string;
  ebc: string;
  infos: string;
};

const textareaClass =
  "min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

let nextWizardKey = 1;

function createWizardKey(prefix: string): string {
  const key = `${prefix}-${nextWizardKey}`;
  nextWizardKey += 1;
  return key;
}

function emptyStep(position: number): WizardStep {
  return {
    key: createWizardKey("step"),
    position: String(position),
    typ: "RAST",
    name: "",
    temperatur: "",
    dauer: "",
    wasser: "",
    anweisung: "",
  };
}

function emptyIngredient(): WizardIngredient {
  return {
    key: createWizardKey("ingredient"),
    rohstoff: "",
    menge: "",
    einheit: "g",
    schritt: "kein-schritt",
    alpha: "",
    ebc: "",
    zugabe: "",
    notizen: "",
  };
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function RecipeWizard({
  rohstoffe,
  onCreated,
}: {
  rohstoffe: Rohstoff[];
  onCreated: (recipe: Rezept, version: Rezeptversion) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [recipeInfos, setRecipeInfos] = useState("");
  const [steps, setSteps] = useState<WizardStep[]>([emptyStep(1)]);
  const [ingredients, setIngredients] = useState<WizardIngredient[]>([emptyIngredient()]);
  const [targets, setTargets] = useState<WizardTargets>({
    ausschlagmenge: "",
    stammwuerze: "",
    abv: "",
    ibu: "",
    ebc: "",
    infos: "",
  });

  function reset() {
    setActiveStep(0);
    setSubmitted(false);
    setError(null);
    setName("");
    setBeschreibung("");
    setRecipeInfos("");
    setSteps([emptyStep(1)]);
    setIngredients([emptyIngredient()]);
    setTargets({
      ausschlagmenge: "",
      stammwuerze: "",
      abv: "",
      ibu: "",
      ebc: "",
      infos: "",
    });
  }

  function openWizard() {
    reset();
    setOpen(true);
  }

  function validateStep(stepIndex: number): string | null {
    if (stepIndex === 0 && !name.trim()) {
      return "Der Rezeptname ist erforderlich.";
    }
    if (stepIndex === 1) {
      if (ingredients.length === 0) {
        return "Mindestens eine Zutat ist erforderlich.";
      }
      for (const [index, zutat] of ingredients.entries()) {
        if (!zutat.rohstoff) {
          return `Zutat ${index + 1}: Rohstoff auswählen.`;
        }
        if (!zutat.menge.trim() || Number(zutat.menge) < 0) {
          return `Zutat ${index + 1}: gültige Menge eingeben.`;
        }
      }
    }
    if (stepIndex === 2) {
      if (steps.length === 0) {
        return "Mindestens ein Prozessschritt ist erforderlich.";
      }
      for (const [index, schritt] of steps.entries()) {
        if (!schritt.name.trim()) {
          return `Schritt ${index + 1}: Name ist erforderlich.`;
        }
      }
    }
    return null;
  }

  function validateCurrentStep(): string | null {
    return validateStep(activeStep);
  }

  function goNext() {
    const validation = validateCurrentStep();
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    setActiveStep((current) => Math.min(current + 1, stepTitles.length - 1));
  }

  function goBack() {
    setError(null);
    setActiveStep((current) => Math.max(current - 1, 0));
  }

  function createRecipe() {
    for (let stepIndex = 0; stepIndex < stepTitles.length - 1; stepIndex += 1) {
      const validation = validateStep(stepIndex);
      if (validation) {
        setActiveStep(stepIndex);
        setError(validation);
        return;
      }
    }

    const now = new Date().toISOString();
    const recipeId = -Date.now();
    const versionId = recipeId - 1;
    const recipe: Rezept = {
      id: recipeId,
      name: name.trim(),
      beschreibung: beschreibung.trim() || null,
      erstellt_am: now,
      archiviert: false,
    };
    const version: Rezeptversion = {
      id: versionId,
      rezept_id: recipeId,
      versionsnummer: 1,
      name_snapshot: name.trim(),
      beschreibung_snapshot: beschreibung.trim() || null,
      erstellt_am: now,
      freigegeben_am: null,
      status: "ENTWURF",
      ziel_ausschlagmenge_l: optionalNumber(targets.ausschlagmenge),
      ziel_stammwuerze_plato: optionalNumber(targets.stammwuerze),
      ziel_abv_prozent: optionalNumber(targets.abv),
      ziel_ibu: optionalNumber(targets.ibu),
      ziel_ebc: optionalNumber(targets.ebc),
      infos: targets.infos.trim() || recipeInfos.trim() || null,
    };
    onCreated(recipe, version);
    setError(null);
    setSubmitted(true);
  }

  return (
    <>
      <Button type="button" onClick={openWizard}>
        <FilePlus2 />
        Neues Rezept
      </Button>

      <DemoDialogShell
        open={open}
        wide
        title={`Neues Rezept · ${stepTitles[activeStep]}`}
        description="Mehrstufiger Demo-Assistent für Rezeptstammdaten, Prozessschritte, Zutaten und Zielwerte."
        onClose={() => setOpen(false)}
      >
        {submitted ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Demo-Rezept „{name}“ angelegt.</p>
                <p className="mt-1 opacity-80">
                  {steps.length} Schritte, {ingredients.length} Zutaten und die Zielwerte wurden
                  lokal übernommen. Es wurde nichts an Supabase gesendet.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Schließen
              </Button>
              <Button type="button" onClick={reset}>
                Weiteres Rezept
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ol className="mb-8 flex flex-wrap gap-2 text-xs">
              {stepTitles.map((title, index) => (
                <li key={title}>
                  <button
                    type="button"
                    aria-current={index === activeStep ? "step" : undefined}
                    onClick={() => {
                      setError(null);
                      setActiveStep(index);
                    }}
                    className={
                      index === activeStep
                        ? "cursor-pointer rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground"
                        : index < activeStep
                          ? "cursor-pointer rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 transition-colors hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
                          : "cursor-pointer rounded-full bg-muted px-3 py-1 text-muted-foreground transition-colors hover:bg-muted/70"
                    }
                  >
                    {index + 1}. {title}
                  </button>
                </li>
              ))}
            </ol>

            {activeStep === 0 ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="wizard-name">Rezeptname</Label>
                  <Input
                    id="wizard-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="z. B. Sommer-Pils"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wizard-beschreibung">Kurzbeschreibung</Label>
                  <Input
                    id="wizard-beschreibung"
                    value={beschreibung}
                    onChange={(event) => setBeschreibung(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="wizard-infos">Interne Informationen</Label>
                  <textarea
                    id="wizard-infos"
                    className={textareaClass}
                    value={recipeInfos}
                    onChange={(event) => setRecipeInfos(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
            ) : null}

            {activeStep === 1 ? (
              <div className="space-y-3">
                {ingredients.map((zutat, index) => (
                  <div key={zutat.key} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Zutat {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setIngredients((current) => current.filter((_, i) => i !== index))
                        }
                        disabled={ingredients.length === 1}
                      >
                        <Trash2 />
                        Entfernen
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={`ingredient-rohstoff-${index}`}>Rohstoff</Label>
                        <Select
                          value={zutat.rohstoff || undefined}
                          onValueChange={(value) =>
                            setIngredients((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, rohstoff: value } : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`ingredient-rohstoff-${index}`} className="w-full">
                            <SelectValue placeholder="Rohstoff wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {rohstoffe
                              .filter((rohstoff) => !rohstoff.archiviert)
                              .map((rohstoff) => (
                                <SelectItem key={rohstoff.id} value={String(rohstoff.id)}>
                                  {rohstoff.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`ingredient-menge-${index}`}>Menge</Label>
                        <Input
                          id={`ingredient-menge-${index}`}
                          type="number"
                          min={0}
                          step="0.0001"
                          value={zutat.menge}
                          onChange={(event) =>
                            setIngredients((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, menge: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`ingredient-einheit-${index}`}>Einheit</Label>
                        <Select
                          value={zutat.einheit}
                          onValueChange={(value) =>
                            setIngredients((current) =>
                              current.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      einheit: value as WizardIngredient["einheit"],
                                    }
                                  : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`ingredient-einheit-${index}`} className="w-full">
                            <SelectValue placeholder="Einheit wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(basiseinheitLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={`ingredient-schritt-${index}`}>Prozessschritt</Label>
                        <Select
                          value={zutat.schritt}
                          onValueChange={(value) =>
                            setIngredients((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, schritt: value } : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`ingredient-schritt-${index}`} className="w-full">
                            <SelectValue placeholder="Kein Schritt" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kein-schritt">Kein Schritt</SelectItem>
                            {steps.map((schritt, stepIndex) => (
                              <SelectItem
                                key={`${schritt.key}-ingredient-option`}
                                value={String(stepIndex)}
                              >
                                P{schritt.position || stepIndex + 1} {schritt.name || "Schritt"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`ingredient-alpha-${index}`}>Alpha-Säure (%)</Label>
                        <Input
                          id={`ingredient-alpha-${index}`}
                          type="number"
                          min={0}
                          step="0.1"
                          value={zutat.alpha}
                          onChange={(event) =>
                            setIngredients((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, alpha: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`ingredient-ebc-${index}`}>EBC</Label>
                        <Input
                          id={`ingredient-ebc-${index}`}
                          type="number"
                          min={0}
                          step="0.1"
                          value={zutat.ebc}
                          onChange={(event) =>
                            setIngredients((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, ebc: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`ingredient-zugabe-${index}`}>
                          Zugabe nach Schrittstart (Min.)
                        </Label>
                        <Input
                          id={`ingredient-zugabe-${index}`}
                          type="number"
                          min={0}
                          step="0.1"
                          value={zutat.zugabe}
                          onChange={(event) =>
                            setIngredients((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, zugabe: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={`ingredient-notizen-${index}`}>Notizen</Label>
                        <textarea
                          id={`ingredient-notizen-${index}`}
                          className={textareaClass}
                          value={zutat.notizen}
                          onChange={(event) =>
                            setIngredients((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, notizen: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIngredients((current) => [...current, emptyIngredient()])}
                >
                  <Plus />
                  Zutat hinzufügen
                </Button>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="space-y-3">
                {steps.map((schritt, index) => (
                  <div key={schritt.key} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">Schritt {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSteps((current) => current.filter((_, i) => i !== index))}
                        disabled={steps.length === 1}
                      >
                        <Trash2 />
                        Entfernen
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor={`step-position-${index}`}>Position</Label>
                        <Input
                          id={`step-position-${index}`}
                          type="number"
                          min={1}
                          value={schritt.position}
                          onChange={(event) =>
                            setSteps((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, position: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`step-typ-${index}`}>Typ</Label>
                        <Select
                          value={schritt.typ}
                          onValueChange={(value) =>
                            setSteps((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, typ: value as WizardStep["typ"] } : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`step-typ-${index}`} className="w-full">
                            <SelectValue placeholder="Typ wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(prozessschrittTypLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={`step-name-${index}`}>Name</Label>
                        <Input
                          id={`step-name-${index}`}
                          value={schritt.name}
                          onChange={(event) =>
                            setSteps((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, name: event.target.value } : item,
                              ),
                            )
                          }
                          placeholder="z. B. Läuterrast"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`step-temperatur-${index}`}>Temperatur (°C)</Label>
                        <Input
                          id={`step-temperatur-${index}`}
                          type="number"
                          step="0.1"
                          value={schritt.temperatur}
                          onChange={(event) =>
                            setSteps((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, temperatur: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`step-dauer-${index}`}>Dauer (Min.)</Label>
                        <Input
                          id={`step-dauer-${index}`}
                          type="number"
                          min={0}
                          step="0.1"
                          value={schritt.dauer}
                          onChange={(event) =>
                            setSteps((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, dauer: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`step-wasser-${index}`}>Wassermenge (L)</Label>
                        <Input
                          id={`step-wasser-${index}`}
                          type="number"
                          min={0}
                          step="0.1"
                          value={schritt.wasser}
                          onChange={(event) =>
                            setSteps((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, wasser: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor={`step-anweisung-${index}`}>Anweisung</Label>
                        <textarea
                          id={`step-anweisung-${index}`}
                          className={textareaClass}
                          value={schritt.anweisung}
                          onChange={(event) =>
                            setSteps((current) =>
                              current.map((item, i) =>
                                i === index ? { ...item, anweisung: event.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSteps((current) => [...current, emptyStep(current.length + 1)])}
                >
                  <Plus />
                  Schritt hinzufügen
                </Button>
              </div>
            ) : null}

            {activeStep === 3 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="target-ausschlag">Ausschlagmenge (L)</Label>
                  <Input
                    id="target-ausschlag"
                    type="number"
                    min={0}
                    step="0.1"
                    value={targets.ausschlagmenge}
                    onChange={(event) =>
                      setTargets((current) => ({ ...current, ausschlagmenge: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target-stammwuerze">Stammwürze (°P)</Label>
                  <Input
                    id="target-stammwuerze"
                    type="number"
                    min={0}
                    step="0.1"
                    value={targets.stammwuerze}
                    onChange={(event) =>
                      setTargets((current) => ({ ...current, stammwuerze: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target-abv">ABV (% vol)</Label>
                  <Input
                    id="target-abv"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={targets.abv}
                    onChange={(event) =>
                      setTargets((current) => ({ ...current, abv: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target-ibu">IBU</Label>
                  <Input
                    id="target-ibu"
                    type="number"
                    min={0}
                    step="0.1"
                    value={targets.ibu}
                    onChange={(event) =>
                      setTargets((current) => ({ ...current, ibu: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="target-ebc">EBC</Label>
                  <Input
                    id="target-ebc"
                    type="number"
                    min={0}
                    step="0.1"
                    value={targets.ebc}
                    onChange={(event) =>
                      setTargets((current) => ({ ...current, ebc: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="target-infos">Informationen</Label>
                  <textarea
                    id="target-infos"
                    className={textareaClass}
                    value={targets.infos}
                    onChange={(event) =>
                      setTargets((current) => ({ ...current, infos: event.target.value }))
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>
            ) : null}

            {activeStep === 4 ? (
              <div className="space-y-4 text-sm">
                <div className="rounded-lg border p-4">
                  <p className="font-medium">{name || "Ohne Namen"}</p>
                  <p className="text-muted-foreground">{beschreibung || "Keine Beschreibung"}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">{ingredients.length} Zutaten</p>
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      {ingredients.map((zutat) => {
                        const rohstoff = rohstoffe.find(
                          (item) => String(item.id) === zutat.rohstoff,
                        );
                        return (
                          <li key={zutat.key}>
                            {rohstoff?.name ?? "Unbekannt"}: {zutat.menge || "—"}{" "}
                            {basiseinheitLabels[zutat.einheit]}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="font-medium">{steps.length} Schritte</p>
                    <ul className="mt-1 list-inside list-disc text-muted-foreground">
                      {steps.map((schritt) => (
                        <li key={schritt.key}>
                          P{schritt.position} {schritt.name || "Unbenannt"}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Ausschlag: {targets.ausschlagmenge || "—"} L</span>
                  <span>Stammwürze: {targets.stammwuerze || "—"} °P</span>
                  <span>ABV: {targets.abv || "—"} %</span>
                  <span>IBU: {targets.ibu || "—"}</span>
                  <span>EBC: {targets.ebc || "—"}</span>
                </div>
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Abbrechen
              </Button>
              <Button type="button" variant="outline" onClick={goBack} disabled={activeStep === 0}>
                Zurück
              </Button>
              {activeStep < stepTitles.length - 1 ? (
                <Button type="button" onClick={goNext}>
                  Weiter
                </Button>
              ) : (
                <Button type="button" onClick={createRecipe}>
                  Rezept anlegen
                </Button>
              )}
            </div>
          </div>
        )}
      </DemoDialogShell>
    </>
  );
}
