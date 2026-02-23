import { _supabase, app, GEMINI_API_KEY } from './config.js';
import { showForm } from './form-ricetta.js';

let datiInRevisione = null;

export function showImportTesto() {
    app.innerHTML = `
        <div class="container-import">
            <h3>📥 Importa da Testo</h3>
            <div id="import-input-area" class="search-filters-content open">
            <p>Scrivi il testo</p>
            <div style="margin-bottom: 15px; display: flex; gap: 10px;">
                <button class="btn-salva" id="btn-incolla" >
                    📋 Incolla dagli appunti
                </button>
            </div>
            <textarea id="testo-grezzo" placeholder="Esempio:\nTorta di Mele\nIngredienti:\n3 Mele\n200g Farina\n...\nPreparazione:\n" Taglia le mele e inforna..." 
            style="width: 100%; height: 300px; padding: 15px; border-radius: 8px; border: 1px solid #ccc; font-family: sans-serif;"></textarea>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="btn-salva" id = "btn-analizza" onclick="processaTesto()">🔍 Analizza</button>
                <button class="btn-salva" onclick="window.naviga('home')">Annulla</button>
            </div>
            </div>
             <div id="area-revisione"></div>
        </div>
    `;

    const btnIncolla = document.getElementById('btn-incolla');
    const textArea = document.getElementById('testo-grezzo');

    btnIncolla.onclick = async () => {
        try {
            // navigator.clipboard.readText() è supportato solo su HTTPS
            const testo = await navigator.clipboard.readText();
            if (testo) {
                textArea.value = testo;
                console.log("Testo recuperato dagli appunti correttamente.");
            } else {
                alert("Gli appunti sembrano vuoti.");
            }
        } catch (err) {
            console.error("Errore Clipboard:", err);
            alert("Per incollare automaticamente, consenti l'accesso agli appunti quando richiesto dal browser.");
        }
    };

    // Rendiamo la funzione di analisi disponibile globalmente per il tasto onclick
    window.processaTesto = processaTesto;
}

/* versione con semplice regular expression per quantità e unità
export function processaTesto() {
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
*/

/* versione con API gemini */

