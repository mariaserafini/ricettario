/**
 * ULTIME 36 RICETTE
 */
import { _supabase, app } from './config.js';

export async function showLatest() {
    app.innerHTML = '<div class="loader">Caricamento ultime novità...</div>';

    const { data: ultimeRicette, error } = await _supabase
        .from('ricette')
        .select(`pk_ricetta, titolo, autore, voto, immagine, nascosta, data, tempo_cottura, tempo_preparazione, tempo_agg, immagine, categorie(categoria)`)
        .order('data', { ascending: false })
        .order('pk_ricetta', { ascending: false })
        .limit(36);

    if (error) {
        app.innerHTML = `<p>Errore: ${error.message}</p>`;
        return;
    }

    // Usiamo la stessa struttura che funziona in home.js e ricerca.js
    let html = `
        <section class="home-header">
            <h3>Ultime inserite</h3>
        </section>
        <div class="recipe-grid">`;

    html += ultimeRicette.map(r => renderRecipeCard(r)).join('');

    html += '</div>';
    app.innerHTML = html;
}