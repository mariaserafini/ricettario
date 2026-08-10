


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."calendario_pianificazione" (
    "pk_cal" integer NOT NULL,
    "fk_ricetta" integer,
    "data_pianificata" "date" NOT NULL,
    "nota" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."calendario_pianificazione" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."calendario_pianificazione_pk_cal_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."calendario_pianificazione_pk_cal_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."calendario_pianificazione_pk_cal_seq" OWNED BY "public"."calendario_pianificazione"."pk_cal";



CREATE TABLE IF NOT EXISTS "public"."categorie" (
    "pk_cat" integer NOT NULL,
    "ordine" integer DEFAULT 0 NOT NULL,
    "ordine_query" integer DEFAULT 0 NOT NULL,
    "categoria" "text" NOT NULL,
    "sottocategoria" "text"
);


ALTER TABLE "public"."categorie" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categorie_pkCat_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."categorie_pkCat_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."categorie_pkCat_seq" OWNED BY "public"."categorie"."pk_cat";



CREATE TABLE IF NOT EXISTS "public"."commenti" (
    "pk_commento" integer NOT NULL,
    "fk_ricetta" integer NOT NULL,
    "data_commento" "date" NOT NULL,
    "contenuto" "text" NOT NULL,
    "autore" "text" NOT NULL
);


ALTER TABLE "public"."commenti" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."commenti_pkCommento_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."commenti_pkCommento_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."commenti_pkCommento_seq" OWNED BY "public"."commenti"."pk_commento";



CREATE TABLE IF NOT EXISTS "public"."ingredienti" (
    "pk_ingrediente" integer NOT NULL,
    "ingrediente" "text" NOT NULL
);


ALTER TABLE "public"."ingredienti" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredienti_ricette" (
    "pk_row" integer NOT NULL,
    "fk_ricetta" integer NOT NULL,
    "fk_ingrediente" integer NOT NULL,
    "quant" numeric(5,1) DEFAULT NULL::numeric,
    "fk_misura" integer,
    "dettagli" "text"
);


ALTER TABLE "public"."ingredienti_ricette" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ingredienti_non_usati" WITH ("security_invoker"='on') AS
 SELECT "pk_ingrediente",
    "ingrediente"
   FROM "public"."ingredienti" "i"
  WHERE (NOT (EXISTS ( SELECT 1
           FROM "public"."ingredienti_ricette" "ir"
          WHERE ("ir"."fk_ingrediente" = "i"."pk_ingrediente"))));


ALTER VIEW "public"."ingredienti_non_usati" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ingredienti_pk_ingrediente_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ingredienti_pk_ingrediente_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ingredienti_pk_ingrediente_seq" OWNED BY "public"."ingredienti"."pk_ingrediente";



CREATE SEQUENCE IF NOT EXISTS "public"."ingredienti_ricette_pk_row_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ingredienti_ricette_pk_row_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ingredienti_ricette_pk_row_seq" OWNED BY "public"."ingredienti_ricette"."pk_row";



