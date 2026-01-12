// --- FUNZIONE PER APRIRE IL DIALOGO DI COLLEGAMENTO ---
import { _supabase, app } from './config.js';
export async function apriCollegamento(idPartenza, titoloPartenza) {
    // Creiamo il contenitore del popup se non esiste
    let modal = document.getElementById('modal-collega');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-collega';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content">
            <h3>Collega ricetta a: "${titoloPartenza}"</h3>
            
            <div class="filter-group">
                <label>Cerca ricetta da collegare</label>
                <input type="text" id="cerca-ricetta-link" placeholder="Scrivi il titolo..." autocomplete="off">
                <div id="risultati-link" class="autocomplete-results"></div>
            </div>

            <div style="margin: 15px 0;">
                <label>
                    <input type="checkbox" id="link-bidirezionale"> Collegamento bidirezionale (A↔B)
                </label>
            </div>

            <input type="hidden" id="id-ricetta-dest">
            
            <div class="modal-actions">
                <button class="btn-salva" onclick="salvaLegame(${idPartenza})">Conferma Legame</button>
                <button class="btn-delete" onclick="chiudiModal()">Annulla</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';

    // Logica ricerca incrementale (Debounce)
    const input = document.getElementById('cerca-ricetta-link');
    input.addEventListener('input', e => ricercaRicettePerLink(e.target.value, idPartenza));
}

async function ricercaRicettePerLink(testo, idEscluso) {
    if (testo.length < 2) return;

    const { data } = await _supabase
        .from('ricette')
        .select('pk_ricetta, titolo')
        .ilike('titolo', `%${testo}%`)
        .neq('pk_ricetta', idEscluso) // Non collegare a se stessa
        .limit(5);

    const container = document.getElementById('risultati-link');
    container.innerHTML = data.map(r => `
        <div class="result-item" onclick="selezionaRicettaLink(${r.pk_ricetta}, '${r.titolo.replace(/'/g, "\\'")}')">
            ${r.titolo}
        </div>
    `).join('');
}

window.selezionaRicettaLink = (id, titolo) => {
    document.getElementById('cerca-ricetta-link').value = titolo;
    document.getElementById('id-ricetta-dest').value = id;
    document.getElementById('risultati-link').innerHTML = '';
};

export async function salvaLegame(id1) {
    const id2 = parseInt(document.getElementById('id-ricetta-dest').value) || null;
    const isDoppio = document.getElementById('link-bidirezionale').checked;
    console.log({ id1, id2, isDoppio });

    if (!id2) {
        alert("Seleziona una ricetta dalla lista!");
        return;
    }

    const { error } = await _supabase
        .from('link_ricette')
        .insert([{ fk_ric1: id1, fk_ric2: id2, doppio: isDoppio }]);

    if (error) {
        alert("Errore: " + error.message);
    } else {
        alert("Collegamento creato!");
        chiudiModal();
        // Opzionale: ricarica la pagina del dettaglio per vedere il link
        window.naviga('ricetta', id1);
    }
}

window.chiudiModal = () => {
    document.getElementById('modal-collega').style.display = 'none';
};

window.salvaLegame = salvaLegame;
window.chiudiModal = chiudiModal;