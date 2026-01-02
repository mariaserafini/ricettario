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
        .update({ voto: nuovoVoto })
        .eq('pk_ricetta', id);

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
export function convertiInMinuti(timeString) {
    if (!timeString || typeof timeString !== 'string') return 0;
    const parti = timeString.split(':');
    const ore = parseInt(parti[0]) || 0;
    const minuti = parseInt(parti[1]) || 0;
    return (ore * 60) + minuti;
}

// Nuova funzione per formattare i minuti in "1h 30min" o "45min"
export function formattaTempo(minutiTotali) {
    if (minutiTotali <= 0) return "";

    const h = Math.floor(minutiTotali / 60);
    const m = minutiTotali % 60;

    if (h > 0) {
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${m}min`;
}

export function renderRecipeCard(r) {
    const catBase = r.categorie?.categoria || 'Ricetta';
    const sottoCat = r.categorie?.sottocategoria;
    const categoriaVisualizzata = sottoCat ? `${catBase}: ${sottoCat}` : catBase;

    const tCott = convertiInMinuti(r.tempo_cottura);
    const tPrep = convertiInMinuti(r.tempo_preparazione);
    const tAgg = convertiInMinuti(r.tempo_agg);
    const minutiTotali = tCott + tPrep + tAgg;
    const tempoVisualizzato = formattaTempo(minutiTotali);

    // Verifichiamo se l'immagine esiste davvero
    const haImmagine = r.immagine && r.immagine.trim() !== "";
    const immagineUrl = haImmagine ? r.immagine : '';

    return `
        <div class="card-wrapper" data-id="${r.pk_ricetta}" style="position: relative;">
        <button class="btn-toggle-view card-eye-btn" 
                    onclick="event.preventDefault(); event.stopPropagation(); toggleNascondi(${r.pk_ricetta}, ${r.nascosta})" 
                    title="${r.nascosta ? 'Mostra' : 'Nascondi'}">
                ${r.nascosta
            ? `<svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
            : `<svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
        }
            </button>
        <a href="?id=${r.pk_ricetta}" class="recipe-card ${!haImmagine ? 'no-image' : ''}" 
           onclick="if(!event.ctrlKey && !event.metaKey && event.button !== 1) { event.preventDefault(); naviga('ricetta', ${r.pk_ricetta}); }">
            <div class="card-image-container">
                ${haImmagine ? `<img src="${immagineUrl}" alt="${r.titolo}" class="card-img">` : ''}
                <span class="category-label">${categoriaVisualizzata}</span>
            </div>
            
            <div class="card-body">
                <h3>${r.titolo}</h3>
                <div class="rating-stars">${generaStelline(r.voto)}</div>
                
                <div class="card-footer-info">
                    ${minutiTotali > 0 ? `<span class="time-info">🕒 ${tempoVisualizzato}</span>` : '<span></span>'}
                    ${r.autore ? `<span class="author-info">di ${r.autore}</span>` : ''}
                </div>
            </div>
        </a>
        </div>
    `;
}

// nascondere la ricetta
export async function toggleNascondi(id, statoAttuale) {
    const nuovoStato = !statoAttuale;

    const { error } = await _supabase
        .from('ricette')
        .update({ nascosta: nuovoStato })
        .eq('pk_ricetta', id);

    if (error) {
        alert("Errore: " + error.message);
        return;
    }

    const el = document.querySelector(`[data-id="${id}"]`);

    if (el) {
        // Se siamo nella pagina del dettaglio (recipe-page-wrapper)
        if (el.classList.contains('recipe-page-wrapper')) {
            const btn = el.querySelector('.btn-toggle-view');
            if (btn) {
                // Cambiamo l'icona e la funzione onclick "al volo"
                btn.innerHTML = nuovoStato
                    ? `<svg class="icon-eye" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                    : `<svg class="icon-eye" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

                btn.setAttribute('onclick', `toggleNascondi(${id}, ${nuovoStato})`);
                btn.title = nuovoStato ? "Mostra ricetta" : "Nascondi ricetta";
            }
        } else {
            // Se siamo nella Home o Ricerca (card), facciamo sparire tutto
            el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            el.style.opacity = '0';
            el.style.transform = 'scale(0.9)';
            setTimeout(() => el.remove(), 300);
        }
    }
}