window.processaTesto = async () => {
    const testo = document.getElementById('testo-grezzo').value;
    if (!testo.trim()) {
        alert("Incolla del testo prima di procedere!");
        return;
    }
    const btn = document.getElementById('btn-analizza');
    btn.innerText = "⏳ Analisi in corso...";
    btn.disabled = true;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const prompt = `
            Analizza questo testo di una ricetta e restituisci ESCLUSIVAMENTE un oggetto JSON con questa struttura precisa (non aggiungere commenti o markdown):
            {
              "titolo": "Nome della ricetta",
              "esecuzione": "Testo completo della preparazione",
              "categoria": "antipasto/primo/secondo/dolce/pane/bevanda (se possibile) deve essere uno degli elementi di questa lista: Antipasti,Bevande e Sorbetti,Dolci,Pane e Piatti Unici,Primi,Secondi di Carne,Secondi di Pesce,Secondi Vegetariani e Contorni",
              "sottocategoria": "eventuale sottocategoria (se possibile) deve essere uno degli elementi di questa lista: Gnocchi e Ravioli,Pasta,Paste Ripiene e al Forno,Riso e Cereali,Zuppe e Minestre,Fettina (carne),Polpette e Polpettoni (carne),Ripieni e Arrosti (carne),Umidi e Stracotti,Fritture (pesce),Pesce al Forno/Griglia/Vapore,Tranci e Filetti (pesce),Insalate e Contorni,Uova,Verdure Ripiene e Sformati,Piatti veg, Biscotti e Pasticcini,Creme per Farcire,Crostate,Dolci al Cucchiaio,Dolci Fritti,Frutta,Pandolci e Brioches,Torte e Dolci Farciti,Focacce e Pizze,Impasti Base,Pane, Crackers e Stuzzichini,Torte Salate,Confetture e Marmellate,Salse e Preparati base,Sottaceti e Sottolio,Aperitivi e Digestivi,Bevande Calde,Cocktails,Frappè e Frullati,Sorbetti,Pesce ripieno,Conserve sotto alcool,Succhi e Sciroppi,Legumi e Piatti Veg,Pesce in umido,Formaggi,Polpette e Polpettoni (pesce)",
              "cottura": "Forno/Lessato/Padella o altra parola da questa lista: Arrosto, Bagnomaria, Bimby, Bollito/Lessato, Crudo, Forno, Friggitrice ad aria, Fritto, Microonde, Multipla, Padella, Pentola a pressione, Vapore (se possibile)",
              "tempo_cottura_h": "numero (intero) ore di cottura (se possibile)",
              "tempo_cottura_m": "numero (intero) minuti di cottura (se possibile)",
              "tempo_attesa_h": "numero (intero) ore di attesa, es. di lievitazione (se possibile)",
              "tempo_attesa_m": "numero (intero) minuti di attesa es. per raffreddare (se possibile)",
              "nporzioni": "il numero di porzioni (solo numerico)",
              "porzioni": "la misura in cui sono espresse le porzioni (es. persone, pezzi, cm della tortiera,ecc.) (se possibile)",
              "ingredienti_ricette": [
                {
                  "quant": "numero o frazione (es: 200 o 1/2)",
                  "unita_testo": "unità di misura (es: g, ml, cucchiai), deve essere in questa lista: bacche,bastoncini,bicchieri,bicchierini,bustine,cespi,chicchi,ciuffi,confezioni,coste,cucchiai,cucchiaini,dita,falde,fette,fogli,foglie,gr,grappoli,gusci,manciate,mazzetti,mazzi,mestoli,ml,nodini,pizzichi,rametti,retine,spicchi,stecche,tazze,tazzine,teste,tranci,vasetti",
                  "ingrediente": "nome dell'ingrediente",
                  "dettagli": "note aggiuntive (es: tagliata a cubetti, freddo di frigo)"
                }
              ]
            }
            Testo da analizzare:
            ${testo}
        `;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const resData = await response.json();
        console.log("Risposta grezza da Gemini:", resData);
        let testoJson = resData.candidates[0].content.parts[0].text;

        // Pulizia da eventuali blocchi di codice markdown ```json ... ```
        testoJson = testoJson.replace(/```json|```/g, "").trim();
        datiInRevisione = JSON.parse(testoJson);
        // Renderizziamo la fase intermedia
        const inputArea = document.getElementById('import-input-area');
        if (inputArea) {
            inputArea.classList.remove('open');
            // Opzionale: aggiungiamo un bottone per riaprirla se l'utente ha sbagliato
            if (!document.getElementById('btn-mostra-input')) {
                const btnRiapri = document.createElement('button');
                btnRiapri.id = "btn-mostra-input";
                btnRiapri.className = "btn-toggle-filters";
                btnRiapri.style.marginBottom = "20px";
                btnRiapri.innerText = "📝 Mostra/Modifica Testo Originale";
                btnRiapri.onclick = () => inputArea.classList.toggle('open');
                inputArea.parentNode.insertBefore(btnRiapri, inputArea);
            }
        }
        renderizzaRevisione();
    } catch (error) {
        console.error("Errore Gemini:", error);
        alert("Errore durante l'analisi del testo. Riprova o inserisci manualmente.");
    } finally {
        btn.innerText = "✨ Trasmetti a form";;
        btn.disabled = false;
    }
};

function renderizzaRevisione() {
    const area = document.getElementById('area-revisione');
    area.innerHTML = `
        <div class="revision-area">
            <h4>🧐 Revisione</h4>
            <label>Titolo:</label>
            <input type="text" id="rev-titolo" value="${datiInRevisione.titolo}" style="width:100%; margin-bottom:15px;">
            <label style="display:block; margin-top:15px;">Portata:</label>
            <input type="text" id="rev-categoria" value="${datiInRevisione.categoria || ''}" style="width:100%; margin-bottom:15px;">
            <input type="text" id="rev-sottocategoria" value="${datiInRevisione.sottocategoria || ''}" style="width:100%; margin-bottom:15px;">
            <label style="display:block; margin-top:15px;">Metodo di Cottura:</label>
            <input type="text" id="rev-cottura" value="${datiInRevisione.cottura || ''}" style="width:100%; margin-bottom:15px;">
            <label style="display:block; margin-top:15px;">N° Porzioni:</label>
            <input type="text" id="rev-nporzioni" value="${datiInRevisione.nporzioni || ''}" style="width:100%; margin-bottom:15px;">
            <input type="text" id="rev-porzioni" value="${datiInRevisione.porzioni || ''}" style="width:100%; margin-bottom:15px;">
            <label>Ingredienti (modifica o elimina):</label>
            <div id="rev-lista-ingredienti">
                ${datiInRevisione.ingredienti_ricette.map((ing, i) => `
                    <div class="revision-item" data-index="${i}">
                        <input type="text" class="rev-q" style="width:50px" value="${ing.quant || ''}" placeholder="Qtà">
                        <input type="text" class="rev-u" style="width:60px" value="${ing.unita_testo || ''}" placeholder="Unità">
                        <input type="text" class="rev-i" style="flex:1" value="${ing.ingrediente || ''}" placeholder="Ingrediente">
                        <input type="text" class="rev-d" style="flex:1" value="${ing.dettagli || ''}" placeholder="Dettagli">
                        <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer;">&times;</button>
                    </div>
                `).join('')}
            </div>

            <label style="display:block; margin-top:15px;">Preparazione:</label>
            <textarea id="rev-esecuzione" style="width:100%; height:150px;">${datiInRevisione.esecuzione}</textarea>
                    <label style="display:block; margin-top:15px;">Tempo di Cottura:</label>
                    <input type="number" id="rev-tempo-cottura-h" value="${datiInRevisione.tempo_cottura_h || ''}" placeholder="Ore">
                    <input type="number" id="rev-tempo-cottura-m" value="${datiInRevisione.tempo_cottura_m || ''}" placeholder="Minuti">
                    <label style="display:block; margin-top:15px;">Tempo di Attesa:</label>
                    <input type="number" id="rev-tempo-attesa-h" value="${datiInRevisione.tempo_attesa_h || ''}" placeholder="Ore">
                    <input type="number" id="rev-tempo-attesa-m" value="${datiInRevisione.tempo_attesa_m || ''}" placeholder="Minuti">
            <button class="btn-salva" style="background:#27ae60; margin-top:20px; width:100%;" onclick="confermaEInvia()">✅ Conferma e Vai al Form</button>
        </div>
    `;
    area.scrollIntoView({ behavior: 'smooth' });
}

