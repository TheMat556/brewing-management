export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      tb_berechtigter_benutzer: {
        Row: {
          benutzer_id: string;
          erstellt_am: string;
        };
        ComputedFields: never;
        Insert: {
          benutzer_id: string;
          erstellt_am?: string;
        };
        Update: {
          benutzer_id?: string;
          erstellt_am?: string;
        };
        Relationships: [];
      };
      tb_geraet: {
        Row: {
          archiviert: boolean;
          id: number;
          lob_faehig: boolean;
          lob_menge_l: number | null;
          menge: number;
          name: string;
          notizen: string | null;
        };
        ComputedFields: never;
        Insert: {
          archiviert?: boolean;
          id?: never;
          lob_faehig?: boolean;
          lob_menge_l?: number | null;
          menge: number;
          name: string;
          notizen?: string | null;
        };
        Update: {
          archiviert?: boolean;
          id?: never;
          lob_faehig?: boolean;
          lob_menge_l?: number | null;
          menge?: number;
          name?: string;
          notizen?: string | null;
        };
        Relationships: [];
      };
      tb_idempotenz: {
        Row: {
          erstellt_am: string;
          id: number;
          lagerbewegung_id: number | null;
          operation: string;
          schluessel: string;
        };
        ComputedFields: never;
        Insert: {
          erstellt_am?: string;
          id?: never;
          lagerbewegung_id?: number | null;
          operation: string;
          schluessel: string;
        };
        Update: {
          erstellt_am?: string;
          id?: never;
          lagerbewegung_id?: number | null;
          operation?: string;
          schluessel?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tb_idempotenz_lagerbewegung_id_fkey";
            columns: ["lagerbewegung_id"];
            isOneToOne: false;
            referencedRelation: "tb_lagerbewegung";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_lagerbewegung: {
        Row: {
          id: number;
          lagercharge_id: number;
          mengen_delta: number;
          notizen: string | null;
          sudzutat_id: number | null;
          typ: Database["public"]["Enums"]["lagerbewegung_typ"];
          zeitpunkt: string;
        };
        ComputedFields: never;
        Insert: {
          id?: never;
          lagercharge_id: number;
          mengen_delta: number;
          notizen?: string | null;
          sudzutat_id?: number | null;
          typ: Database["public"]["Enums"]["lagerbewegung_typ"];
          zeitpunkt?: string;
        };
        Update: {
          id?: never;
          lagercharge_id?: number;
          mengen_delta?: number;
          notizen?: string | null;
          sudzutat_id?: number | null;
          typ?: Database["public"]["Enums"]["lagerbewegung_typ"];
          zeitpunkt?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tb_lagerbewegung_lagercharge_id_fkey";
            columns: ["lagercharge_id"];
            isOneToOne: false;
            referencedRelation: "tb_lagercharge";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tb_lagerbewegung_sudzutat_id_fkey";
            columns: ["sudzutat_id"];
            isOneToOne: false;
            referencedRelation: "tb_sudzutat";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_lagercharge: {
        Row: {
          alphasaeure_prozent: number | null;
          ebc: number | null;
          id: number;
          lieferanten_chargennummer: string | null;
          lieferdatum: string;
          mhd: string | null;
          notizen: string | null;
          rohstoff_id: number;
        };
        ComputedFields: never;
        Insert: {
          alphasaeure_prozent?: number | null;
          ebc?: number | null;
          id?: never;
          lieferanten_chargennummer?: string | null;
          lieferdatum: string;
          mhd?: string | null;
          notizen?: string | null;
          rohstoff_id: number;
        };
        Update: {
          alphasaeure_prozent?: number | null;
          ebc?: number | null;
          id?: never;
          lieferanten_chargennummer?: string | null;
          lieferdatum?: string;
          mhd?: string | null;
          notizen?: string | null;
          rohstoff_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tb_lagercharge_rohstoff_id_fkey";
            columns: ["rohstoff_id"];
            isOneToOne: false;
            referencedRelation: "tb_rohstoff";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_rezept: {
        Row: {
          archiviert: boolean;
          beschreibung: string | null;
          erstellt_am: string;
          id: number;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          archiviert?: boolean;
          beschreibung?: string | null;
          erstellt_am?: string;
          id?: never;
          name: string;
        };
        Update: {
          archiviert?: boolean;
          beschreibung?: string | null;
          erstellt_am?: string;
          id?: never;
          name?: string;
        };
        Relationships: [];
      };
      tb_rezeptschritt: {
        Row: {
          anweisung: string | null;
          dauer_min: number | null;
          id: number;
          name: string;
          position: number;
          rezeptversion_id: number;
          temperatur_c: number | null;
          typ: Database["public"]["Enums"]["prozessschritt_typ"];
          wassermenge_l: number | null;
        };
        ComputedFields: never;
        Insert: {
          anweisung?: string | null;
          dauer_min?: number | null;
          id?: never;
          name: string;
          position: number;
          rezeptversion_id: number;
          temperatur_c?: number | null;
          typ: Database["public"]["Enums"]["prozessschritt_typ"];
          wassermenge_l?: number | null;
        };
        Update: {
          anweisung?: string | null;
          dauer_min?: number | null;
          id?: never;
          name?: string;
          position?: number;
          rezeptversion_id?: number;
          temperatur_c?: number | null;
          typ?: Database["public"]["Enums"]["prozessschritt_typ"];
          wassermenge_l?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tb_rezeptschritt_rezeptversion_id_fkey";
            columns: ["rezeptversion_id"];
            isOneToOne: false;
            referencedRelation: "tb_rezeptversion";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_rezeptversion: {
        Row: {
          beschreibung_snapshot: string | null;
          erstellt_am: string;
          freigegeben_am: string | null;
          id: number;
          infos: string | null;
          name_snapshot: string;
          rezept_id: number;
          status: Database["public"]["Enums"]["rezeptversion_status"];
          versionsnummer: number;
          ziel_abv_prozent: number | null;
          ziel_ausschlagmenge_l: number | null;
          ziel_ebc: number | null;
          ziel_ibu: number | null;
          ziel_stammwuerze_plato: number | null;
        };
        ComputedFields: never;
        Insert: {
          beschreibung_snapshot?: string | null;
          erstellt_am?: string;
          freigegeben_am?: string | null;
          id?: never;
          infos?: string | null;
          name_snapshot: string;
          rezept_id: number;
          status?: Database["public"]["Enums"]["rezeptversion_status"];
          versionsnummer: number;
          ziel_abv_prozent?: number | null;
          ziel_ausschlagmenge_l?: number | null;
          ziel_ebc?: number | null;
          ziel_ibu?: number | null;
          ziel_stammwuerze_plato?: number | null;
        };
        Update: {
          beschreibung_snapshot?: string | null;
          erstellt_am?: string;
          freigegeben_am?: string | null;
          id?: never;
          infos?: string | null;
          name_snapshot?: string;
          rezept_id?: number;
          status?: Database["public"]["Enums"]["rezeptversion_status"];
          versionsnummer?: number;
          ziel_abv_prozent?: number | null;
          ziel_ausschlagmenge_l?: number | null;
          ziel_ebc?: number | null;
          ziel_ibu?: number | null;
          ziel_stammwuerze_plato?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tb_rezeptversion_rezept_id_fkey";
            columns: ["rezept_id"];
            isOneToOne: false;
            referencedRelation: "tb_rezept";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_rezeptzutat: {
        Row: {
          alphasaeure_prozent: number | null;
          ebc: number | null;
          einheit_snapshot: Database["public"]["Enums"]["basiseinheit"];
          id: number;
          menge: number;
          notizen: string | null;
          rezeptschritt_id: number | null;
          rezeptversion_id: number;
          rohstoff_id: number;
          rohstoffname_snapshot: string;
          zugabe_nach_min: number | null;
        };
        ComputedFields: never;
        Insert: {
          alphasaeure_prozent?: number | null;
          ebc?: number | null;
          einheit_snapshot: Database["public"]["Enums"]["basiseinheit"];
          id?: never;
          menge: number;
          notizen?: string | null;
          rezeptschritt_id?: number | null;
          rezeptversion_id: number;
          rohstoff_id: number;
          rohstoffname_snapshot: string;
          zugabe_nach_min?: number | null;
        };
        Update: {
          alphasaeure_prozent?: number | null;
          ebc?: number | null;
          einheit_snapshot?: Database["public"]["Enums"]["basiseinheit"];
          id?: never;
          menge?: number;
          notizen?: string | null;
          rezeptschritt_id?: number | null;
          rezeptversion_id?: number;
          rohstoff_id?: number;
          rohstoffname_snapshot?: string;
          zugabe_nach_min?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_tb_rezeptzutat_schritt";
            columns: ["rezeptschritt_id", "rezeptversion_id"];
            isOneToOne: false;
            referencedRelation: "tb_rezeptschritt";
            referencedColumns: ["id", "rezeptversion_id"];
          },
          {
            foreignKeyName: "tb_rezeptzutat_rezeptversion_id_fkey";
            columns: ["rezeptversion_id"];
            isOneToOne: false;
            referencedRelation: "tb_rezeptversion";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tb_rezeptzutat_rohstoff_id_fkey";
            columns: ["rohstoff_id"];
            isOneToOne: false;
            referencedRelation: "tb_rohstoff";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_rohstoff: {
        Row: {
          archiviert: boolean;
          basiseinheit: Database["public"]["Enums"]["basiseinheit"];
          id: number;
          kategorie: Database["public"]["Enums"]["rohstoff_kategorie"];
          name: string;
          notizen: string | null;
        };
        ComputedFields: never;
        Insert: {
          archiviert?: boolean;
          basiseinheit: Database["public"]["Enums"]["basiseinheit"];
          id?: never;
          kategorie: Database["public"]["Enums"]["rohstoff_kategorie"];
          name: string;
          notizen?: string | null;
        };
        Update: {
          archiviert?: boolean;
          basiseinheit?: Database["public"]["Enums"]["basiseinheit"];
          id?: never;
          kategorie?: Database["public"]["Enums"]["rohstoff_kategorie"];
          name?: string;
          notizen?: string | null;
        };
        Relationships: [];
      };
      tb_sud: {
        Row: {
          abgefuellte_menge_l: number | null;
          braudatum: string | null;
          erstellt_am: string;
          id: number;
          infos: string | null;
          ist_abv_prozent: number | null;
          ist_ausschlagmenge_l: number | null;
          ist_ebc: number | null;
          ist_ibu: number | null;
          ist_stammwuerze_plato: number | null;
          name: string;
          rezeptversion_id: number;
          status: Database["public"]["Enums"]["sud_status"];
          sudnummer: string;
          ziel_abv_prozent: number | null;
          ziel_ausschlagmenge_l: number | null;
          ziel_ebc: number | null;
          ziel_ibu: number | null;
          ziel_stammwuerze_plato: number | null;
        };
        ComputedFields: never;
        Insert: {
          abgefuellte_menge_l?: number | null;
          braudatum?: string | null;
          erstellt_am?: string;
          id?: never;
          infos?: string | null;
          ist_abv_prozent?: number | null;
          ist_ausschlagmenge_l?: number | null;
          ist_ebc?: number | null;
          ist_ibu?: number | null;
          ist_stammwuerze_plato?: number | null;
          name: string;
          rezeptversion_id: number;
          status?: Database["public"]["Enums"]["sud_status"];
          sudnummer: string;
          ziel_abv_prozent?: number | null;
          ziel_ausschlagmenge_l?: number | null;
          ziel_ebc?: number | null;
          ziel_ibu?: number | null;
          ziel_stammwuerze_plato?: number | null;
        };
        Update: {
          abgefuellte_menge_l?: number | null;
          braudatum?: string | null;
          erstellt_am?: string;
          id?: never;
          infos?: string | null;
          ist_abv_prozent?: number | null;
          ist_ausschlagmenge_l?: number | null;
          ist_ebc?: number | null;
          ist_ibu?: number | null;
          ist_stammwuerze_plato?: number | null;
          name?: string;
          rezeptversion_id?: number;
          status?: Database["public"]["Enums"]["sud_status"];
          sudnummer?: string;
          ziel_abv_prozent?: number | null;
          ziel_ausschlagmenge_l?: number | null;
          ziel_ebc?: number | null;
          ziel_ibu?: number | null;
          ziel_stammwuerze_plato?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tb_sud_rezeptversion_id_fkey";
            columns: ["rezeptversion_id"];
            isOneToOne: false;
            referencedRelation: "tb_rezeptversion";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_sudgeraet: {
        Row: {
          geraet_id: number;
          geraetename_snapshot: string;
          id: number;
          lob_genutzt: boolean;
          lob_menge_l_snapshot: number | null;
          notizen: string | null;
          sud_id: number;
          zugewiesene_menge: number;
        };
        ComputedFields: never;
        Insert: {
          geraet_id: number;
          geraetename_snapshot: string;
          id?: never;
          lob_genutzt?: boolean;
          lob_menge_l_snapshot?: number | null;
          notizen?: string | null;
          sud_id: number;
          zugewiesene_menge: number;
        };
        Update: {
          geraet_id?: number;
          geraetename_snapshot?: string;
          id?: never;
          lob_genutzt?: boolean;
          lob_menge_l_snapshot?: number | null;
          notizen?: string | null;
          sud_id?: number;
          zugewiesene_menge?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tb_sudgeraet_geraet_id_fkey";
            columns: ["geraet_id"];
            isOneToOne: false;
            referencedRelation: "tb_geraet";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tb_sudgeraet_sud_id_fkey";
            columns: ["sud_id"];
            isOneToOne: false;
            referencedRelation: "tb_sud";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_sudschritt: {
        Row: {
          anweisung: string | null;
          beendet_am: string | null;
          gestartet_am: string | null;
          id: number;
          ist_dauer_min: number | null;
          ist_temperatur_c: number | null;
          ist_wassermenge_l: number | null;
          name: string;
          notizen: string | null;
          position: number;
          sud_id: number;
          typ: Database["public"]["Enums"]["prozessschritt_typ"];
          ziel_dauer_min: number | null;
          ziel_temperatur_c: number | null;
          ziel_wassermenge_l: number | null;
        };
        ComputedFields: never;
        Insert: {
          anweisung?: string | null;
          beendet_am?: string | null;
          gestartet_am?: string | null;
          id?: never;
          ist_dauer_min?: number | null;
          ist_temperatur_c?: number | null;
          ist_wassermenge_l?: number | null;
          name: string;
          notizen?: string | null;
          position: number;
          sud_id: number;
          typ: Database["public"]["Enums"]["prozessschritt_typ"];
          ziel_dauer_min?: number | null;
          ziel_temperatur_c?: number | null;
          ziel_wassermenge_l?: number | null;
        };
        Update: {
          anweisung?: string | null;
          beendet_am?: string | null;
          gestartet_am?: string | null;
          id?: never;
          ist_dauer_min?: number | null;
          ist_temperatur_c?: number | null;
          ist_wassermenge_l?: number | null;
          name?: string;
          notizen?: string | null;
          position?: number;
          sud_id?: number;
          typ?: Database["public"]["Enums"]["prozessschritt_typ"];
          ziel_dauer_min?: number | null;
          ziel_temperatur_c?: number | null;
          ziel_wassermenge_l?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tb_sudschritt_sud_id_fkey";
            columns: ["sud_id"];
            isOneToOne: false;
            referencedRelation: "tb_sud";
            referencedColumns: ["id"];
          },
        ];
      };
      tb_sudzutat: {
        Row: {
          alphasaeure_prozent: number | null;
          ebc: number | null;
          einheit_snapshot: Database["public"]["Enums"]["basiseinheit"];
          geplante_menge: number;
          id: number;
          ist_menge: number | null;
          ist_zugabe_nach_min: number | null;
          notizen: string | null;
          rohstoff_id: number;
          rohstoffname_snapshot: string;
          sud_id: number;
          sudschritt_id: number | null;
          ziel_zugabe_nach_min: number | null;
        };
        ComputedFields: never;
        Insert: {
          alphasaeure_prozent?: number | null;
          ebc?: number | null;
          einheit_snapshot: Database["public"]["Enums"]["basiseinheit"];
          geplante_menge: number;
          id?: never;
          ist_menge?: number | null;
          ist_zugabe_nach_min?: number | null;
          notizen?: string | null;
          rohstoff_id: number;
          rohstoffname_snapshot: string;
          sud_id: number;
          sudschritt_id?: number | null;
          ziel_zugabe_nach_min?: number | null;
        };
        Update: {
          alphasaeure_prozent?: number | null;
          ebc?: number | null;
          einheit_snapshot?: Database["public"]["Enums"]["basiseinheit"];
          geplante_menge?: number;
          id?: never;
          ist_menge?: number | null;
          ist_zugabe_nach_min?: number | null;
          notizen?: string | null;
          rohstoff_id?: number;
          rohstoffname_snapshot?: string;
          sud_id?: number;
          sudschritt_id?: number | null;
          ziel_zugabe_nach_min?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_tb_sudzutat_schritt";
            columns: ["sudschritt_id", "sud_id"];
            isOneToOne: false;
            referencedRelation: "tb_sudschritt";
            referencedColumns: ["id", "sud_id"];
          },
          {
            foreignKeyName: "tb_sudzutat_rohstoff_id_fkey";
            columns: ["rohstoff_id"];
            isOneToOne: false;
            referencedRelation: "tb_rohstoff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tb_sudzutat_sud_id_fkey";
            columns: ["sud_id"];
            isOneToOne: false;
            referencedRelation: "tb_sud";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      assert_berechtigt: { Args: Record<PropertyKey, never>; Returns: undefined };
      ist_berechtigt: { Args: Record<PropertyKey, never>; Returns: boolean };
      lagerbewegung_erfassen: {
        Args: {
          p_idempotenzschluessel: string;
          p_lagercharge_id: number;
          p_mengen_delta: number;
          p_notizen?: string;
          p_sudzutat_id?: number;
          p_typ: Database["public"]["Enums"]["lagerbewegung_typ"];
          p_zeitpunkt?: string;
        };
        Returns: {
          id: number;
          lagercharge_id: number;
          mengen_delta: number;
          notizen: string | null;
          sudzutat_id: number | null;
          typ: Database["public"]["Enums"]["lagerbewegung_typ"];
          zeitpunkt: string;
        };
        SetofOptions: {
          from: "*";
          to: "tb_lagerbewegung";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      naechste_sudnummer: { Args: Record<PropertyKey, never>; Returns: string };
      rezept_erstellen: {
        Args: { p_beschreibung?: string; p_infos?: string; p_name: string };
        Returns: {
          rezept_id: number;
          rezeptversion_id: number;
        }[];
      };
      rezeptversion_erstellen: { Args: { p_rezept_id: number }; Returns: number };
      rezeptversion_freigeben: { Args: { p_id: number }; Returns: undefined };
      rezeptversion_loeschen: { Args: { p_id: number }; Returns: undefined };
      sud_aus_rezept_erstellen: {
        Args: {
          p_braudatum?: string;
          p_name: string;
          p_rezeptversion_id: number;
          p_sudnummer?: string;
        };
        Returns: number;
      };
      sudzutat_ersetzen: {
        Args: {
          p_alphasaeure_prozent?: number;
          p_ebc?: number;
          p_menge?: number;
          p_notizen?: string;
          p_rohstoff_id: number;
          p_sudzutat_id: number;
        };
        Returns: {
          alphasaeure_prozent: number | null;
          ebc: number | null;
          einheit_snapshot: Database["public"]["Enums"]["basiseinheit"];
          geplante_menge: number;
          id: number;
          ist_menge: number | null;
          ist_zugabe_nach_min: number | null;
          notizen: string | null;
          rohstoff_id: number;
          rohstoffname_snapshot: string;
          sud_id: number;
          sudschritt_id: number | null;
          ziel_zugabe_nach_min: number | null;
        };
        SetofOptions: {
          from: "*";
          to: "tb_sudzutat";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      sudzutat_ist_menge_setzen: {
        Args: { p_aus_lager?: boolean; p_ist_menge: number; p_sudzutat_id: number };
        Returns: {
          alphasaeure_prozent: number | null;
          ebc: number | null;
          einheit_snapshot: Database["public"]["Enums"]["basiseinheit"];
          geplante_menge: number;
          id: number;
          ist_menge: number | null;
          ist_zugabe_nach_min: number | null;
          notizen: string | null;
          rohstoff_id: number;
          rohstoffname_snapshot: string;
          sud_id: number;
          sudschritt_id: number | null;
          ziel_zugabe_nach_min: number | null;
        };
        SetofOptions: {
          from: "*";
          to: "tb_sudzutat";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      sudzutat_verbrauch_netto: { Args: { p_sudzutat_id: number }; Returns: number };
      zugang_beanspruchen: { Args: Record<PropertyKey, never>; Returns: string };
    };
    Enums: {
      basiseinheit: "g" | "ml" | "Stueck";
      lagerbewegung_typ: "ZUGANG" | "VERBRAUCH" | "KORREKTUR" | "ENTSORGUNG";
      prozessschritt_typ:
        | "EINMAISCHEN"
        | "RAST"
        | "NACHGUSS"
        | "KOCHEN"
        | "GAERUNG"
        | "KALTHOPFUNG"
        | "REIFUNG"
        | "ABFUELLUNG"
        | "SONSTIGES";
      rezeptversion_status: "ENTWURF" | "FREIGEGEBEN";
      rohstoff_kategorie: "MALZ" | "HOPFEN" | "HEFE" | "GEWUERZ" | "SONSTIGES";
      sud_status: "GEPLANT" | "IN_ARBEIT" | "ABGESCHLOSSEN" | "VERWORFEN";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      basiseinheit: ["g", "ml", "Stueck"],
      lagerbewegung_typ: ["ZUGANG", "VERBRAUCH", "KORREKTUR", "ENTSORGUNG"],
      prozessschritt_typ: [
        "EINMAISCHEN",
        "RAST",
        "NACHGUSS",
        "KOCHEN",
        "GAERUNG",
        "KALTHOPFUNG",
        "REIFUNG",
        "ABFUELLUNG",
        "SONSTIGES",
      ],
      rezeptversion_status: ["ENTWURF", "FREIGEGEBEN"],
      rohstoff_kategorie: ["MALZ", "HOPFEN", "HEFE", "GEWUERZ", "SONSTIGES"],
      sud_status: ["GEPLANT", "IN_ARBEIT", "ABGESCHLOSSEN", "VERWORFEN"],
    },
  },
} as const;
