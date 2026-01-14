/**
 * DETTAGLIO RICETTA
 */
import { _supabase, app } from './config.js';
import { renderDifficolta, renderStars, attivaSchermoSempreAcceso } from './ui.js';
import { showForm } from './form-ricetta.js';
import { apriCollegamento } from './links.js';

export async function showRicetta(id) {
    attivaSchermoSempreAcceso();
    window.saveComment = saveComment;
    window.copiaVersioneTesto = copiaVersioneTesto;
    window.segnaComeStampata = segnaComeStampata;
    window.editRicetta = () => showForm(id);
    window.eliminaRicetta = () => eliminaRicetta(id);
    window.clonaRicetta = () => clonaRicetta(id);
    window.apriCollegamento = () => apriCollegamento(r.pk_ricetta, r.titolo);
    window.pianificaOggi = () => pianificaOggi(id);

    app.innerHTML = '<div class="loader">Caricamento ricetta...</div>';
    const { data: r, error } = await _supabase
        .from('ricette')
        .select(`*, categorie(categoria, sottocategoria), ingredienti_ricette(quant, dettagli, ingredienti(ingrediente), misure(misura)), commenti(contenuto, autore, data_commento)`)
        .eq('pk_ricetta', id)
        .order('quant', {
            foreignTable: 'ingredienti_ricette',
            ascending: false,
            nullsFirst: false
        })
        .single();

    if (error) {
        app.innerHTML = `<p>Errore: ${error.message}</p>`;
        return;
    }
    const isFav = r.preferita === true;
    const portata = r.categorie?.sottocategoria || r.categorie?.categoria || 'N/A';
    const immagineUrl = r.immagine || 'https://via.placeholder.com/400x300?text=Senza+Foto';
    // Funzione interna per formattare i tempi HH:MM:SS in modo leggibile
    const formatTime = (t) => {
        if (!t || t === "00:00:00") return null;
        const parti = t.split(':');
        const h = parseInt(parti[0]);
        const m = parseInt(parti[1]);
        if (h > 0 && m > 0) return `${h}h ${m}min`;
        if (h > 0) return `${h}h`;
        return `${m}min`;
    };

    const tPrep = formatTime(r.tempo_preparazione);
    const tCott = formatTime(r.tempo_cottura);
    const tAgg = formatTime(r.tempo_agg);

    // controllo se esistono ricette linkate
    // Recupera i link dove la ricetta attuale è il punto A o il punto B
    const { data: links, error: linkErr } = await _supabase
        .from('link_ricette')
        .select(`
        doppio,
        fk_ric1,
        fk_ric2,
        ricetta1:fk_ric1 (pk_ricetta, titolo),
        ricetta2:fk_ric2 (pk_ricetta, titolo)
    `)
        .or(`fk_ric1.eq.${id},fk_ric2.eq.${id}`);

    if (linkErr) {
        console.error("Errore recupero link:", linkErr);
        return;
    }

    const ricetteCollegate = links
        .filter(l => {
            // REGOLA:
            // Mostra sempre se sono la sorgente (fk_ric1)
            if (l.fk_ric1 == id) return true;

            // Se sono la destinazione (fk_ric2), mostra SOLO SE è bidirezionale
            if (l.fk_ric2 == id && l.doppio === true) return true;

            // Altrimenti scarta (es: è un legame semplice verso di me, ma non da me)
            return false;
        })
        .map(l => {
            // Determiniamo qual è l'altra ricetta da mostrare
            const altraRicetta = (l.fk_ric1 == id) ? l.ricetta2 : l.ricetta1;

            return {
                id: altraRicetta.pk_ricetta,
                titolo: altraRicetta.titolo,
                bidirezionale: l.doppio
            };
        });

    app.innerHTML = `
    <div class="recipe-page-wrapper" data-id="${r.pk_ricetta}">
        <div class="nav-actions">
            <button class="btn-back" onclick="history.back()">← Indietro</button>
            <button class="btn-action-nav" onclick="editRicetta()">✏️ Modifica</button>
            <button class="btn-action-nav" onclick="apriCollegamento()">🔗 Collega</button>
            <button class="btn-action-nav" onclick="clonaRicetta()">📋 Clona</button>
            <button class="btn-action-nav btn-delete" onclick="eliminaRicetta()">🗑️ Elimina</button>
            <button class="btn-action-nav" onclick="copiaVersioneTesto()">📋 Testo</button>
           <button class="btn-action-stampata ${r.stampata ? 'already-printed' : ''}" 
        onclick="segnaComeStampata(${r.pk_ricetta})">
    ${r.stampata ? '✅' : '🖨️'}
    ${r.stampata ? 'Stampata' : 'Stampa'}
</button>
            <button class="btn-print-text" onclick="pianificaOggi()" title="Cucina oggi">Oggi</button>
            <button class="btn-print-text" onclick="document.getElementById('picker-data').showPicker()" title="Pianifica" style="position: relative;">
                🗓️ Pianifica
                <input type="date" id="picker-data" style="position:absolute; visibility:hidden; width:0;" onchange="salvaDataPianificata(this.value, ${r.pk_ricetta})">
            </button>
        </div>
        </div>

        <div class="recipe-header-centered">
            <h1>${r.titolo} ${r.etnica ? `<small>(${r.etnica})</small>` : ''}</h1>
            <div id="rating-area" class="interactive-rating">${renderStars(r.voto, r.pk_ricetta)}</div>
            <button class="btn-toggle-view btn-heart" onclick="togglePreferitaDettaglio(${r.pk_ricetta}, ${isFav})" title="Preferita">
            <span style="font-size: 1.5rem;">${isFav ? '❤️' : '🤍'}</span>
            </button>
            <span style="font-size: 1.5rem;">
            ${r.nascosta
            ? `<button class="btn-toggle-view btn-eye" onclick="toggleNascondi(${r.pk_ricetta}, true)" title="Mostra ricetta">
         <svg class="icon-eye" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
         </svg>
       </button>`
            : `<button class="btn-toggle-view btn-eye" onclick="toggleNascondi(${r.pk_ricetta}, false)" title="Nascondi ricetta">
         <svg class="icon-eye" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
         </svg>
       </button>`
        }
            </span>
        </div>

        <div class="recipe-grid-layout">
            <aside class="recipe-sidebar">
                <div class="ingredients-box">
                    <h3>Ingredienti</h3>
                    <div id="display-porzioni" style="margin-bottom: 15px; font-size: 0.9rem; color: #666;">
                        ${(r.n_porzioni || r.porzioni) ? `
                        <strong>Dosi per:</strong> <span>${r.n_porzioni || ''}</span> ${r.porzioni || ''}
                        ` : ''}
                    </div>
                    <ul class="ingredients-list" id="lista-ingredienti">
                        ${r.ingredienti_ricette.map((ing) => `
                            <li class="ingredient-item">
                                <span class="qty-wrapper">
                                    <strong class="qty-value" data-base="${ing.quant || ''}">${ing.quant || ''}</strong>
                                </span>
                                <strong>${ing.misure?.misura || ''}</strong> 
                                ${ing.ingredienti?.ingrediente} ${ing.dettagli || ''}
                            </li>
                        `).join('')}
                    </ul>
                    <button class="btn-portions" id="btn-modifica-dosi" onclick="attivaModificaDosi(${r.n_porzioni || 1})">
                        ⚖️ Modifica Dosi
                    </button>
                </div>
                <div class="add-comment-box" style="margin-top: 30px; background: #eee; padding: 15px; border-radius: 8px;">
                    <h4>Aggiungi Commento</h4>
                    <input type="text" id="new-comment-author" placeholder="Tuo nome..." value = "Meri">
                    <textarea id="new-comment-text" placeholder="Scrivi qui..."></textarea>
                    <button class="btn-comment" onclick="saveComment(${r.pk_ricetta})">Salva Commento</button>
                </div>
            </aside>

            <main class="recipe-main-content">
            <div class="recipe-top-row">
                <div class="recipe-info-badges">
                    <div class="badges-row">
                        <span class="badge">📂 ${portata}</span>
                        <span class="badge">🔥 ${r.cottura || 'N/A'}</span>
                        <span class="badge">📊 Diff: ${renderDifficolta(r.diff)}</span>
                    </div>
                    <div class="badges-row">
                        ${tPrep && tPrep !== '0' ? `<span class="badge badge-time">🥣 ${tPrep}</span>` : ''}
                        ${tCott && tCott !== '0' ? `<span class="badge badge-time">🍲 ${tCott}</span>` : ''}
                        ${tAgg && tAgg !== '0' ? `<span class="badge badge-time">⏳  ${tAgg}</span>` : ''}
                    </div>   
                </div>
               ${(immagineUrl && immagineUrl.trim() !== "") ? `
                <div class="recipe-main-image">
                    <img src="${immagineUrl}" style="max-width: 200px; height: auto;" onerror="this.parentElement.style.display='none'">
                </div>` : ''}
            </div>

            <div class="execution-box">
                <h3>Preparazione</h3>
                <p id="exec-to-copy" style="white-space: pre-line;">${r.esecuzione}</p>
            </div>

                <div class="recipe-footer-meta">
                    <p><strong>Autore:</strong> ${r.autore} | <strong>Data:</strong> ${new Date(r.data).toLocaleDateString('it-IT')}</p>
                </div>

                ${ricetteCollegate.length > 0 ? `
                <div class="comments-section">
                    <h3 style="color: #e67e22; margin-bottom: 10px;">🔗 Ricette Correlate:</h3>
                    <ul style="list-style: none;">
                    ${ricetteCollegate.map(link => `
                        <li style="margin-bottom: 5px;">
                            <a href="#" onclick="event.preventDefault(); window.naviga('ricetta', ${link.id})" style="text-decoration: none; color: #2c3e50;">
                            ${link.titolo}
                            </a>
                        </li>
                    `).join('')}
                    </ul>
                </div>
                ` : ''}


                <div class="comments-section">
                    <h3>Commenti</h3>
                    <div class="comments-list">
                    ${r.commenti && r.commenti.length > 0
            ? r.commenti.map(c => `
                            <div class="comment-card-aside" style="background: #fff; margin-bottom: 10px; padding: 10px; border-left: 4px solid orange;">
                                <p>${c.contenuto}</p>
                                <small>${c.autore} - ${new Date(c.data_commento).toLocaleDateString()}</small>
                            </div>
                            `).join('')
            : '<p style="color: #666; font-style: italic;">Ancora nessun commento.</p>'
        }
                    </div >
                </div >
            </main >
        </div >
    </div > `;
}

