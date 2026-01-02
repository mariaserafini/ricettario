export function renderRecipeCard(r) {
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
                    <span class="category-label">${r.categorie?.categoria || 'Ricetta'}</span>
                </div>
                
                <div class="card-body">
                    <h3>${r.titolo}</h3>
                    <div class="rating-stars">${generaStelline(r.voto)}</div>
                    <div class="card-footer-info">
                        <span class="author-info">di ${r.autore}</span>
                    </div>
                </div>
            </a>
        </div>
    `;
}