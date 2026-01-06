DROP TABLE IF EXISTS categorie;
create table public.categorie (
  pk_cat serial not null,
  ordine integer not null default 0,
  ordine_query integer not null default 0,
  categoria text not null,
  sottocategoria text null,
  constraint categorie_pkey primary key (pk_cat)
) TABLESPACE pg_default;

DROP TABLE IF EXISTS ingredienti;
create table public.ingredienti (
  pk_ingrediente serial not null,
  ingrediente text not null,
  constraint ingredienti_pkey primary key (pk_ingrediente)
) TABLESPACE pg_default;

DROP TABLE IF EXISTS misure;
create table public.misure (
  pk_misura serial not null,
  misura text not null,
  constraint misure_pkey primary key (pk_misura)
) TABLESPACE pg_default;

DROP TABLE IF EXISTS ricette;
create table public.ricette (
  pk_ricetta serial not null,
  titolo text not null,
  stampata boolean not null default false,
  porzioni text null,
  n_porzioni numeric(10, 1) null default null::numeric,
  tempo_preparazione interval null,
  tempo_cottura interval null,
  tempo_agg interval null,
  fk_cat integer null,
  etnica text null,
  data date not null,
  immagine text null,
  esecuzione text not null,
  diff integer null,
  commenti boolean not null default false,
  cottura text null,
  autore text not null,
  voto integer null default 0,
  nascosta boolean not null default false,
  constraint ricette_pkey primary key (pk_ricetta),
  constraint ricette_fkCat_fkey foreign KEY (fk_cat) references categorie (pk_cat) on update CASCADE on delete set null,
  constraint check_voto check (
    (
      (voto >= 0)
      and (voto <= 5)
    )
  )
) TABLESPACE pg_default;

DROP TABLE IF EXISTS commenti;
create table public.commenti (
  pk_commento serial not null,
  fk_ricetta integer not null,
  data_commento date not null,
  contenuto text not null,
  autore text not null,
  constraint commenti_pkey primary key (pk_commento),
  constraint commenti_fkRicetta_fkey foreign KEY (fk_ricetta) references ricette (pk_ricetta) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

DROP TABLE IF EXISTS ingredienti_ricette;
create table public.ingredienti_ricette (
  pk_row serial not null,
  fk_ricetta integer not null,
  fk_ingrediente integer not null,
  quant numeric(5, 1) null default null::numeric,
  fk_misura integer null,
  dettagli text null,
  constraint ingredienti_ricette_pkey primary key (pk_row),
  constraint ingredienti_ricette_fkIngrediente_fkey foreign KEY (fk_ingrediente) references ingredienti (pk_ingrediente) on update CASCADE on delete CASCADE,
  constraint ingredienti_ricette_fkMisura_fkey foreign KEY (fk_misura) references misure (pk_misura) on update CASCADE on delete set null,
  constraint ingredienti_ricette_fkRicetta_fkey foreign KEY (fk_ricetta) references ricette (pk_ricetta) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

DROP TABLE IF EXISTS link_ricette;
create table public.link_ricette (
  pk_linkr serial not null,
  fk_ric1 integer not null,
  fk_ric2 integer not null,
  doppio boolean not null default false,
  constraint link_ricette_pkey primary key (pk_linkr),
  constraint link_ricette_fkric1_fkey foreign KEY (fk_ric1) references ricette (pk_ricetta) on update CASCADE on delete CASCADE,
  constraint link_ricette_fkric2_fkey foreign KEY (fk_ric2) references ricette (pk_ricetta) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;