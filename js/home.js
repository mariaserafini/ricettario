
/**
 * HOME PAGE RANDOM una per macro categoria
 
import { _supabase, app } from './config.js';
export async function showHome() {
    app.innerHTML = '<div class="loader">Generando il tuo ricettario...</div>';
    const { data: categorie, error: errCat } = await _supabase
        .from('categorie')
        .select('categoria, ordine')
        .order('ordine', { ascending: true });

    if (errCat) {
        app.innerHTML = `<p>Errore categorie: ${errCat.message}</p>`;
        return;
    }

    const categorieUniche = [...new Map(categorie.map(item => [item.categoria, item])).values()];
    let html = `<section class="home-header"><h3>Lasciati ispirare</h3></section><div class="recipe-grid">`;

    const promesseRicette = categorieUniche.map(cat =>
        _supabase.from('ricette').select(`pk_ricetta, titolo, autore, voto, immagine, preferita, tempo_cottura, tempo_preparazione, tempo_agg, categorie!inner (categoria, sottocategoria)`).eq('categorie.categoria', cat.categoria).eq('nascosta', false)
    );

    const risultati = await Promise.all(promesseRicette);
    risultati.forEach((res) => { //evt rimetti ,index
        const listaRicette = res.data;
        if (listaRicette && listaRicette.length > 0) {
            const r = listaRicette[Math.floor(Math.random() * listaRicette.length)];
            html += renderRecipeCard(r);
        }
    });
    html += '</div>';
    app.innerHTML = html;
}
    */

/**
 * HOME PAGE RANDOM (RAGGRUPPATA PER GRUPPI DI CATEGORIE)
 */
import { _supabase, app } from './config.js';

// Definizione dei gruppi di categorie (ID pk_cat / fk_cat)
const GRUPPI_CATEGORIE = [
    [1, 45], // Antipasti, Crackers
    [27], // Pane
    [25, 28], // Focacce/Pizze, Torte salate
    [3], // Pasta
    [5, 6], // Risotti, Zuppe
    [2, 4], // Gnocchi, Pasta al forno
    [7, 8, 9, 10, 11, 12, 13, 38, 42, 44], // Carne o Pesce
    [15, 41, 43], // Legumi, Uova, Formaggi
    [14, 16], // Contorni e ripieni verdura
    [33, 34, 35, 36, 37, 40], // Bevande
    [17], // Biscotti/Pasticcini
    [19, 24], // Crostate, Torte
    [20, 21, 22], // Dolci al cucchiaio, Frutta, Dolci Fritti
    [29, 31, 32, 39], // Conserve
    [23, 26] // Impasti base, Brioche
];

export async function showHome() {
    app.innerHTML = '<div class="loader">Generando il tuo ricettario...</div>';

    try {

        const { data: tutteCategorie, error: errCatAll } = await _supabase
            .from('categorie')
            .select('pk_cat, categoria, sottocategoria, ordine');

        if (errCatAll) {
            app.innerHTML = `<p>Errore categorie: ${errCatAll.message}</p>`;
            return;
        }

        // Creiamo un dizionario (mappa) per ritrovare subito i dati della categoria partendo dal suo ID (pk_cat)
        const mappaCategorie = {};
        tutteCategorie.forEach(cat => {
            mappaCategorie[cat.pk_cat] = {
                categoria: cat.categoria,
                sottocategoria: cat.sottocategoria
            };
        });

        // 1. Creiamo le promesse per ogni GRUPPO invece che per singola categoria
        const promesseRicette = GRUPPI_CATEGORIE.map(gruppoIds =>
            _supabase
                .from('ricette')
                .select(`
                    pk_ricetta, 
                    titolo, 
                    autore, 
                    voto, 
                    immagine, 
                    preferita, 
                    tempo_cottura, 
                    tempo_preparazione, 
                    tempo_agg, 
                    fk_cat
                `)
                .in('fk_cat', gruppoIds)
                .eq('nascosta', false)
        );

        // 2. Eseguiamo tutte le query in parallelo
        const risultati = await Promise.all(promesseRicette);

        let html = `<section class="home-header"><h3>Lasciati ispirare</h3></section><div class="recipe-grid">`;

        // 3. Per ogni gruppo, selezioniamo UNA ricetta a caso
        risultati.forEach((res) => {
            const listaRicette = res.data;
            if (listaRicette && listaRicette.length > 0) {
                const r = listaRicette[Math.floor(Math.random() * listaRicette.length)];
                r.categorie = mappaCategorie[r.fk_cat] || { categoria: 'Ricetta', sottocategoria: null };
                html += renderRecipeCard(r);
            }
        });

        html += '</div>';

        app.innerHTML = html;

    } catch (err) {
        console.error("Errore caricamento Home:", err);
        app.innerHTML = `<p>Si è verificato un errore durante il caricamento della Home.</p>`;
    }
}