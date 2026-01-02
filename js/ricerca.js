import { _supabase, app } from './config.js';

let selectedIncludes = [];
let selectedExcludes = [];
export async function showSearch() {
    app.innerHTML = `<div class="loader">Preparazione filtri...</div>`;

    // Recuperiamo categorie e tipi di cottura esistenti
    const [resCat, resCottura, resPaesi] = await Promise.all([
        _supabase.from('categorie').select('*').order('Ordine_Query'),
        _supabase.from('ricette').select('Cottura').not('Cottura', 'is', null),
        _supabase.from('ricette').select('Etnica').not('Etnica', 'is', null)
    ]);

    // Pulizia Cottura e Paesi (Unique values)
    const tipiCottura = [...new Set(resCottura.data.map(r => r.Cottura))].sort();
    const paesiEtnici = [...new Set(resPaesi.data.map(r => r.Etnica))].filter(p => p && p.trim() !== "").sort();

    app.innerHTML = `
        <div class="search-form-container">
            <button class="btn-toggle-filters" onclick="document.querySelector('.search-filters-content').classList.toggle('open')">
                🔍 Filtri di Ricerca (Clicca per aprire/chiudere)
            </button>
            <div class="search-filters-content open">
                <h1>Ricerca Avanzata</h1>
                
                <div class="search-flex">
                    <div class="filter-group">
                        <label>Titolo</label>
                        <input type="text" id="s-titolo" placeholder="Cerca nel titolo...">
                    </div>
                    <div class="filter-group">
                        <label>Portata</label>
                        <select id="s-categoria">
                            <option value="">Tutte le portate</option>
                            ${(() => {
            const gruppi = {};
            resCat.data.forEach(c => {
                if (!gruppi[c.Categoria]) gruppi[c.Categoria] = [];
                if (c.Sottocategoria) gruppi[c.Categoria].push(c);
            });

            return Object.keys(gruppi).map(catNome => {
                const primoElemento = resCat.data.find(x => x.Categoria === catNome);
                const macroOrdine = primoElemento.Ordine_Query.toString().charAt(0);

                return `
                                    <optgroup label="${catNome.toUpperCase()}" style="font-weight: bold;">
                                        <option value="${macroOrdine}" style="font-weight: bold;">Tutti (${catNome.toLowerCase()})</option>
                                        ${gruppi[catNome].map(s => `
                                        <option value="${s.Ordine_Query}">&nbsp;&nbsp;&nbsp;${s.Sottocategoria}</option>
                                    `).join('')}
                                    </optgroup>
                                    `;
            }).join('');
        })()}
                        </select>
                    </div>
                </div>

                <div class="search-flex">
                    <div class="filter-group">
                        <label>Autore</label>
                        <input type="text" id="s-autore" placeholder="Nome autore...">
                    </div>
                    <div class="filter-group">
                        <label>Paese</label>
                        <select id="s-paese">
                            <option value="">Tutti i paesi</option>
                            ${paesiEtnici.map(p => `<option value="${p}">${p}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="search-flex">
                    <div class="filter-group">
                        <label>Metodo di Cottura</label>
                        <select id="s-metodo-cottura">
                            <option value="">Tutti</option>
                            ${tipiCottura.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Tempo Cottura</label>
                        <select id="s-tempo-cottura">
                            <option value="">Qualsiasi</option>
                            <option value="15">Velocissima (< 15 min)</option>
                            <option value="30">Rapida (< 30 min)</option>
                            <option value="60">Media (< 1 ora)</option>
                            <option value="120">Lunga (> 1 ora)</option>
                        </select>
                    </div>
                </div>

                <div class="search-flex">
                    <div class="filter-group">
                        <label>Tempo Totale (Preparazione + Cottura + Altri Passaggi)</label>
                        <select id="s-tempo-totale">
                            <option value="">Qualsiasi</option>
                            <option value="30">Sotto i 30 min</option>
                            <option value="60">Sotto 1 ora</option>
                            <option value="120">Sotto 2 ore</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Voto Minimo</label>
                         <select id="s-voto">
                            <option value="0">Tutti i voti</option>
                            <option value="1">Almeno 1 ⭐</option>
                            <option value="3">Almeno 3 ⭐⭐⭐</option>
                            <option value="5">Solo 5 ⭐⭐⭐⭐⭐</option>
                        </select>
                    </div>
                </div>

                <div class="search-flex">
                    <div class="filter-group">
                        <label>Ingredienti SI</label>
                        <input type="text" id="input-inc" placeholder="Includi..." onkeyup="handleIngSearch(this, 'include')">
                        <div id="res-include" class="dropdown-results"></div>
                        <div id="tags-include" class="tags-container"></div>
                    </div>
                    <div class="filter-group">
                        <label>Ingredienti NO</label>
                        <input type="text" id="input-exc" placeholder="Evita..." onkeyup="handleIngSearch(this, 'exclude')">
                        <div id="res-exclude" class="dropdown-results"></div>
                        <div id="tags-exclude" class="tags-container"></div>
                    </div>
                </div>

                <div class="search-flex checkboxes">
                    <div style="display: flex; gap: 20px;">
                        <label><input type="checkbox" id="s-stampate"> Solo stampate</label>
                    </div>
                </div>

               <button class="btn-search-main" onclick="eseguiRicerca()">
                <span>🔍</span> TROVA RICETTE
                </button>
            </div>
            <div id="search-results-list" class="recipe-grid"></div>
        </div>
    `;

    // gestione invio con Enter nelle caselle di input
    const searchInputs = document.querySelectorAll('.search-filters-content input, .search-filters-content select');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Evita il refresh della pagina
                eseguiRicerca();
            }
        });
    });
    const lastResults = localStorage.getItem('lastSearch');
    if (lastResults) {
        const filtrati = JSON.parse(lastResults);
        const container = document.getElementById('search-results-list');
        if (container && filtrati.length > 0) {
            renderRisultati(filtrati, container);
        }
    }
    const lastFilters = localStorage.getItem('lastFilters');
    if (lastFilters) {
        const f = JSON.parse(lastFilters);
        // Ripristiniamo i valori nei campi se esistono
        if (document.getElementById('s-titolo')) document.getElementById('s-titolo').value = f.titolo || "";
        if (document.getElementById('s-autore')) document.getElementById('s-autore').value = f.autore || "";
        if (document.getElementById('s-paese')) document.getElementById('s-paese').value = f.paese || "";
        if (document.getElementById('s-categoria')) document.getElementById('s-categoria').value = f.categoria || "";
        if (document.getElementById('s-metodo-cottura')) document.getElementById('s-metodo-cottura').value = f.cottura || "";
        if (document.getElementById('s-tempo-cottura')) document.getElementById('s-tempo-cottura').value = f.tempo_cottura || "";
        if (document.getElementById('s-tempo-totale')) document.getElementById('s-tempo-totale').value = f.tempo_totale || "";
        if (document.getElementById('s-stampate')) document.getElementById('s-stampate').checked = f.stampate || false;
        if (document.getElementById('s-voto')) document.getElementById('s-voto').value = f.voto || "0";

    }
    renderTags('include');
    renderTags('exclude');
}

export async function eseguiRicerca() {
    const container = document.getElementById('search-results-list');
    container.innerHTML = '<div class="loader">Ricerca in corso...</div>';

    try {
        const titolo = document.getElementById('s-titolo').value;
        const autore = document.getElementById('s-autore').value;
        const etnica = document.getElementById('s-paese').value;
        const catVal = document.getElementById('s-categoria').value; // Ordine_Query
        const metodo = document.getElementById('s-metodo-cottura').value;
        const tCotturaMax = document.getElementById('s-tempo-cottura').value;
        const tTotaleMax = document.getElementById('s-tempo-totale').value;
        const stampate = document.getElementById('s-stampate').checked;
        const votoMin = document.getElementById('s-voto').value;

        let query = _supabase
            .from('ricette')
            .select(`
                pkRicetta, Titolo, Autore, Voto, Immagine, Cottura, Etnica, stampata,
                Tempo_cottura, Tempo_preparazione, Tempo_agg,
                categorie!inner(Categoria, Sottocategoria, Ordine_Query),
                ingredienti_ricette(fkIngrediente, Quant)
            `);

        // Filtri Supabase
        if (titolo) query = query.ilike('Titolo', `%${titolo}%`);
        if (autore) query = query.ilike('Autore', `%${autore}%`);
        if (etnica) query = query.eq('Etnica', etnica);
        if (metodo) query = query.eq('Cottura', metodo);
        if (votoMin > 0) query = query.gte('Voto', votoMin);
        if (stampate) query = query.eq('stampata', true);

        // Logica Categoria (Ordine_Query)
        if (catVal) {
            if (catVal.length === 1) {
                // È una macro categoria (es. "6"), cerchiamo tutte quelle che iniziano con 6
                query = query.gte('categorie.Ordine_Query', parseInt(catVal * 10))
                    .lt('categorie.Ordine_Query', parseInt((parseInt(catVal) + 1) * 10));
            } else {
                // È una sottocategoria specifica (es. "63")
                query = query.eq('categorie.Ordine_Query', catVal);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        // Filtri Locali (Ingredienti e Tempi)
        const filtrati = data.filter(r => {
            // Filtro Tempi
            const minCottura = convertiInMinuti(r.Tempo_cottura);
            const minPrep = convertiInMinuti(r.Tempo_preparazione);
            const minAgg = convertiInMinuti(r.Tempo_agg);
            const minTotale = minCottura + minPrep + minAgg;

            if (tCotturaMax) {
                const soglia = parseInt(tCotturaMax);
                if (soglia === 120) {
                    if (minCottura < 60) return false;
                } else if (minCottura > soglia) {
                    return false;
                }
            }
            // Filtro Tempo Totale
            if (tTotaleMax && minTotale > parseInt(tTotaleMax)) {
                return false;
            }
            // Altri filtri già esistenti
            const idsPresenti = (r.ingredienti_ricette || []).map(ir => Number(ir.fkIngrediente));
            if (selectedExcludes.some(ex => idsPresenti.includes(Number(ex.id)))) return false;
            for (let inc of selectedIncludes) {
                const trovato = r.ingredienti_ricette?.find(ir => Number(ir.fkIngrediente) === Number(inc.id));
                if (!trovato) return false;
                if (inc.qMin !== null && trovato.Quant < inc.qMin) return false;
                if (inc.qMax !== null && trovato.Quant > inc.qMax) return false;
            }
            return true;
        });
        localStorage.setItem('lastSearch', JSON.stringify(filtrati)); // Salva i risultati
        // salva i filtri impostati
        const filtriDaSalvare = {
            titolo: document.getElementById('s-titolo').value,
            autore: document.getElementById('s-autore').value,
            categoria: document.getElementById('s-categoria').value,
            paese: document.getElementById('s-paese').value,
            cottura: document.getElementById('s-metodo-cottura').value,
            tempo_cottura: document.getElementById('s-tempo-cottura').value,
            tempo_totale: document.getElementById('s-tempo-totale').value,
            stampate: document.getElementById('s-stampate').checked,
            voto: document.getElementById('s-voto').value
        };
        localStorage.setItem('lastFilters', JSON.stringify(filtriDaSalvare));
        renderRisultati(filtrati, container);

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Errore durante la ricerca.</p>";
    }

}

function renderRisultati(filtrati, container) {
    if (filtrati.length === 0) {
        container.innerHTML = "<p>Nessuna ricetta trovata.</p>";
        return;
    }

    const gruppi = {};
    filtrati.forEach(r => {
        // Estraiamo il nome della categoria e l'ordine
        const catNome = r.categorie?.Categoria || 'Altro';
        const catOrdine = r.categorie?.Ordine_Query || 999;

        if (!gruppi[catNome]) {
            gruppi[catNome] = {
                ricette: [],
                ordine: catOrdine
            };
        }
        gruppi[catNome].ricette.push(r);
    });

    // Ordiniamo le categorie in base all'Ordine_Query del database
    const categorieOrdinate = Object.keys(gruppi).sort((a, b) => gruppi[a].ordine - gruppi[b].ordine);

    // Logica auto-open
    const autoOpen = (filtrati.length === 1 || categorieOrdinate.length === 1) ? 'open' : '';

    // In ricerca.js -> funzione renderRisultati
    container.innerHTML = `
    <div class="results-count">Trovate ${filtrati.length} ricette</div>
    ${categorieOrdinate.map(cat => `
        <details class="category-accordion" ${autoOpen}>
            <summary class="category-summary">
                <span class="cat-title">${cat}</span>
                <span class="cat-count-badge">${gruppi[cat].ricette.length}</span>
                <span class="cat-icon">▼</span>
            </summary>
            <div class="recipe-grid">
                ${gruppi[cat].ricette.map(r => renderRecipeCard(r)).join('')}
            </div>
        </details>
    `).join('')}
`;

    document.querySelector('.search-filters-content')?.classList.remove('open');
}
// --- FUNZIONI PER GESTIONE INGREDIENTI (Sincronizzate con window) ---

export async function handleIngSearch(input, type) {
    const query = input.value.trim();
    const resDiv = document.getElementById(`res-${type}`);
    if (query.length < 2) { resDiv.innerHTML = ''; return; }

    const { data } = await _supabase.from('ingredienti').select('*').ilike('Ingrediente', `%${query}%`).limit(10);

    // Usiamo le virgolette doppie per l'HTML e le singole con escape per il JS
    resDiv.innerHTML = data.map(i => {
        const nomePulito = i.Ingrediente.replace(/'/g, "\\'");
        return `<div class="suggestion-item" onclick="addTag(${i.pkIngrediente}, '${nomePulito}', '${type}')">${i.Ingrediente}</div>`;
    }).join('');
}

export function addTag(id, nome, type) {
    // 1. Identifica la lista corretta (Includi o Escludi) basandosi su 'type'
    const list = type === 'include' ? selectedIncludes : selectedExcludes;

    // 2. Aggiungi l'ingrediente se non è già presente
    if (!list.find(x => x.id === id)) {
        list.push({ id, nome, qMin: null, qMax: null });
        renderTags(type);
    }

    // 3. PULIZIA FORZATA: Usiamo gli ID precisi definiti nel tuo HTML
    // Se type è 'include', l'ID è 'input-inc' (o 'input-include'), controlliamo entrambi
    const inputId = type === 'include' ? 'input-inc' : 'input-exc';
    const inputEl = document.getElementById(inputId);
    const resDiv = document.getElementById(`res-${type}`);

    if (inputEl) {
        inputEl.value = ''; // Cancella il testo
        inputEl.focus();   // Riporta il cursore nel box
    }

    if (resDiv) {
        resDiv.innerHTML = ''; // Nasconde i suggerimenti
    }
}

export function removeTag(id, type) {
    if (type === 'include') {
        selectedIncludes = selectedIncludes.filter(x => x.id !== id);
    } else {
        selectedExcludes = selectedExcludes.filter(x => x.id !== id);
    }
    renderTags(type);
}

export function openQtaPrompt(id) {
    const item = selectedIncludes.find(x => x.id === id);
    if (!item) return;

    const min = prompt(`Quantità minima per ${item.nome}:`, item.qMin || '');
    const max = prompt(`Quantità massima per ${item.nome}:`, item.qMax || '');

    item.qMin = min !== '' && min !== null ? Number(min) : null;
    item.qMax = max !== '' && max !== null ? Number(max) : null;
    renderTags('include');
}

export function renderTags(type) {
    const list = type === 'include' ? selectedIncludes : selectedExcludes;
    const container = document.getElementById(`tags-${type}`);
    if (!container) return;

    container.innerHTML = list.map(t => `
        <span class="tag-pill">
            ${type === 'include' ? `<button class="btn-qta" onclick="openQtaPrompt(${t.id})">⚖️</button>` : ''}
            <span class="tag-name">${t.nome}</span>
            ${t.qMin || t.qMax ? `<small class="tag-qta-label">${t.qMin || 0}-${t.qMax || '∞'}</small>` : ''}
            <span class="tag-remove" onclick="removeTag(${t.id}, '${type}')">✖</span>
        </span>
    `).join('');
}

export function clearSearch() {
    localStorage.removeItem('lastSearch');
    localStorage.setItem('lastFilters', JSON.stringify({}));
    // Se vuoi resettare anche gli ingredienti:
    selectedIncludes = [];
    selectedExcludes = [];
}