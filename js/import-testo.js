import { _supabase, app } from './config.js';

export function showImportTesto() {
    const app = document.getElementById('app');

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
        ingredienti: []
    };

    let sezioneAttuale = "titolo";

    righe.slice(1).forEach(riga => {
        const rigaLower = riga.toLowerCase();

        // Cambio sezione se trovo parole chiave
        if (rigaLower.includes("ingrediente") || rigaLower.includes("occorre")) {
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
            const matchQuant = riga.match(/^(\d+)\s*(g|gr|kg|ml|l|pz)?\s+(.*)/i);

            if (matchQuant) {
                dati.ingredienti.push({
                    quant: matchQuant[1],
                    unita: matchQuant[2] || "",
                    nome: matchQuant[3]
                });
            } else {
                dati.ingredienti.push({ quant: "", nome: riga });
            }
        } else if (sezioneAttuale === "esecuzione") {
            dati.esecuzione += riga + "\n\n";
        }
    });

    // Ora passiamo i dati al tuo showForm esistente!
    import('./form-ricetta.js').then(module => {
        module.showForm(null, dati);
    });
}