window.confermaEInvia = async () => {
    // Raccogliamo i dati modificati dall'interfaccia di revisione
    const ingredientiFinali = [];
    document.querySelectorAll('.revision-item').forEach(item => {
        const rawIng = item.querySelector('.rev-i').value.trim();
        const nomeIngrediente = rawIng ? rawIng.charAt(0).toUpperCase() + rawIng.slice(1).toLowerCase() : "";
        ingredientiFinali.push({
            quant: parseFrazione(item.querySelector('.rev-q').value) || null,
            unita_testo: item.querySelector('.rev-u').value || "",
            ingrediente: nomeIngrediente,
            dettagli: item.querySelector('.rev-d').value || ""
        });
    });

    const rawCat = document.getElementById('rev-categoria').value.trim();
    const categoria = rawCat ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase() : "";
    const rawSotto = document.getElementById('rev-sottocategoria').value.trim();
    const sottocategoria = rawSotto ? rawSotto.charAt(0).toUpperCase() + rawSotto.slice(1).toLowerCase() : "";
    let fk_cat = null;
    console.log("Categoria:", categoria);
    console.log("Sottocategoria:", sottocategoria);


    if ((categoria && categoria.trim() !== "") || (sottocategoria && sottocategoria.trim() !== "")) {
        let query = _supabase
            .from('categorie')
            .select('pk_cat');

        if (categoria) query = query.ilike('categoria', `%${categoria.trim()}%`);
        if (sottocategoria) query = query.ilike('sottocategoria', `%${sottocategoria.trim()}%`);

        const { data, error } = await query.maybeSingle();

        if (error) {
            console.error("Errore nel recupero della categoria:", error.message);
        } else if (data) {
            fk_cat = data.pk_cat;
            console.log("ID Categoria trovato:", fk_cat);
        } else {
            console.warn("Nessuna corrispondenza trovata nella tabella categorie.");
        }
    } else {
        console.log("Nessuna categoria o sottocategoria fornita.");
    }

    const datiFinali = {
        titolo: document.getElementById('rev-titolo').value.charAt(0).toUpperCase() + document.getElementById('rev-titolo').value.slice(1),
        esecuzione: document.getElementById('rev-esecuzione').value,
        fk_cat: fk_cat,
        n_porzioni: document.getElementById('rev-nporzioni').value || "",
        porzioni: document.getElementById('rev-porzioni').value || "",
        cottura: document.getElementById('rev-cottura').value.charAt(0).toUpperCase() + document.getElementById('rev-cottura').value.slice(1) || "",
        tempo_cottura_h: document.getElementById('rev-tempo-cottura-h').value || "",
        tempo_cottura_m: document.getElementById('rev-tempo-cottura-m').value || "",
        tempo_attesa_h: document.getElementById('rev-tempo-attesa-h').value || "",
        tempo_attesa_m: document.getElementById('rev-tempo-attesa-m').value || "",
        ingredienti_ricette: ingredientiFinali
    };

    console.log("DATI CONFERMATI:", datiFinali);
    showForm(null, datiFinali); // Passaggio finale al tuo form esistente
};


function parseFrazione(testo) {
    if (!testo) return null;
    if (testo.includes('/')) {
        const [num, den] = testo.split('/').map(Number);
        return den ? parseFloat((num / den).toFixed(1)) : num;
    }
    return parseFloat(parseFloat(testo).toFixed(1));
}