// Funzione per generare una versione testuale pulita e copiarla negli appunti
function copiaVersioneTesto() {
    const titoloEl = document.querySelector('.recipe-header-centered h1');
    const titolo = titoloEl ? titoloEl.innerText.trim() : "Ricetta";
    const ingredienti = Array.from(document.querySelectorAll('.ingredient-item'))
        .map(el => "- " + el.innerText.replace(/\s+/g, ' ').trim())
        .join('\n');
    const esecuzione = document.getElementById('exec-to-copy').innerText;

    const testoFinale = `📖 ${titolo} \n\n🛒 INGREDIENTI: \n${ingredienti} \n\n👨‍🍳 PREPARAZIONE: \n${esecuzione} `;

    navigator.clipboard.writeText(testoFinale).then(() => {
        alert("Versione testuale copiata negli appunti!");
    });
}

export async function saveComment(idRicetta) {
    const autoreRaw = document.getElementById('new-comment-author').value.trim();
    const testoRaw = document.getElementById('new-comment-text').value.trim();

    // Trasforma la prima lettera in Maiuscolo e attacca il resto della stringa originale
    const autore = autoreRaw ? autoreRaw.charAt(0).toUpperCase() + autoreRaw.slice(1) : "";
    const testo = testoRaw ? testoRaw.charAt(0).toUpperCase() + testoRaw.slice(1) : "";
    if (!testo || !autore) { alert("Inserisci nome e commento!"); return; }
    const { error } = await _supabase.from('commenti').insert([{ fk_ricetta: idRicetta, autore: autore, contenuto: testo, data_commento: new Date().toISOString() }]);
    if (error) alert("Errore: " + error.message);
    else { document.getElementById('new-comment-text').value = ''; showRicetta(idRicetta); }
}

