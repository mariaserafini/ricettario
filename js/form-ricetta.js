import { _supabase, app } from './config.js';
let misureGlobali = [];
// 4. Funzione interna per aggiungere righe ingredienti
window.addIngredienteRow = (data = null) => {

    console.log(
        data ? "Riga ingrediente precompilata:" : "Riga ingrediente vuota",
        data
    );
    const container = document.getElementById('ingredients-rows-container');
    if (!container) return;
    const row = document.createElement('div');
    row.className = 'search-flex ingredient-row';
    row.style.alignItems = 'flex-end';
    row.style.marginBottom = '10px';

    const opzioniMisure = misureGlobali.map(m => `
        <option value="${m.pk_misura}" ${data?.fk_misura == m.pk_misura ? 'selected' : ''}>
            ${m.misura}
        </option>
    `).join('');
    row.innerHTML = `
        <div class="filter-group" style="flex:2">
            <label>Ingrediente</label>
            <input type="text" class="ing-nome" 
                   placeholder="Ingrediente" 
                   list="lista-ingredienti-esistenti" 
                   value="${data?.ingredienti?.ingrediente || data?.ingrediente || ''}">
        </div>

        <div class="filter-group" style="flex:0.5">
            <label>Q.tà</label>
            <input type="number" step="any" class="ing-qta" 
                   placeholder="Q.tà" 
                   value="${data?.quant || ''}">
        </div>

        <div class="filter-group" style="flex:1">
            <label>Misura</label>
            <select class="ing-misura">
                <option value="">--</option>
                ${opzioniMisure}
            </select>
        </div>

        <div class="filter-group" style="flex:1">
            <label>Note</label>
            <input type="text" class="ing-dettagli" 
                   placeholder="es. tritata" 
                   value="${data?.dettagli || ''}">
        </div>

        <button type="button" onclick="this.parentElement.remove()" 
                style="background:none; border:none; cursor:pointer; font-size:1.5rem; color:#e74c3c; margin-bottom:10px;"
                title="Rimuovi riga">
            &times;
        </button>
    `;
    container.appendChild(row);
};

