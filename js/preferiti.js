/**
 * PAGINA PREFERITI
 */
import { _supabase, app } from './config.js';

export async function showPreferiti() {
    app.innerHTML = '<div class="loader">Caricamento dei tuoi piatti del cuore...</div>';

    // Recuperiamo solo le ricette dove preferita è true e non sono nascoste
    const { data: ricette, error } = await _supabase
        .from('ricette')
        .select(`pk_ricetta, titolo, autore, voto, immagine, preferita, nascosta, tempo_cottura, tempo_preparazione, tempo_agg, categorie(categoria)`)
        .eq('preferita', true)
        .eq('nascosta', false)
        .order('titolo', { ascending: true });

    if (error) {
        app.innerHTML = `<p>Errore nel caricamento: ${error.message}</p>`;
        return;
    }

    let html = `
        <section class="home-header">
            <h1>I tuoi Preferiti ❤️</h1>
            <p>Hai selezionato ${ricette.length} ricette speciali</p>
        </section>
        <div class="recipe-grid">
    `;

    if (ricette.length > 0) {
        ricette.forEach(r => {
            html += renderRecipeCard(r); // Riutilizziamo la tua card esistente
        });
    } else {
        html += '<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Non hai ancora aggiunto ricette ai preferiti. Clicca sul 🤍 delle card per iniziare!</p>';
    }

    html += '</div>';
    app.innerHTML = html;
}