export async function segnaComeStampata(id) {
    // 1. Preleviamo lo stato attuale direttamente dal DB per essere sicuri al 100%
    const { data: ricetta } = await _supabase
        .from('ricette')
        .select('stampata')
        .eq('pk_ricetta', id)
        .single();

    // 2. Invertiamo lo stato recuperato dal DB
    const nuovoStato = !ricetta.stampata;

    // 3. Eseguiamo l'aggiornamento
    const { error } = await _supabase
        .from('ricette')
        .update({ stampata: nuovoStato })
        .eq('pk_ricetta', id);

    if (error) {
        alert("Errore nell'aggiornamento: " + error.message);
    } else {
        // 4. Invece di ricaricare tutto, cambiamo solo l'aspetto del tasto al volo
        // Questo garantisce che l'utente veda subito il cambio senza attendere ricaricamenti
        const btn = document.querySelector('.btn-action-stampata');
        if (btn) {
            btn.classList.toggle('already-printed', nuovoStato);
            btn.innerHTML = `${nuovoStato ? '✅' : '🖨️'} ${nuovoStato ? 'Rimuovi da Stampate' : 'Segna come Stampata'}`;

            // Aggiorniamo l'attributo onclick per il click successivo
            btn.setAttribute('onclick', `segnaComeStampata(${id})`);
        }
    }
}