export async function showForm(id = null, prefillData = null) {
    console.log("DEBUG FORM - Dati ricevuti dal modulo import:", prefillData);
    app.innerHTML = `<div class="loader">Preparazione modulo...</div>`;

    // 1. Caricamento dati di supporto (Categorie, Difficoltà, ecc.)
    const [resCat, resMisure, resTuttiIng, resEtnica, resCottura] = await Promise.all([
        _supabase.from('categorie').select('*').order('ordine_query'),
        _supabase.from('misure').select('*').order('misura'),
        _supabase.from('ingredienti').select('*').order('ingrediente'),
        _supabase.from('ricette').select('etnica').not('etnica', 'is', null),
        _supabase.from('ricette').select('cottura').not('cottura', 'is', null)
    ]);
    misureGlobali = resMisure.data;

    // Creiamo liste uniche per i suggerimenti
    const listaEtnica = [...new Set(resEtnica.data.map(r => r.etnica))].filter(Boolean).sort();
    const listaCottura = [...new Set(resCottura.data.map(r => r.cottura))].filter(Boolean).sort();
    let r = {
        titolo: '',
        esecuzione: '',
        n_porzioni: null,
        porzioni: null,
        tempo_cottura: null,
        tempo_preparazione: null,
        tempo_agg: null,
        fk_cat: null,
        etnica: null,
        immagine: '',
        diff: null,
        cottura: null,
        autore: '',
        ingredienti_ricette: [], // Fondamentale che sia un array vuoto
        note: ''
    };

    let tCottura = { h: '', m: '' };
    let tAgg = { h: '', m: '' };
    let tPrep = { h: '', m: '' };

    const getHM = (timeStr) => {
        if (!timeStr) return { h: '', m: '' };
        const parts = timeStr.split(':');
        return { h: parseInt(parts[0]), m: parseInt(parts[1]) };
    };

    // 2. Se è una modifica, scarichiamo i dati dal DB
    if (id && !prefillData) {

        const { data, error } = await _supabase
            .from('ricette')
            .select(`*, ingredienti_ricette(*, ingredienti(ingrediente))`)
            .eq('pk_ricetta', id)
            .order('quant', {
                foreignTable: 'ingredienti_ricette',
                ascending: false,
                nullsFirst: false
            })
            .single();
        if (!error) r = data;

        tCottura = getHM(r.tempo_cottura);
        tPrep = getHM(r.tempo_preparazione);
        tAgg = getHM(r.tempo_aggiuntivo);

    } else if (prefillData) {
        // Mappiamo i dati dal parser al formato del form
        r.titolo = prefillData.titolo;
        r.esecuzione = prefillData.esecuzione;
        r.fk_cat = prefillData.fk_cat;
        r.cottura = prefillData.cottura;
        tCottura = {
            h: parseInt(prefillData.tempo_cottura_h) || "",
            m: parseInt(prefillData.tempo_cottura_m) || ""
        };
        tAgg = {
            h: parseInt(prefillData.tempo_attesa_h) || "",
            m: parseInt(prefillData.tempo_attesa_m) || ""
        };
        tPrep = {
            h: "",
            m: ""
        };
        r.n_porzioni = prefillData.n_porzioni
        r.porzioni = prefillData.porzioni

        // Trasformiamo gli ingredienti nel formato che le tue righe del form leggono

        // 1. MAPPA GLI INGREDIENTI (Rimuovi la riga 'const misuraTrovata' che avevi prima di questa)
        r.ingredienti_ricette = (prefillData.ingredienti_ricette || []).map(i => {

            // 2. Definiamo e normalizziamo il testo dell'unità
            let testoUnita = i.unita_testo?.toLowerCase().trim() || "";

            // Piccola correzione: se l'utente scrive 'g', noi cerchiamo 'gr' (o viceversa, dipende dal tuo DB)
            if (testoUnita === 'g') testoUnita = 'gr';

            if (testoUnita === 'chilogrammi' || testoUnita === 'kg') {
                testoUnita = 'gr'; // o 'kg' se preferisci, l'importante è che corrisponda al DB
                i.quant = parseFloat(i.quant) * 1000;
            }

            // 3. ORA cerchiamo nel DB usando la variabile 'testoUnita' appena preparata
            const misuraTrovata = resMisure.data.find(m =>
                m.misura && m.misura.toLowerCase() === testoUnita
            );
            return {
                ingrediente: i.ingrediente,
                quant: i.quant,
                fk_misura: misuraTrovata ? misuraTrovata.pk_misura : null,
                // Se non troviamo la misura, uniamo l'unità originale ai dettagli
                dettagli: misuraTrovata
                    ? (i.dettagli || '')
                    : [i.unita_testo, i.dettagli].filter(Boolean).join(' ')
            };
        });
    }

    // Helper per separare HH:MM in ore e minuti per i campi di testo



    // Funzione globale per gestire il click sui pallini della difficoltà
    window.setDifficolta = (val) => {
        document.getElementById('f-diff').value = val;
        const dots = document.querySelectorAll('.diff-dot-form');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index < val);
        });
    };


    // 3. Render HTML usando le classi di ricerca.js
    app.innerHTML = `
        <div class="search-form-container">
            <datalist id="lista-ingredienti-esistenti">
                ${resTuttiIng.data.map(i => `<option value="${i.ingrediente || ''}">`).join('')}
            </datalist>
            <div class="search-filters-content open">
                <h3>${id ? 'Modifica' : 'Inserimento'}</h3>
                
                <form id="recipe-form">
                    <div class="search-flex">
                        <div class="filter-group">
                            <label>Titolo</label>
                            <input type="text" id="f-titolo" value="${r.titolo || ''}" required placeholder="es. Carbonara Classica">
                        </div>
                        <div class="filter-group">
                            <label>Autore</label>
                            <input type="text" id="f-autore" value="${r.autore || ''}" placeholder="Nome dell'autore">
                        </div>
                    </div>

                    <div class="search-flex">
                        <div class="filter-group">
                            <label>Portata</label>
                            <select id="f-categoria">
                                <option value="" ${(r.fk_cat === undefined || r.fk_cat === null) ? 'selected' : ''}>
                                    -- Seleziona --
                                </option>
                                ${resCat.data.map(c => {
        // Verifichiamo se questa è la categoria selezionata
        const isSelected = r.fk_cat !== undefined && r.fk_cat !== null && String(r.fk_cat) === String(c.pk_cat);

        return `<option value="${c.pk_cat}" ${isSelected ? 'selected' : ''}>
                                        ${c.categoria} ${c.sottocategoria ? `(${c.sottocategoria})` : ''}
                                    </option>`;
    }).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Paese</label>
                            <input type="text" id="f-etnica" list="list-etnica" value="${r.etnica || ''}" placeholder="es. Italia, Messico...">
                            <datalist id="list-etnica">
                                ${listaEtnica.map(e => `<option value="${e}">`).join('')}
                            </datalist>
                        </div>
                    </div>

                    <div class="search-flex" style="margin-top:20px;">
                        <div class="filter-group">
                            <label>Difficoltà</label>
                              <div class="stars-container">
                                ${[1, 2, 3, 4, 5].map(i => `
                                    <span class="star diff-dot-form ${i <= (r.diff || 0) ? 'active' : ''}" 
                                          onclick="setDifficolta(${i})" style="cursor:pointer">●</span>
                                `).join('')}                        
                        </div>
                        <input type="hidden" id="f-diff" value="${r.diff || 0}">
                        </div>
                        <div class="filter-group">
                            <label>Cottura</label>
                             <input type="text" id="f-cottura" list="list-cottura" value="${r.cottura || ''}" placeholder="es. Forno, Padella...">
                            <datalist id="list-cottura">
                                ${listaCottura.map(c => `<option value="${c}">`).join('')}
                            </datalist>
                        </div>
                    </div>

                    <div class="ingredients-management" style="margin-top:30px;">
                        <h3>Ingredienti</h3>
                         <div style="display:flex; gap:10px; align-items: center;">
                                <label style="font-weight:bold">Porzioni:</label>
                                <input type="number" id="f-porzioni-qta" value="${r.n_porzioni || ''}" placeholder="n°" style="width:60px; padding:5px;">
                                <input type="text" id="f-porzioni-tipo" value="${r.porzioni || ''}" placeholder="es. Persone" style="width:100px; padding:5px;">
                            </div>
                        </div>
                        <div id="ingredients-rows-container">
                        </div>
                        <button type="button" class="btn-toggle-filters" style="width:auto; margin-top:10px;" onclick="addIngredienteRow()">
                            + Aggiungi Ingrediente
                        </button>
                    </div>

                    <div class="filter-group" style="margin-top:30px;">
                        <label>Esecuzione / Procedimento</label>
                        <textarea id="f-esecuzione" rows="10" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc;">${r.esecuzione || ''}</textarea>
                    </div>
                    <div class="times-management" style="margin-top:20px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
                        ${[['Cottura', tCottura, 'cottura'], ['Preparazione', tPrep, 'prep'], ['Aggiuntivi', tAgg, 'agg']].map(([label, val, idPrefix]) => `
                            <div class="search-flex" style="align-items: center; margin-bottom: 10px;">
                                <div style="flex:1"><strong>Tempo ${label}:</strong></div>
                                <div style="flex:2; display:flex; gap:10px; align-items: center;">
                                    Ore: <input type="number" id="f-time-${idPrefix}-h" value="${val.h}" min="0" max="99" style="width:60px;">
                                    Minuti: <input type="number" id="f-time-${idPrefix}-m" value="${val.m}" min="0" max="59" style="width:60px;">
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="filter-group" style="margin-top:20px;">
                        <label>Foto della Ricetta</label>
                        <input type="file" id="f-foto" accept="image/*" style="padding: 10px 0;">
                        ${r.immagine ? `
        <div class="current-image-preview" style="margin-top: 10px;">
            <p style="font-size:0.8rem; color: #666; margin-bottom: 5px;">Immagine attuale:</p>
            <img src="${r.immagine}" 
                 alt="Anteprima" 
                 style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd;">
        </div>
    ` : ''}
                    </div>

                    <div class="form-actions" style="margin-top:30px; display:flex; gap:10px;">
                            <button type="button" class="btn-salva" style="flex:2" onclick="saveRicetta(event, ${id || 'null'})">💾 Salva Ricetta</button>
                            <button type="button" class="btn-salva" style="flex:2" id="btn-annulla">Annulla</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Gestione dinamica del tasto Annulla
    document.getElementById('btn-annulla').addEventListener('click', () => {
        if (id) {
            window.naviga('ricetta', id);
        } else {
            window.naviga('home');
        }
    });
    // Aggiungi questo subito prima della fine della funzione showForm
    const inputFoto = document.getElementById('f-foto');
    inputFoto.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Se esiste già una miniatura la aggiorna, altrimenti ne crea una
                let imgPreview = document.querySelector('.current-image-preview img');
                if (!imgPreview) {
                    const container = document.querySelector('.current-image-preview') || inputFoto.parentElement;
                    imgPreview = document.createElement('img');
                    imgPreview.style = "width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; margin-top:10px; display:block;";
                    container.appendChild(imgPreview);
                }
                imgPreview.src = e.target.result;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    // Riempimento righe ingredienti se già presenti (nel caso di modifica o prefill)
    const container = document.getElementById('ingredients-rows-container');
    container.innerHTML = ''; // Pulizia iniziale

    // 2. Controlla se hai dati (da Parser o da DB) e crea le righe
    if (r.ingredienti_ricette && r.ingredienti_ricette.length > 0) {
        r.ingredienti_ricette.forEach(item => {
            window.addIngredienteRow(item);
        });
    } else {
        // Se la ricetta è nuova e vuota, metti una riga vuota di default
        window.addIngredienteRow();
    }


}

