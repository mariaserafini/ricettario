// Aggiungi questa importazione se non presente
import { showImportTesto } from './import-testo.js';
import { _supabase, app, GOOGLE_API_KEY } from './config.js';

export async function showImportFoto() {
    app.innerHTML = `
        <div class="container-import" style="text-align: center;">
            <h2>📸 Importa Ricetta da Foto</h2>
            <p>Scatta una foto alla ricetta o caricala dalla galleria.</p>
            
            <div class="upload-area" id="drop-zone" style="border: 2px dashed #ccc; padding: 40px; border-radius: 15px; margin: 20px 0; cursor: pointer;">
                <input type="file" id="foto-ocr" accept="image/*" capture="environment" style="display: none;">
                <div id="preview-container" style="display: none; margin-bottom: 20px;">
                    <img id="img-preview" src="" style="max-width: 100%; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                </div>
                <div id="upload-prompt">
                    <span style="font-size: 3rem;">📷</span>
                    <p>Clicca per scattare o trascinare una foto</p>
                </div>
            </div>

            <div id="ocr-status" style="margin: 15px 0; font-weight: bold; color: #2980b9;"></div>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="btn-salva" id="btn-analizza-foto" disabled>🔍 Analizza Foto</button>
                <button class="btn-salva" onclick="window.naviga('home')">Annulla</button>
            </div>
        </div>
    `;

    const fileInput = document.getElementById('foto-ocr');
    const dropZone = document.getElementById('drop-zone');
    const btnAnalizza = document.getElementById('btn-analizza-foto');
    const status = document.getElementById('ocr-status');

    // Cliccando sulla zona tratteggiata si apre la fotocamera/galleria
    dropZone.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Mostra anteprima
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('upload-prompt').style.display = 'none';
            const container = document.getElementById('preview-container');
            const img = document.getElementById('img-preview');
            img.src = event.target.result;
            container.style.display = 'block';
            btnAnalizza.disabled = false;
        };
        reader.readAsDataURL(file);
    };

    btnAnalizza.onclick = async () => {
        const file = fileInput.files[0];
        status.innerText = "⏳ Estrazione testo in corso... attendi...";
        btnAnalizza.disabled = true;

        try {
            // Qui dovresti chiamare il tuo servizio OCR. 
            // Se usi Supabase Edge Functions o un'API esterna:
            const testoEstratto = await eseguiOCR(file);

            if (testoEstratto) {
                status.style.color = "green";
                status.innerText = "✅ Testo estratto con successo!";

                const testoPulito = testoEstratto
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .join('\n');

                // Chiamiamo la logica di parsing esistente
                setTimeout(() => {
                    showImportTesto();
                    // 2. Troviamo la textarea e ci scriviamo il testo dell'OCR
                    const textArea = document.getElementById('testo-grezzo');
                    if (textArea) {
                        textArea.value = testoPulito;
                        // Opzionale: scrolliamo all'inizio per permettere la revisione
                        textArea.focus();
                        textArea.scrollTop = 0;
                    }
                }, 800);
            }
        } catch (error) {
            status.style.color = "red";
            status.innerText = "❌ Errore durante l'analisi: " + error.message;
            btnAnalizza.disabled = false;
        }
    };
}

// Esempio di funzione OCR usando un servizio (da configurare)
async function eseguiOCR(file) {
    // Versione con libreria Tesseract.js (meno potente)
    // caricandola nel tuo index.html: <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>
    /*const result = await Tesseract.recognize(file, 'ita', {
        logger: m => console.log(m.status + ": " + Math.round(m.progress * 100) + "%")
    });
    return result.data.text;*/

    // Versione con Google Cloud Vision API
    const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });

    const url = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;

    const payload = {
        requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }]
        }]
    };

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    // Google restituisce il testo intero nel primo elemento di textAnnotations
    if (data.responses && data.responses[0].fullTextAnnotation) {
        return data.responses[0].fullTextAnnotation.text;
    } else {
        throw new Error("Google non ha trovato testo in questa immagine.");
    }
}