window.salvaDataPianificata = async (data, idRicetta) => {
    if (!data) return;
    const { error } = await _supabase
        .from('calendario_pianificazione')
        .insert([{ fk_ricetta: idRicetta, data_pianificata: data }]);

    if (error) alert(error.message);
    else alert("Pianificata con successo!");
};

window.attivaModificaDosi = (porzioniOriginali) => {
    const lista = document.getElementById('lista-ingredienti');
    if (!lista) return;
    const nOriginale = (porzioniOriginali && !isNaN(porzioniOriginali)) ? parseFloat(porzioniOriginali) : 1;

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
            input.onblur = () => ricalcolaDaIngrediente(index, nOriginale);

            wrapper.appendChild(input);
        }

        input.value = valoreAttuale;
        input.style.display = 'inline-block';
    });

    // Aggiunta campo porzioni (se non esiste)
    if (!document.getElementById('input-porzioni')) {
        const box = document.querySelector('.ingredients-box');
        const divPorzioni = document.createElement('div');
        const displayStatico = document.getElementById('display-porzioni');
        let testoOriginale = displayStatico.innerText || 'porzioni';

        if (displayStatico && displayStatico.innerText.trim() !== "") {
            // Puliamo il testo statico per estrarre solo la parola descrittiva
            testoOriginale = displayStatico.innerText
                .replace('Dosi per:', '')
                .replace(porzioniOriginali, '')
                .trim();
        }
        if (!testoOriginale) testoOriginale = 'porzioni';

        if (displayStatico) displayStatico.style.display = 'none';

        divPorzioni.className = "portions-edit-area";
        divPorzioni.innerHTML = `
        <div style = "margin: 10px 0; font-size: 0.9rem; font-weight: bold;" >
            Dosi: <input type="number" id="input-porzioni" class="no-arrows" value="${nOriginale}"
                onkeydown="if(event.key==='Enter') { this.blur(); }"
                onblur="ricalcolaDaPorzioni(this.value, ${nOriginale})">
                <input type="text" id="input-testo-porzioni" 
                       style="width: 100px; padding: 3px; border: 1px solid #ccc; border-radius: 4px;" 
                       value="${testoOriginale}">
            </div>`;
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

export async function pianificaOggi(id) {
    //problemi con fuso orario  
    const oggi = new Date().toISOString().split('T')[0];
    /*  const oggiLocale = new Date();
      const anno = oggiLocale.getFullYear();
      const mese = String(oggiLocale.getMonth() + 1).padStart(2, '0');
      const giorno = String(oggiLocale.getDate()).padStart(2, '0');
      const oggi = `${anno}-${mese}-${giorno}`;*/
    const { error } = await _supabase
        .from('calendario_pianificazione')
        .insert([{ fk_ricetta: id, data_pianificata: oggi }]);

    if (error) alert("Errore: " + error.message);
    else alert("Ricetta aggiunta a oggi!");
};


export async function eliminaRicetta(id) {
    if (!confirm("Sei sicuro di voler eliminare definitivamente questa ricetta?")) return;

    // Elimina prima i legami degli ingredienti (per via della foreign key)
    await _supabase.from('ingredienti_ricette').delete().eq('fk_ricetta', id);
    // Elimina i commenti
    await _supabase.from('commenti').delete().eq('fk_ricetta', id);
    // Elimina la ricetta
    const { error } = await _supabase.from('ricette').delete().eq('pk_ricetta', id);

    if (error) {
        alert("Errore durante l'eliminazione: " + error.message);
    } else {
        alert("Ricetta eliminata correttamente.");
        window.naviga('home'); // O la funzione che usi per tornare alla lista
    }
}

window.togglePreferitaDettaglio = async (id, statoAttuale) => {
    const nuovoStato = !statoAttuale;
    const { error } = await _supabase.from('ricette').update({ preferita: nuovoStato }).eq('pk_ricetta', id);
    if (error) { alert(error.message); } else { showRicetta(id); }
};

/* da sistemare*/
export async function clonaRicetta(id) {
    // 1. Recupero dati completi come facciamo nella showRicetta
    const { data: r, error } = await _supabase
        .from('ricette')
        .select(`*, ingredienti_ricette(quant, dettagli, fk_ingrediente, fk_misura, ingredienti(ingrediente))`)
        .eq('pk_ricetta', id)
        .single();

    if (error) {
        alert("Errore nel recupero dei dati per la clonazione: " + error.message);
        return;
    }
    // funzione interna per separare i tempi
    const formatTime = (t) => {
        if (!t || t === "00:00:00") return { h: 0, m: 0 };
        const parti = t.split(':');
        const h = parseInt(parti[0]);
        const m = parseInt(parti[1]);
        if (h > 0 && m > 0) return { h: h, m: m };
        if (h > 0) return { h: h, m: 0 };
        return { h: 0, m: m };
    };
    // 2. Prepariamo l'oggetto per il clone (pulizia dati univoci)
    const tempoPreparazione = formatTime(r.tempo_preparazione);
    const tempoCottura = formatTime(r.tempo_cottura);
    const tempoAgg = formatTime(r.tempo_agg);
    console.log("Tempi formattati:", { tempoPreparazione, tempoCottura, tempoAgg });

    const datiClonati = {
        titolo: r.titolo,
        esecuzione: r.esecuzione,
        fk_cat: r.fk_cat,
        n_porzioni: r.n_porzioni,
        porzioni: r.porzioni,
        cottura: r.cottura,
        tempo_cottura_h: tempoCottura.h,
        tempo_cottura_m: tempoCottura.m,
        tempo_attesa_h: tempoAgg.h,
        tempo_attesa_m: tempoAgg.m,
        tempo_preparazione_h: tempoPreparazione.h,
        tempo_preparazione_m: tempoPreparazione.m,
        etnica: r.etnica,
        diff: r.diff,
        // Mappatura ingredienti per il formato richiesto dal form
        ingredienti_ricette: r.ingredienti_ricette.map(ing => ({
            quant: ing.quant,
            dettagli: ing.dettagli,
            fk_misura: ing.fk_misura,
            ingrediente: ing.ingredienti?.ingrediente
        }))
    };

    console.log("Dati pronti per il clone:", datiClonati);

    // 3. Apriamo il form passando null come ID (nuova ricetta) e i dati
    showForm(null, datiClonati);
}