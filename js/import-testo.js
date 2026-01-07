import { _supabase, app } from './config.js';

export function showImportTesto() {
    app.innerHTML = `
        <div class="container-import">
            <h2>📥 Importa Ricetta da Testo</h2>
            <p>Incolla qui il testo della ricetta (Titolo, Ingredienti, Preparazione...)</p>
            
            <textarea id="testo-grezzo" placeholder="Esempio:
Torta di Mele
Ingredienti:
3 Mele
200g Farina
...
Preparazione:
Taglia le mele e inforna..." 
            style="width: 100%; height: 300px; padding: 15px; border-radius: 8px; border: 1px solid #ccc; font-family: sans-serif;"></textarea>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="btn-action" onclick="processaTesto()">Analizza e Crea Form</button>
                <button class="btn-secondary" onclick="window.naviga('home')">Annulla</button>
            </div>
        </div>
    `;

    // Rendiamo la funzione di analisi disponibile globalmente per il tasto onclick
    window.processaTesto = processaTesto;
}

function processaTesto() {
    const testo = document.getElementById('testo-grezzo').value;
    if (!testo.trim()) return alert("Incolla del testo prima di continuare!");

    const righe = testo.split('\n').map(r => r.trim()).filter(r => r !== "");

    let dati = {
        titolo: righe[0] || "Nuova Ricetta", // Assumiamo la prima riga sia il titolo
        esecuzione: "",
        ingredienti_ricette: []
    };

    let sezioneAttuale = "titolo";

    righe.slice(1).forEach(riga => {
        const rigaLower = riga.toLowerCase();

        // Cambio sezione se trovo parole chiave
        if (rigaLower.startsWith("ingredient") || rigaLower.includes("occorrente")) {
            sezioneAttuale = "ingredienti";
            return;
        }
        if (rigaLower.includes("preparazione") || rigaLower.includes("procedimento") || rigaLower.includes("esecuzione")) {
            sezioneAttuale = "esecuzione";
            return;
        }

        if (sezioneAttuale === "ingredienti") {
            // Tentativo di estrarre quantità e nome (Regex semplice)
            // Cerca numeri all'inizio della riga: "200g farina" o "3 mele"
            const matchQuant = riga.match(/^(\d+[.,]?\d*)\s*(g|gr|kg|ml|l|pz)?\s+([^,-]+)(?:[,\s-]+(.*))?/i);

            if (matchQuant) {
                dati.ingredienti_ricette.push({
                    quant: matchQuant[1],
                    unita_testo: matchQuant[2] || "",
                    ingrediente: matchQuant[3].trim(),
                    dettagli: matchQuant[4] ? matchQuant[4].trim() : ""
                });

            } else {
                dati.ingredienti_ricette.push({
                    quant: null,
                    unita_testo: "",
                    ingrediente: riga.trim(),
                    dettagli: ""
                });
            }
        } else if (sezioneAttuale === "esecuzione") {
            dati.esecuzione += riga + "\n\n";
        }
    });

    dati.ingredienti_ricette = dati.ingredienti_ricette.filter(i =>
        i &&
        typeof i === 'object' &&
        i.ingrediente &&
        i.ingrediente.trim() !== ""
    );
    console.log("DEBUG IMPORT - Dati pronti per l'invio:", dati);
    // Ora passiamo i dati al tuo showForm esistente!
    import('./form-ricetta.js').then(module => {
        console.log("DEBUG IMPORT - Chiamata a showForm in corso...");
        module.showForm(null, dati);
    });
}