import { _supabase, app } from './config.js';

/**
 * Visualizza il calendario settimanale
 * @param {Date} dataRiferimento - Un giorno qualsiasi della settimana da visualizzare
 */

function formattaTestoNota(testo) {
    if (!testo) return '';

    // Regex per estrarre l'URL
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const match = testo.match(urlRegex);

    if (match) {
        const url = match[0];
        // Rimuoviamo l'URL dal testo originale per vedere se rimane altro (l'etichetta)
        let label = testo.replace(url, '').trim();

        // Se dopo aver tolto l'URL non rimane testo, usiamo l'URL accorciato come label
        if (label === "") {
            label = url.length > 30 ? url.substring(0, 27) + "..." : url;
        }

        return `<a href="${url}" target="_blank" class="nota-link" onclick="event.stopPropagation()">${label}</a>`;
    }

    // Se non c'è nessun link, restituisci il testo normale
    return testo;
}

export async function showCalendario(dataRiferimento = new Date()) {
    app.innerHTML = `<div class="loader">Caricamento piano settimanale...</div>`;
    const isMobile = window.innerWidth < 768;
    const numeroGiorniMostrati = isMobile ? 3 : 7;
    let dataPartenza;

    const d = new Date(dataRiferimento);
    if (isMobile) {
        // SU MOBILE: Parte da OGGI
        dataPartenza = new Date(d);
        dataPartenza.setHours(0, 0, 0, 0);
    } else {
        // SU DESKTOP: Parte dal LUNEDÌ della settimana
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        dataPartenza = new Date(d.setDate(diff));
        dataPartenza.setHours(0, 0, 0, 0);
    }

    // Calcolo fine intervallo per la query Supabase
    const dataFine = new Date(dataPartenza);
    dataFine.setDate(dataPartenza.getDate() + (numeroGiorniMostrati - 1));
    dataFine.setHours(23, 59, 59, 999);

    // 1. Calcolo del Lunedì della settimana selezionata
    /* const d = new Date(dataRiferimento);
     const day = d.getDay(); // 0 è domenica, 1 è lunedì...
     const diff = d.getDate() - day + (day === 0 ? -6 : 1);
     const lunedi = new Date(d.setDate(diff));
     lunedi.setHours(0, 0, 0, 0);
    
     const domenica = new Date(lunedi);
     domenica.setDate(lunedi.getDate() + 6);
     domenica.setHours(23, 59, 59, 999);
    
     // Formattazione per la query Supabase
     const startStr = lunedi.toISOString().split('T')[0];
     const endStr = domenica.toISOString().split('T')[0];
    */
    const startStr = dataPartenza.toISOString().split('T')[0];
    const endStr = dataFine.toISOString().split('T')[0];
    // 2. Recupero dati da Supabase
    const { data: pianificazioni, error } = await _supabase
        .from('calendario_pianificazione')
        .select(`
     pk_cal,
     data_pianificata,
     nota,
     fk_ricetta,
     ricette (pk_ricetta, titolo, immagine)
 `) // Aggiunto fk_ricetta qui
        .gte('data_pianificata', startStr)
        .lte('data_pianificata', endStr);

    if (error) {
        app.innerHTML = `<p>Errore nel caricamento: ${error.message}</p>`;
        return;
    }

    // 3. Generazione HTML
    const nomiMesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    const giorniSettimana = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];
    const oggiStr = new Date().toLocaleString('sv-SE').split(' ')[0];

    let html = `
     <div class="calendar-header">
         <h2>${nomiMesi[dataPartenza.getMonth()]} ${dataPartenza.getFullYear()}</h2>
         <div class="calendar-nav">
             <button class="btn-nav" onclick="navigazioneSettimana('${dataPartenza.toISOString()}', -${numeroGiorniMostrati})">❮</button>
             <button class="btn-nav btn-oggi" onclick="showCalendario()">Oggi</button>
             <button class="btn-nav" onclick="navigazioneSettimana('${dataPartenza.toISOString()}', ${numeroGiorniMostrati})">❯</button>
         </div>
     </div>
     <div class="calendar-grid" style="grid-template-columns: repeat(${numeroGiorniMostrati}, 1fr);">
 `;

    // Creazione delle colonne (una per ogni giorno)
    for (let i = 0; i < numeroGiorniMostrati; i++) {
        const giornoCorrente = new Date(dataPartenza.getTime());
        giornoCorrente.setDate(dataPartenza.getDate() + i);

        // --- CORREZIONE: Generiamo la stringa YYYY-MM-DD usando la data LOCALE ---
        const yyyy = giornoCorrente.getFullYear();
        const mm = String(giornoCorrente.getMonth() + 1).padStart(2, '0');
        const dd = String(giornoCorrente.getDate()).padStart(2, '0');
        const dataStr = `${yyyy}-${mm}-${dd}`;

        const isOggi = dataStr === oggiStr;
        // Ricette previste per questo giorno
        const ricetteDelGiorno = pianificazioni.filter(p => p.data_pianificata === dataStr);


        html += `
         <div class="calendar-day-column ${isOggi ? 'is-today' : ''}">
             <div class="day-label">
                 <div class="day-name">${giorniSettimana[i]}</div>
                 <div class="day-number-container">
                     <span class="day-number">${giornoCorrente.getDate()}</span>
                     <button class="btn-add-note" onclick="aggiungiNota('${dataStr}')" title="Aggiungi nota">+</button>
                 </div>
         </div>
         <div class="day-content">
             ${ricetteDelGiorno.map(p => {
            // CASO 1: È UNA NOTA DI TESTO (fk_ricetta è null)
            if (!p.fk_ricetta) {
                return `
                         <div class="note-card">
                             <p>${formattaTestoNota(p.nota)}</p>
                         <button class="btn-del-cal" onclick="rimuoviDalCalendario(${p.pk_cal})">×</button>
                         </div>
                     `;
            }
            // CASO 2: È UNA RICETTA
            return `
                     <div class="recipe-card-mini" onclick="window.naviga('ricetta', ${p.ricette.pk_ricetta})">
                     ${p.ricette.immagine ? `
             <div class="mini-img-wrapper">
                 <img src="${p.ricette.immagine}">
             </div>
         ` : '🍴'}
                             <button class="btn-del-cal" onclick="event.stopPropagation(); rimuoviDalCalendario(${p.pk_cal})">×</button>
                         
                         <p class="mini-title">${p.ricette.titolo}</p>
                         ${p.nota ? `<p class="mini-note-text">${formattaTestoNota(p.nota)}</p>` : ''}
                     </div>
                     `;
        }).join('')}
             </div>
         </div>
     `;
    }

    html += `</div>`;
    app.innerHTML = html;
}

// --- Funzioni di supporto globali ---

window.navigazioneSettimana = (dataStart, offset) => {
    const d = new Date(dataStart);
    d.setDate(d.getDate() + offset);
    showCalendario(d);
};

window.rimuoviDalCalendario = async (idCal) => {
    if (!confirm("Vuoi rimuovere questa ricetta dalla pianificazione?")) return;

    const { error } = await _supabase
        .from('calendario_pianificazione')
        .delete()
        .eq('pk_cal', idCal);

    if (error) alert(error.message);
    else showCalendario(); // Rinfresca la vista
};

window.aggiungiNota = async (data) => {
    const testoNota = prompt("Cosa vuoi segnare per questo giorno?");

    if (!testoNota || testoNota.trim() === "") return;

    const { error } = await _supabase
        .from('calendario_pianificazione')
        .insert([{
            data_pianificata: data,
            nota: testoNota,
            fk_ricetta: null // Esplicitiamo che non c'è una ricetta
        }]);

    if (error) {
        alert("Errore: " + error.message);
    } else {
        showCalendario(new Date(data)); // Ricarica la vista sulla settimana corretta
    }
};