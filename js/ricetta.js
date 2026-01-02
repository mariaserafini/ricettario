/**
 * DETTAGLIO RICETTA
 */
import { _supabase, app } from './config.js';
import { renderDifficolta, renderStars } from './ui.js';

export async function showRicetta(id) {
    const newUrl = window.location.origin + window.location.pathname + '?id=' + id;
    // globalità funzioni
    window.saveComment = saveComment;
    window.copiaVersioneTesto = copiaVersioneTesto;
    window.segnaComeStampata = segnaComeStampata;

    app.innerHTML = '<div class="loader">Caricamento ricetta...</div>';
    const { data: r, error } = await _supabase
        .from('ricette')
        .select(`*, categorie(Categoria, Sottocategoria), ingredienti_ricette(Quant, Dettagli, ingredienti(Ingrediente), misure(Misura)), commenti(Commento, Autore, Data)`)
        .eq('pkRicetta', id)
        .single();

    if (error) {
        app.innerHTML = `<p>Errore: ${error.message}</p>`;
        return;
    }

    const portata = r.categorie?.Sottocategoria || r.categorie?.Categoria || 'N/A';
    const immagineUrl = r.Immagine || 'https://via.placeholder.com/400x300?text=Senza+Foto';
    // Funzione interna per formattare i tempi HH:MM:SS in modo leggibile
    const formatTime = (t) => {
        if (!t || t === "00:00:00") return null;
        const parti = t.split(':');
        const h = parseInt(parti[0]);
        const m = parseInt(parti[1]);
        if (h > 0) return `${h}h ${m}min`;
        return `${m}min`;
    };

    const tPrep = formatTime(r.Tempo_preparazione);
    const tCott = formatTime(r.Tempo_cottura);
    const tAgg = formatTime(r.Tempo_agg);

    app.innerHTML = `
    <div class="recipe-page-wrapper">
        <div class="nav-actions">
            <button class="btn-back" onclick="history.back()">← Torna Indietro</button>
            <div>
            <button class="btn-action-nav">✏️ Modifica</button>
            <button class="btn-action-nav">🔗 Collega</button>
            <button class="btn-action-nav">📋 Clona</button>
            <button class="btn-action-nav btn-delete">🗑️ Elimina</button>
            </div>
            <button class="btn-print-text" onclick="copiaVersioneTesto()">📋 Copia Testo</button>
            <button class="btn-action-stampata ${r.stampata ? 'already-printed' : ''}" 
                    onclick="segnaComeStampata(${r.pkRicetta}, ${r.stampata})">
                <span>${r.stampata ? '✅' : '🖨️'}</span> 
                ${r.stampata ? 'Rimuovi da Stampate' : 'Segna come Stampata'}
            </button>
        </div>

        <div class="recipe-header-centered">
            <h1>${r.Titolo} ${r.Etnica ? `<small>(${r.Etnica})</small>` : ''}</h1>
            <div id="rating-area" class="interactive-rating">${renderStars(r.Voto, r.pkRicetta)}</div>
        </div>

        <div class="recipe-grid-layout">
            <aside class="recipe-sidebar">
                <div class="ingredients-box">
                    <h3>Ingredienti</h3>
                    <div id="display-porzioni" style="margin-bottom: 15px; font-size: 0.9rem; color: #666;">
                        <strong>Dosi per:</strong> <span>${r.N_porzioni || 4}</span> persone
                    </div>
                    <ul class="ingredients-list" id="lista-ingredienti">
                        ${r.ingredienti_ricette.map((ing, index) => `
                            <li class="ingredient-item">
                                <span class="qty-wrapper">
                                    <strong class="qty-value" data-base="${ing.Quant || ''}">${ing.Quant || ''}</strong>
                                </span>
                                <strong>${ing.misure?.Misura || ''}</strong> 
                                ${ing.ingredienti?.Ingrediente}
                            </li>
                        `).join('')}
                    </ul>
                    <button class="btn-portions" id="btn-modifica-dosi" onclick="attivaModificaDosi(${r.N_porzioni || 4})">
                        ⚖️ Modifica Dosi
                    </button>
                </div>
                <div class="add-comment-box" style="margin-top: 30px; background: #eee; padding: 15px; border-radius: 8px;">
                    <h4>Aggiungi Commento</h4>
                    <input type="text" id="new-comment-author" placeholder="Tuo nome..." value = "Meri">
                    <textarea id="new-comment-text" placeholder="Scrivi qui..."></textarea>
                    <button class="btn-comment" onclick="saveComment(${r.pkRicetta})">Salva Nota</button>
                </div>
            </aside>

            <main class="recipe-main-content">
            <div class="recipe-top-row">
                <div class="recipe-info-badges">
                    <div class="badges-row">
                        <span class="badge">📂 ${portata}</span>
                        <span class="badge">🔥 ${r.Cottura || 'N/A'}</span>
                        <span class="badge">📊 Diff: ${renderDifficolta(r.Diff)}</span>
                    </div>
                    <div class="badges-row">
                        ${tPrep && tPrep !== '0' ? `<span class="badge badge-time">🥣 ${tPrep}</span>` : ''}
                        ${tCott && tCott !== '0' ? `<span class="badge badge-time">🍲 ${tCott}</span>` : ''}
                        ${tAgg && tAgg !== '0' ? `<span class="badge badge-time">⏳  ${tAgg}</span>` : ''}
                    </div>   
                </div>
                <div class="recipe-main-image">
                    <img src="${immagineUrl}" alt="${r.Titolo}" style="max-width: 200px; height: auto;">
                </div>
            </div>

            <div class="execution-box">
                <h3>Preparazione</h3>
                <p id="exec-to-copy">${r.Esecuzione}</p>
            </div>

                <div class="recipe-footer-meta">
                    <p><strong>Autore:</strong> ${r.Autore} | <strong>Data:</strong> ${new Date(r.Data).toLocaleDateString('it-IT')}</p>
                </div>
                
                <div class="comments-section">
                    <h3>Commenti</h3>
                    <div class="comments-list">
                        ${r.commenti.map(c => `
                            <div class="comment-card-aside" style="background: #fff; margin-bottom: 10px; padding: 10px; border-left: 4px solid orange;">
                                <p>"${c.Commento}"</p>
                                <small>${c.Autore} - ${new Date(c.Data).toLocaleDateString()}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </main>
        </div>
    </div>`;
}

// Funzione per generare una versione testuale pulita e copiarla negli appunti
function copiaVersioneTesto() {
    const titolo = document.querySelector('.recipe-header h1').innerText.replace('🖨️', '').trim();
    const ingredienti = Array.from(document.querySelectorAll('.ingredient-item'))
        .map(el => "- " + el.innerText.replace(/\s+/g, ' ').trim())
        .join('\n');
    const esecuzione = document.getElementById('exec-to-copy').innerText;

    const testoFinale = `📖 ${titolo}\n\n🛒 INGREDIENTI:\n${ingredienti}\n\n👨‍🍳 PREPARAZIONE:\n${esecuzione}`;

    navigator.clipboard.writeText(testoFinale).then(() => {
        alert("Versione testuale copiata negli appunti!");
    });
}

export async function saveComment(idRicetta) {
    const autore = document.getElementById('new-comment-author').value;
    const testo = document.getElementById('new-comment-text').value;
    if (!testo || !autore) { alert("Inserisci nome e commento!"); return; }
    const { error } = await _supabase.from('commenti').insert([{ fkRicetta: idRicetta, Autore: autore, Commento: testo, Data: new Date().toISOString() }]);
    if (error) alert("Errore: " + error.message);
    else { document.getElementById('new-comment-text').value = ''; showRicetta(idRicetta); }
}

export async function segnaComeStampata(id, statoAttuale) {
    const nuovoStato = !statoAttuale;
    const { error } = await _supabase
        .from('ricette')
        .update({ stampata: nuovoStato })
        .eq('pkRicetta', id);

    if (error) {
        alert("Errore nell'aggiornamento: " + error.message);
    } else {
        // Ricarichiamo la ricetta per aggiornare l'interfaccia
        showRicetta(id);
    }
}

window.attivaModificaDosi = (porzioniOriginali) => {
    const lista = document.getElementById('lista-ingredienti');
    const wrappers = lista.querySelectorAll('.qty-wrapper');

    wrappers.forEach((wrapper, index) => {
        const spanOriginale = wrapper.querySelector('.qty-value');
        if (!spanOriginale) return;

        const valoreAttuale = spanOriginale.innerText;

        // Nascondiamo il testo originale (che contiene il data-base) ma NON lo eliminiamo
        spanOriginale.style.display = 'none';

        // Controlliamo se l'input esiste già per non duplicarlo
        let input = wrapper.querySelector('.input-dose');
        if (!input) {
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'input-dose no-arrows';
            input.step = 'any';

            // Gestione eventi: Invio e uscita dal campo
            input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };
            input.onblur = () => ricalcolaDaIngrediente(index, porzioniOriginali);

            wrapper.appendChild(input);
        }

        input.value = valoreAttuale;
        input.style.display = 'inline-block';
    });

    // Aggiunta campo porzioni (se non esiste)
    if (!document.getElementById('input-porzioni')) {
        const box = document.querySelector('.ingredients-box');
        const divPorzioni = document.createElement('div');
        divPorzioni.className = "portions-edit-area";
        divPorzioni.innerHTML = `
            <p style="margin: 10px 0; font-size: 0.9rem; font-weight: bold;">
                Porzioni: <input type="number" id="input-porzioni" class="no-arrows" value="${porzioniOriginali}" 
                onkeydown="if(event.key==='Enter') { this.blur(); }"
                onblur="ricalcolaDaPorzioni(this.value, ${porzioniOriginali})">
            </p>`;
        box.insertBefore(divPorzioni, lista);
    }

    const btn = document.getElementById('btn-modifica-dosi');
    btn.innerText = "✅ Fine Modifica";
    btn.onclick = () => location.reload();
};

window.ricalcolaDaIngrediente = (indexInviante, porzioniOriginali) => {
    const inputs = document.querySelectorAll('.input-dose');
    // Recuperiamo i valori base dagli attributi data-base che abbiamo salvato nell'HTML originale
    const basi = document.querySelectorAll('.qty-value');

    const inputModificato = inputs[indexInviante];
    if (!inputModificato || inputModificato.value === "") return;

    // Recuperiamo il valore originale dell'ingrediente che l'utente sta modificando
    const valoreBaseModificato = parseFloat(basi[indexInviante].getAttribute('data-base'));

    if (!valoreBaseModificato || valoreBaseModificato === 0) return;

    const rapporto = parseFloat(inputModificato.value) / valoreBaseModificato;

    // Aggiorna tutti gli ALTRI input
    inputs.forEach((inp, i) => {
        if (i !== indexInviante) {
            const baseOriginale = parseFloat(basi[i].getAttribute('data-base'));
            if (!isNaN(baseOriginale)) {
                inp.value = (baseOriginale * rapporto).toFixed(1).replace('.0', '');
            }
        }
    });

    // Aggiorna le porzioni
    const pInput = document.getElementById('input-porzioni');
    if (pInput) {
        pInput.value = (porzioniOriginali * rapporto).toFixed(1).replace('.0', '');
    }
};

window.ricalcolaDaPorzioni = (nuoveP, originaliP) => {
    const rapporto = nuoveP / originaliP;
    const inputs = document.querySelectorAll('.input-dose');
    const basi = document.querySelectorAll('.qty-value');

    inputs.forEach((inp, i) => {
        const baseOriginale = parseFloat(basi[i].getAttribute('data-base'));
        if (!isNaN(baseOriginale)) {
            inp.value = (baseOriginale * rapporto).toFixed(1).replace('.0', '');
        }
    });
};