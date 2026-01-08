import { _supabase, app, GEMINI_API_KEY } from './config.js';
import { showForm } from './form-ricetta.js';

// Variabile temporanea per i dati in fase di revisione
let datiInRevisione = null;

export function showImportTesto() {
    app.innerHTML = `
        <div class="container-import" id="import-container">
            <h3>📥 Importa da Testo</h3>
            <textarea id="testo-grezzo" placeholder="Incolla qui la ricetta..." style="width: 100%; height: 200px; padding: 15px; border-radius: 8px;"></textarea>
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button class="btn-salva" id="btn-analizza" onclick="processaTesto()">🔍 Analizza con Gemini</button>
            </div>
            <div id="area-revisione"></div>
        </div>
    `;
}

window.processaTesto = async () => {
    const testo = document.getElementById('testo-grezzo').value;
    const btn = document.getElementById('btn-analizza');
    const areaRevisione = document.getElementById('area-revisione');

    if (!testo.trim()) return alert("Incolla del testo!");

    btn.innerText = "⏳ Analisi in corso...";
    btn.disabled = true;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const prompt = `Analizza questa ricetta e restituisci un JSON con: titolo, esecuzione, e ingredienti_ricette (array di oggetti con quant, unita_testo, ingrediente, dettagli). Testo: ${testo}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const resData = await response.json();
        let testoJson = resData.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
        datiInRevisione = JSON.parse(testoJson);

        // Renderizziamo la fase intermedia
        renderizzaRevisione();
    } catch (error) {
        alert("Errore durante l'analisi.");
    } finally {
        btn.innerText = "🔍 Analizza con Gemini";
        btn.disabled = false;
    }
};

function renderizzaRevisione() {
    const area = document.getElementById('area-revisione');
    area.innerHTML = `
        <div class="revision-area">
            <h4>🧐 Revisione Dati</h4>
            <label>Titolo:</label>
            <input type="text" id="rev-titolo" value="${datiInRevisione.titolo}" style="width:100%; margin-bottom:15px;">
            
            <label>Ingredienti (modifica o elimina):</label>
            <div id="rev-lista-ingredienti">
                ${datiInRevisione.ingredienti_ricette.map((ing, i) => `
                    <div class="revision-item" data-index="${i}">
                        <input type="text" class="rev-q" style="width:50px" value="${ing.quant || ''}" placeholder="Qtà">
                        <input type="text" class="rev-u" style="width:60px" value="${ing.unita_testo || ''}" placeholder="Unità">
                        <input type="text" class="rev-i" style="flex:1" value="${ing.ingrediente || ''}" placeholder="Ingrediente">
                        <button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer;">🗑️</button>
                    </div>
                `).join('')}
            </div>

            <label style="display:block; margin-top:15px;">Preparazione:</label>
            <textarea id="rev-esecuzione" style="width:100%; height:150px;">${datiInRevisione.esecuzione}</textarea>

            <button class="btn-salva" style="background:#27ae60; margin-top:20px; width:100%;" onclick="confermaEInvia()">✅ Conferma e Vai al Form</button>
        </div>
    `;
    area.scrollIntoView({ behavior: 'smooth' });
}

window.confermaEInvia = () => {
    // Raccogliamo i dati modificati dall'interfaccia di revisione
    const ingredientiFinali = [];
    document.querySelectorAll('.revision-item').forEach(item => {
        ingredientiFinali.push({
            quant: item.querySelector('.rev-q').value || null,
            unita_testo: item.querySelector('.rev-u').value,
            ingrediente: item.querySelector('.rev-i').value,
            dettagli: "" // Gemini solitamente li include nel nome ingrediente se non specificato
        });
    });

    const datiFinali = {
        titolo: document.getElementById('rev-titolo').value,
        esecuzione: document.getElementById('rev-esecuzione').value,
        ingredienti_ricette: ingredientiFinali
    };

    console.log("DATI CONFERMATI:", datiFinali);
    showForm(null, datiFinali); // Passaggio finale al tuo form esistente
};