export async function saveRicetta(e, id = null) {
    e.preventDefault();
    const btnSalva = e.currentTarget;
    const originalText = btnSalva.innerText;

    // 1. Validazione Campi Obbligatori
    let titolo = document.getElementById('f-titolo').value.trim();
    const autore = document.getElementById('f-autore').value.trim();
    const esecuzione = document.getElementById('f-esecuzione').value.trim();
    const rows = document.querySelectorAll('.ingredient-row');

    if (!titolo || !autore || !esecuzione || rows.length === 0) {
        alert("Errore: Titolo, Autore, Esecuzione e almeno un ingrediente sono obbligatori.");
        return;
    }
    btnSalva.disabled = true;
    btnSalva.innerText = "Salvataggio in corso...";


    try {
        titolo = titolo.charAt(0).toUpperCase() + titolo.slice(1).toLowerCase();

        // 2. Gestione Tempi (Conversione in HH:MM:SS)
        const getInterval = (idPrefix) => {
            const h = document.getElementById(`f-time-${idPrefix}-h`).value || 0;
            const m = document.getElementById(`f-time-${idPrefix}-m`).value || 0;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        };

        // GESTIONE TITOLI DUPLICATI (solo se è un NUOVO inserimento, non in modifica)

        if (!id) {
            // 1. Cerchiamo tutte le ricette che iniziano con quel titolo
            const { data: simili } = await _supabase
                .from('ricette')
                .select('titolo')
                .ilike('titolo', `${titolo}%`);

            if (simili && simili.length > 0) {
                let maxNumero = 1;
                let trovatoEsatto = false;

                simili.forEach(s => {
                    const t = s.titolo;
                    if (t.toLowerCase() === titolo.toLowerCase()) {
                        trovatoEsatto = true;
                    }
                    // Cerca il numero tra parentesi, es: "Torta di mele (3)"
                    const match = t.match(/\((\d+)\)$/);
                    if (match) {
                        const num = parseInt(match[1]);
                        if (num > maxNumero) maxNumero = num;
                    }
                });

                // Se abbiamo trovato almeno il titolo base o una versione numerata
                if (trovatoEsatto || maxNumero > 1) {
                    titolo = `${titolo} (${maxNumero + 1})`;
                }
            }
        }



        // Preparazione Oggetto Ricetta
        const ricettaData = {
            titolo,
            autore,
            esecuzione,
            etnica: document.getElementById('f-etnica').value || null,
            cottura: document.getElementById('f-cottura').value || null,
            diff: parseInt(document.getElementById('f-diff').value) || null,
            fk_cat: document.getElementById('f-categoria').value || null,
            n_porzioni: document.getElementById('f-porzioni-qta').value ? parseInt(document.getElementById('f-porzioni-qta').value) : null,
            porzioni: document.getElementById('f-porzioni-tipo').value || null,
            tempo_cottura: getInterval('cottura'),
            tempo_preparazione: getInterval('prep'),
            tempo_agg: getInterval('agg')
        };



        // SALVATAGGIO RICETTA
        let pk_ricetta = id;
        console.log("Dati inviati:", ricettaData); // Controlla se vedi "undefined" in qualche campo
        const payload = id ? { pk_ricetta: id, ...ricettaData } : ricettaData;
        const { data: savedRicetta, error: rError } = await _supabase
            .from('ricette')
            .upsert(payload) // Upsert gestisce correttamente entrambi i casi se insert o update
            .select()
            .single();

        if (rError) throw rError;
        pk_ricetta = savedRicetta.pk_ricetta;

        // Gestione Immagine (Ridimensionamento e Upload)
        let immagineUrl = null;
        const fotoInput = document.getElementById('f-foto');
        const fotoFile = fotoInput ? fotoInput.files[0] : null;
        if (fotoFile) {
            try {
                // Ridimensionamento base usando Canvas
                const compressedBlob = await resizeImage(fotoFile, 600, 600); // 600px è meglio per la qualità
                const fileExtension = fotoFile.name.split('.').pop();
                const fileName = `ric_${pk_ricetta}.${fileExtension}`;
                const { data: uploadData, error: uploadError } = await _supabase.storage
                    .from('foto-ricette')
                    .upload(fileName, compressedBlob, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicUrl } = _supabase.storage.from('foto-ricette').getPublicUrl(fileName);
                immagineUrl = publicUrl.publicUrl;
                await _supabase
                    .from('ricette')
                    .update({ immagine: immagineUrl })
                    .eq('pk_ricetta', pk_ricetta);
            } catch (err) {
                console.error("Errore caricamento foto:", err);
                alert("Errore nel caricamento della foto, ma procederò con il salvataggio dei dati.");
            }
        }

        // GESTIONE INGREDIENTI (Logica simile al tuo PHP)
        // Se è una modifica, puliamo i vecchi legami
        if (id) {
            await _supabase.from('ingredienti_ricette').delete().eq('fk_ricetta', id);
        }

        for (const row of rows) {
            let nomeIng = row.querySelector('.ing-nome').value.trim();
            if (!nomeIng) continue;
            nomeIng = nomeIng.charAt(0).toUpperCase() + nomeIng.slice(1).toLowerCase();
            const quant = row.querySelector('.ing-qta').value ? parseFloat(row.querySelector('.ing-qta').value) : null;
            const fk_misura = row.querySelector('.ing-misura').value || null;
            const dettagli = row.querySelector('.ing-dettagli').value || null;

            if (!nomeIng) continue;

            // Controlla se l'ingrediente esiste già
            let { data: ingExist } = await _supabase.from('ingredienti').select('pk_ingrediente').eq('ingrediente', nomeIng).maybeSingle();

            let fk_ingrediente;
            if (!ingExist) {
                // Inserisci nuovo ingrediente
                const { data: newIng, error: ingErr } = await _supabase.from('ingredienti').insert({ ingrediente: nomeIng }).select().single();
                if (ingErr) throw ingErr;
                fk_ingrediente = newIng.pk_ingrediente;
            } else {
                fk_ingrediente = ingExist.pk_ingrediente;
            }

            // Inserisci legame
            const { error: linkErr } = await _supabase.from('ingredienti_ricette').insert({
                fk_ricetta: pk_ricetta,
                fk_ingrediente,
                fk_misura,
                quant,
                dettagli
            });
            if (linkErr) console.error("Errore legame ingrediente:", linkErr);
        }

        alert("Ricetta salvata con successo!");
        // Reindirizzamento alla pagina della ricetta appena creata
        if (window.naviga) {
            window.naviga('ricetta', pk_ricetta);
        }

    } catch (error) {
        console.error("Errore generale:", error);
        alert("Si è verificato un errore durante il salvataggio: " + error.message); btnSalva.disabled = false;
        btnSalva.innerText = originalText;
    }
}


// Funzione Helper per ridimensionare l'immagine lato client
async function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                } else {
                    if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7); // Compressione 70%
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}


