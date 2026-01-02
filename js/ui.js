import { _supabase } from './config.js';
// FUNZIONI DI SERVIZIO

export function renderDifficolta(livello) {
    let html = '<span class="diff-dots">';
    for (let i = 1; i <= 5; i++) {
        html += i <= livello ? '<span class="dot active">●</span>' : '<span class="dot">○</span>';
    }
    return html + '</span>';
}

export function renderStars(votoAttuale, idRicetta) {
    let starsHtml = '<div class="stars-container">';
    for (let i = 1; i <= 5; i++) {
        starsHtml += `<span class="star ${i <= votoAttuale ? 'active' : ''}" onclick="aggiornaVoto(${idRicetta}, ${i})">★</span>`;
    }
    return starsHtml + '</div>';
}

export function generaStelline(voto) {
    return (voto === 0 || voto === null) ? '<span class="no-rating">Mai provata</span>' : '⭐'.repeat(voto);
}

// Spostiamo qui la funzione di aggiornamento per renderla autonoma
export async function aggiornaVoto(id, nuovoVoto) {
    const { error } = await _supabase
        .from('ricette')
        .update({ Voto: nuovoVoto })
        .eq('pkRicetta', id);

    if (error) {
        alert("Errore: " + error.message);
    } else {
        // Se la funzione showRicetta è globale, ricarichiamo la pagina
        if (window.showRicetta) {
            window.showRicetta(id);
        } else {
            // Fallback: aggiorna solo le stelline se showRicetta non è pronta
            const area = document.getElementById('rating-area');
            if (area) area.innerHTML = renderStars(nuovoVoto, id);
        }
    }
}

// Funzione per convertire "00:40:00" in minuti totali
function convertiInMinuti(timeString) {
    if (!timeString || typeof timeString !== 'string') return 0;
    const parti = timeString.split(':');
    const ore = parseInt(parti[0]) || 0;
    const minuti = parseInt(parti[1]) || 0;
    return (ore * 60) + minuti;
}

// Nuova funzione per formattare i minuti in "1h 30min" o "45min"
function formattaTempo(minutiTotali) {
    if (minutiTotali <= 0) return "";

    const h = Math.floor(minutiTotali / 60);
    const m = minutiTotali % 60;

    if (h > 0) {
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${m}min`;
}

export function renderRecipeCard(r) {
    const catBase = r.categorie?.Categoria || 'Ricetta';
    const sottoCat = r.categorie?.Sottocategoria;
    const categoriaVisualizzata = sottoCat ? `${catBase}: ${sottoCat}` : catBase;
    const isTested = r.Voto > 0;

    const tCott = convertiInMinuti(r.Tempo_cottura);
    const tPrep = convertiInMinuti(r.Tempo_preparazione);
    const tAgg = convertiInMinuti(r.Tempo_agg);
    const minutiTotali = tCott + tPrep + tAgg;
    const tempoVisualizzato = formattaTempo(minutiTotali);

    // Verifichiamo se l'immagine esiste davvero
    const haImmagine = r.Immagine && r.Immagine.trim() !== "";
    const immagineUrl = haImmagine ? r.Immagine : '';

    return `
        <a href="?id=${r.pkRicetta}" class="recipe-card ${!haImmagine ? 'no-image' : ''}" 
           onclick="if(!event.ctrlKey && !event.metaKey && event.button !== 1) { event.preventDefault(); naviga('ricetta', ${r.pkRicetta}); }">
            <div class="card-image-container">
                ${haImmagine ? `<img src="${immagineUrl}" alt="${r.Titolo}" class="card-img">` : ''}
                <span class="category-label">${categoriaVisualizzata}</span>
                ${isTested ? '<span class="tested-badge">✅</span>' : ''}
            </div>
            <div class="card-body">
                <h3>${r.Titolo}</h3>
                <div class="rating-stars">${generaStelline(r.Voto)}</div>
                
                <div class="card-footer-info">
                    ${minutiTotali > 0 ? `<span class="time-info">🕒 ${tempoVisualizzato}</span>` : '<span></span>'}
                    ${r.Autore ? `<span class="author-info">di ${r.Autore}</span>` : ''}
                </div>
            </div>
        </a>
    `;
}