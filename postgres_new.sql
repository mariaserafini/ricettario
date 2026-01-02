DROP TABLE IF EXISTS categorie;
CREATE TABLE categorie(
  pk_cat SERIAL PRIMARY KEY,
  ordine int NOT NULL DEFAULT 0,
  ordine_query int NOT NULL DEFAULT 0,
  categoria text NOT NULL,
  sottocategoria text
);