CREATE TABLE IF NOT EXISTS "public"."link_ricette" (
    "pk_linkr" integer NOT NULL,
    "fk_ric1" integer NOT NULL,
    "fk_ric2" integer NOT NULL,
    "doppio" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."link_ricette" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."link_ricette_pk_linkr_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."link_ricette_pk_linkr_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."link_ricette_pk_linkr_seq" OWNED BY "public"."link_ricette"."pk_linkr";



CREATE TABLE IF NOT EXISTS "public"."lista_spesa" (
    "id" integer NOT NULL,
    "fkprodotto" integer NOT NULL,
    "datacreazione" timestamp with time zone DEFAULT "now"(),
    "variante" "text"
);


ALTER TABLE "public"."lista_spesa" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."lista_spesa_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lista_spesa_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lista_spesa_id_seq" OWNED BY "public"."lista_spesa"."id";



CREATE TABLE IF NOT EXISTS "public"."misure" (
    "pk_misura" integer NOT NULL,
    "misura" "text" NOT NULL
);


ALTER TABLE "public"."misure" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."misure_pk_misura_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."misure_pk_misura_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."misure_pk_misura_seq" OWNED BY "public"."misure"."pk_misura";



CREATE TABLE IF NOT EXISTS "public"."negozi" (
    "id" integer NOT NULL,
    "nome" "text" NOT NULL,
    "filiale" "text",
    "datacreazione" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."negozi" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."negozi_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."negozi_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."negozi_id_seq" OWNED BY "public"."negozi"."id";



CREATE TABLE IF NOT EXISTS "public"."prezzi" (
    "id" integer NOT NULL,
    "fkprodotto" integer NOT NULL,
    "fknegozio" integer NOT NULL,
    "variante" "text",
    "prezzo" real NOT NULL,
    "quantita" real NOT NULL,
    "unita" "text" NOT NULL,
    "prezzounita" real NOT NULL,
    "promozione" boolean DEFAULT false,
    "datarilevazione" "date" DEFAULT CURRENT_DATE NOT NULL,
    "note" "text",
    "datacreazione" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prezzi" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."prezzi_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."prezzi_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."prezzi_id_seq" OWNED BY "public"."prezzi"."id";



CREATE TABLE IF NOT EXISTS "public"."prodotti" (
    "id" integer NOT NULL,
    "nome" "text" NOT NULL,
    "categoria" "text",
    "unita" "text" NOT NULL,
    "datacreazione" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prodotti" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."prodotti_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."prodotti_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."prodotti_id_seq" OWNED BY "public"."prodotti"."id";



CREATE TABLE IF NOT EXISTS "public"."ricette" (
    "pk_ricetta" integer NOT NULL,
    "titolo" "text" NOT NULL,
    "stampata" boolean DEFAULT false NOT NULL,
    "porzioni" "text",
    "n_porzioni" numeric(10,1) DEFAULT NULL::numeric,
    "tempo_preparazione" interval,
    "tempo_cottura" interval,
    "tempo_agg" interval,
    "fk_cat" integer,
    "etnica" "text",
    "data" "date" DEFAULT "now"() NOT NULL,
    "immagine" "text",
    "esecuzione" "text" NOT NULL,
    "diff" integer,
    "commenti" boolean DEFAULT false NOT NULL,
    "cottura" "text",
    "autore" "text" NOT NULL,
    "voto" integer,
    "nascosta" boolean DEFAULT false NOT NULL,
    "preferita" boolean DEFAULT false NOT NULL,
    CONSTRAINT "check_voto" CHECK ((("voto" >= 0) AND ("voto" <= 5)))
);


ALTER TABLE "public"."ricette" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."ricette_pkRicetta_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."ricette_pkRicetta_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."ricette_pkRicetta_seq" OWNED BY "public"."ricette"."pk_ricetta";



ALTER TABLE ONLY "public"."calendario_pianificazione" ALTER COLUMN "pk_cal" SET DEFAULT "nextval"('"public"."calendario_pianificazione_pk_cal_seq"'::"regclass");



ALTER TABLE ONLY "public"."categorie" ALTER COLUMN "pk_cat" SET DEFAULT "nextval"('"public"."categorie_pkCat_seq"'::"regclass");



ALTER TABLE ONLY "public"."commenti" ALTER COLUMN "pk_commento" SET DEFAULT "nextval"('"public"."commenti_pkCommento_seq"'::"regclass");



ALTER TABLE ONLY "public"."ingredienti" ALTER COLUMN "pk_ingrediente" SET DEFAULT "nextval"('"public"."ingredienti_pk_ingrediente_seq"'::"regclass");



ALTER TABLE ONLY "public"."ingredienti_ricette" ALTER COLUMN "pk_row" SET DEFAULT "nextval"('"public"."ingredienti_ricette_pk_row_seq"'::"regclass");



ALTER TABLE ONLY "public"."link_ricette" ALTER COLUMN "pk_linkr" SET DEFAULT "nextval"('"public"."link_ricette_pk_linkr_seq"'::"regclass");



ALTER TABLE ONLY "public"."lista_spesa" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lista_spesa_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."misure" ALTER COLUMN "pk_misura" SET DEFAULT "nextval"('"public"."misure_pk_misura_seq"'::"regclass");



ALTER TABLE ONLY "public"."negozi" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."negozi_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."prezzi" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."prezzi_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."prodotti" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."prodotti_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."ricette" ALTER COLUMN "pk_ricetta" SET DEFAULT "nextval"('"public"."ricette_pkRicetta_seq"'::"regclass");



ALTER TABLE ONLY "public"."calendario_pianificazione"
    ADD CONSTRAINT "calendario_pianificazione_pkey" PRIMARY KEY ("pk_cal");



ALTER TABLE ONLY "public"."categorie"
    ADD CONSTRAINT "categorie_pkey" PRIMARY KEY ("pk_cat");



ALTER TABLE ONLY "public"."commenti"
    ADD CONSTRAINT "commenti_pkey" PRIMARY KEY ("pk_commento");



ALTER TABLE ONLY "public"."ingredienti"
    ADD CONSTRAINT "ingredienti_pkey" PRIMARY KEY ("pk_ingrediente");



ALTER TABLE ONLY "public"."ingredienti_ricette"
    ADD CONSTRAINT "ingredienti_ricette_pkey" PRIMARY KEY ("pk_row");



ALTER TABLE ONLY "public"."link_ricette"
    ADD CONSTRAINT "link_ricette_pkey" PRIMARY KEY ("pk_linkr");



ALTER TABLE ONLY "public"."lista_spesa"
    ADD CONSTRAINT "lista_spesa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."misure"
    ADD CONSTRAINT "misure_pkey" PRIMARY KEY ("pk_misura");



ALTER TABLE ONLY "public"."negozi"
    ADD CONSTRAINT "negozi_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prezzi"
    ADD CONSTRAINT "prezzi_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prodotti"
    ADD CONSTRAINT "prodotti_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ingredienti_ricette"
    ADD CONSTRAINT "ricetta_ingrediente_unico" UNIQUE ("fk_ricetta", "fk_ingrediente");



ALTER TABLE ONLY "public"."ricette"
    ADD CONSTRAINT "ricette_pkey" PRIMARY KEY ("pk_ricetta");



CREATE INDEX "idx_lista_spesa_prodotto" ON "public"."lista_spesa" USING "btree" ("fkprodotto");



CREATE INDEX "idx_prezzi_data" ON "public"."prezzi" USING "btree" ("datarilevazione" DESC);



CREATE INDEX "idx_prezzi_negozio" ON "public"."prezzi" USING "btree" ("fknegozio");



CREATE INDEX "idx_prezzi_prodotto" ON "public"."prezzi" USING "btree" ("fkprodotto");



CREATE INDEX "idx_prodotti_nome" ON "public"."prodotti" USING "gin" ("to_tsvector"('"italian"'::"regconfig", "nome"));



ALTER TABLE ONLY "public"."calendario_pianificazione"
    ADD CONSTRAINT "calendario_pianificazione_fk_ricetta_fkey" FOREIGN KEY ("fk_ricetta") REFERENCES "public"."ricette"("pk_ricetta") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commenti"
    ADD CONSTRAINT "commenti_fkRicetta_fkey" FOREIGN KEY ("fk_ricetta") REFERENCES "public"."ricette"("pk_ricetta") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ingredienti_ricette"
    ADD CONSTRAINT "ingredienti_ricette_fkIngrediente_fkey" FOREIGN KEY ("fk_ingrediente") REFERENCES "public"."ingredienti"("pk_ingrediente") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ingredienti_ricette"
    ADD CONSTRAINT "ingredienti_ricette_fkMisura_fkey" FOREIGN KEY ("fk_misura") REFERENCES "public"."misure"("pk_misura") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ingredienti_ricette"
    ADD CONSTRAINT "ingredienti_ricette_fkRicetta_fkey" FOREIGN KEY ("fk_ricetta") REFERENCES "public"."ricette"("pk_ricetta") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_ricette"
    ADD CONSTRAINT "link_ricette_fkric1_fkey" FOREIGN KEY ("fk_ric1") REFERENCES "public"."ricette"("pk_ricetta") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."link_ricette"
    ADD CONSTRAINT "link_ricette_fkric2_fkey" FOREIGN KEY ("fk_ric2") REFERENCES "public"."ricette"("pk_ricetta") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lista_spesa"
    ADD CONSTRAINT "lista_spesa_fkprodotto_fkey" FOREIGN KEY ("fkprodotto") REFERENCES "public"."prodotti"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prezzi"
    ADD CONSTRAINT "prezzi_fknegozio_fkey" FOREIGN KEY ("fknegozio") REFERENCES "public"."negozi"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prezzi"
    ADD CONSTRAINT "prezzi_fkprodotto_fkey" FOREIGN KEY ("fkprodotto") REFERENCES "public"."prodotti"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ricette"
    ADD CONSTRAINT "ricette_fkCat_fkey" FOREIGN KEY ("fk_cat") REFERENCES "public"."categorie"("pk_cat") ON UPDATE CASCADE ON DELETE SET NULL;



CREATE POLICY "Authenticated users" ON "public"."lista_spesa" TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."categorie" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."commenti" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."ingredienti" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."ingredienti_ricette" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."link_ricette" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."misure" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."ricette" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "aggiornamento stampata" ON "public"."ricette" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_all" ON "public"."negozi" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_all" ON "public"."prezzi" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "auth_all" ON "public"."prodotti" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."calendario_pianificazione" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cancIngr" ON "public"."ingredienti_ricette" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "cancIngred" ON "public"."ingredienti" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "cancLink" ON "public"."link_ricette" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "cancRic" ON "public"."ricette" FOR DELETE TO "authenticated" USING (true);



ALTER TABLE "public"."categorie" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commenti" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingredienti" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingredienti_ricette" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insIngr" ON "public"."ingredienti" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "insLink" ON "public"."link_ricette" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "insRic" ON "public"."ricette" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "inserimentoCommenti" ON "public"."commenti" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "inserimentoIngr" ON "public"."ingredienti_ricette" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."link_ricette" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lista_spesa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."misure" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."negozi" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prezzi" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prodotti" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ricette" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tabellaCal" ON "public"."calendario_pianificazione" TO "authenticated" USING (true);



CREATE POLICY "updateIngr" ON "public"."ingredienti_ricette" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "updateIngred" ON "public"."ingredienti" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "updateLink" ON "public"."link_ricette" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."calendario_pianificazione" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."categorie" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."commenti" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."ingredienti" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."ingredienti_ricette" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."link_ricette" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."lista_spesa" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."misure" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."prezzi" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."prodotti" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read" ON "public"."ricette" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users can read " ON "public"."negozi" FOR SELECT TO "authenticated" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."calendario_pianificazione" TO "anon";
GRANT ALL ON TABLE "public"."calendario_pianificazione" TO "authenticated";
GRANT ALL ON TABLE "public"."calendario_pianificazione" TO "service_role";



GRANT ALL ON SEQUENCE "public"."calendario_pianificazione_pk_cal_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."calendario_pianificazione_pk_cal_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."calendario_pianificazione_pk_cal_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categorie" TO "anon";
GRANT ALL ON TABLE "public"."categorie" TO "authenticated";
GRANT ALL ON TABLE "public"."categorie" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categorie_pkCat_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categorie_pkCat_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categorie_pkCat_seq" TO "service_role";



GRANT ALL ON TABLE "public"."commenti" TO "anon";
GRANT ALL ON TABLE "public"."commenti" TO "authenticated";
GRANT ALL ON TABLE "public"."commenti" TO "service_role";



GRANT ALL ON SEQUENCE "public"."commenti_pkCommento_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."commenti_pkCommento_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."commenti_pkCommento_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ingredienti" TO "anon";
GRANT ALL ON TABLE "public"."ingredienti" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredienti" TO "service_role";



GRANT ALL ON TABLE "public"."ingredienti_ricette" TO "anon";
GRANT ALL ON TABLE "public"."ingredienti_ricette" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredienti_ricette" TO "service_role";



GRANT ALL ON TABLE "public"."ingredienti_non_usati" TO "anon";
GRANT ALL ON TABLE "public"."ingredienti_non_usati" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredienti_non_usati" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ingredienti_pk_ingrediente_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ingredienti_pk_ingrediente_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ingredienti_pk_ingrediente_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ingredienti_ricette_pk_row_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ingredienti_ricette_pk_row_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ingredienti_ricette_pk_row_seq" TO "service_role";



GRANT ALL ON TABLE "public"."link_ricette" TO "anon";
GRANT ALL ON TABLE "public"."link_ricette" TO "authenticated";
GRANT ALL ON TABLE "public"."link_ricette" TO "service_role";



GRANT ALL ON SEQUENCE "public"."link_ricette_pk_linkr_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."link_ricette_pk_linkr_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."link_ricette_pk_linkr_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lista_spesa" TO "anon";
GRANT ALL ON TABLE "public"."lista_spesa" TO "authenticated";
GRANT ALL ON TABLE "public"."lista_spesa" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lista_spesa_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lista_spesa_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lista_spesa_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."misure" TO "anon";
GRANT ALL ON TABLE "public"."misure" TO "authenticated";
GRANT ALL ON TABLE "public"."misure" TO "service_role";



GRANT ALL ON SEQUENCE "public"."misure_pk_misura_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."misure_pk_misura_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."misure_pk_misura_seq" TO "service_role";



GRANT ALL ON TABLE "public"."negozi" TO "anon";
GRANT ALL ON TABLE "public"."negozi" TO "authenticated";
GRANT ALL ON TABLE "public"."negozi" TO "service_role";



GRANT ALL ON SEQUENCE "public"."negozi_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."negozi_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."negozi_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."prezzi" TO "anon";
GRANT ALL ON TABLE "public"."prezzi" TO "authenticated";
GRANT ALL ON TABLE "public"."prezzi" TO "service_role";



GRANT ALL ON SEQUENCE "public"."prezzi_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."prezzi_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."prezzi_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."prodotti" TO "anon";
GRANT ALL ON TABLE "public"."prodotti" TO "authenticated";
GRANT ALL ON TABLE "public"."prodotti" TO "service_role";



GRANT ALL ON SEQUENCE "public"."prodotti_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."prodotti_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."prodotti_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."ricette" TO "anon";
GRANT ALL ON TABLE "public"."ricette" TO "authenticated";
GRANT ALL ON TABLE "public"."ricette" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ricette_pkRicetta_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."ricette_pkRicetta_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ricette_pkRicetta_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































