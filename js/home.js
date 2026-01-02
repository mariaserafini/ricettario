
/**
 * HOME PAGE RANDOM
 */
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
    let html = `<section class="home-header"><h1>Ispirazione del momento</h1><p>Una proposta per ogni categoria</p></section><div class="recipe-grid">`;

    const promesseRicette = categorieUniche.map(cat =>
        _supabase.from('ricette').select(`pk_ricetta, titolo, autore, voto, immagine, tempo_cottura, tempo_preparazione, tempo_agg, categorie!inner (categoria)`).eq('categorie.categoria', cat.categoria).eq('nascosta', false)
    );

    const risultati = await Promise.all(promesseRicette);
    risultati.forEach((res, index) => {
        const listaRicette = res.data;
        if (listaRicette && listaRicette.length > 0) {
            const r = listaRicette[Math.floor(Math.random() * listaRicette.length)];
            html += renderRecipeCard(r);
        }
    });
    html += '</div>';
    app.innerHTML = html;
}