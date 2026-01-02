import { _supabase, app } from './config.js';

let selectedIncludes = [];
let selectedExcludes = [];

export async function showSearch() {
    selectedIncludes = [];
    selectedExcludes = [];

    app.innerHTML = `<div class="loader">Preparazione filtri...</div>`;

    // 1. Recupero dati per i menu a tendina
    const [resCat, resCottura, resPaesi] = await Promise.all([
        _supabase.from('categorie').select('*').order('Ordine_Query'),
        _supabase.from('ricette').select('Cottura').not('Cottura', 'is', null),
        _supabase.from('ricette').select('Etnica').not('Etnica', 'is', null)
    ]);

    // 2. Pulizia valori unici per Cottura e Paesi
    const tipiCottura = [...new Set(resCottura.data.map(r => r.Cottura))].sort();
    const paesiEtnici = [...new Set(resPaesi.data.map(r => r.Etnica))].filter(p => p && p.trim() !== "").sort();

    // 3. Generazione HTML
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
                        <select id="s-portata">
                            <option value="">Tutte</option>
                            ${resCat.data.map(c => `<option value="${c.pkCategoria}">${c.Categoria} - ${c.Sottocategoria || ''}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Cottura</label>
                        <select id="s-cottura">
                            <option value="">Tutte</option>
                            ${tipiCottura.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
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
                        <label>Voto Minimo</label>
                        <select id="s-voto">
                            <option value="0">Qualsiasi</option>
                            <option value="1">⭐+</option>
                            <option value="2">⭐⭐+</option>
                            <option value="3">⭐⭐⭐+</option>
                            <option value="4">⭐⭐⭐⭐+</option>
                            <option value="5">⭐⭐⭐⭐⭐</option>
                        </select>
                    </div>
                    <div class="filter-group" style="flex: 2;">
                        <label>Ingredienti (Includi o Escludi)</label>
                        <div class="ing-search-wrapper">
                            <input type="text" id="ing-input" placeholder="Scrivi ingrediente..." oninput="handleIngSearch(this.value)">
                            <div id="ing-results" class="suggestions"></div>
                        </div>
                    </div>
                </div>

                <div class="tags-container">
                    <div id="tags-include" class="tag-group"></div>
                    <div id="tags-exclude" class="tag-group"></div>
                </div>

                <button class="btn-search-execute" onclick="eseguiRicerca()">AVVIA RICERCA</button>
            </div>
            
            <div id="search-results-container" class="results-grid">
                </div>
        </div>
    `;
}

// IL RESTO DELLE FUNZIONI (handleIngSearch, eseguiRicerca, ecc.) RIMANE INVARIATO
// Assicurati che siano presenti nel file sotto la funzione showSearch