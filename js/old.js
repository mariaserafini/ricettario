//nel file ricetta.js appena dentro la funzione showRicetta (verso la riga 13)
window.segnaComeStampata = segnaComeStampata;

//nei bottoni di azione (verso la riga 100) aggiungere questo bottone per segna come stampata
<button class="btn-action-stampata ${r.stampata ? 'already-printed' : ''}"
    onclick="segnaComeStampata(${r.pk_ricetta})">
    ${r.stampata ? '✅' : '🖨️'}
    ${r.stampata ? 'Stampata' : 'Stampa'}
</button>

// nel file ricetta.js (verso la fine tipo riga 270)
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
