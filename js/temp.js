window.attivaModificaDosi = (porzioniOriginali) => {
    const lista = document.getElementById('lista-ingredienti');
    if (!lista) return;

    // 1. Gestione del valore di fallback per il calcolo
    // Se porzioniOriginali è null, undefined o 0, usiamo 1 come base neutra
    const nOriginale = (porzioniOriginali && !isNaN(porzioniOriginali)) ? parseFloat(porzioniOriginali) : 1;

    const wrappers = lista.querySelectorAll('.qty-wrapper');
    wrappers.forEach((wrapper, index) => {
        const spanOriginale = wrapper.querySelector('.qty-value');
        if (!spanOriginale) return;

        const valoreAttuale = spanOriginale.innerText;
        spanOriginale.style.display = 'none';

        let input = wrapper.querySelector('.input-dose');
        if (!input) {
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'input-dose no-arrows';
            input.step = 'any';
            input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };

            // Passiamo nOriginale (che è almeno 1) alla funzione di ricalcolo
            input.onblur = () => ricalcolaDaIngrediente(index, nOriginale);
            wrapper.appendChild(input);
        }

        input.value = valoreAttuale;
        input.style.display = 'inline-block';
    });

    // 2. Aggiunta campo porzioni (interfaccia di controllo)
    if (!document.getElementById('input-porzioni')) {
        const box = document.querySelector('.ingredients-box');
        const displayStatico = document.getElementById('display-porzioni');

        // Recupero pulito del testo (es. "persone")
        let testoOriginale = 'porzioni';
        if (displayStatico && displayStatico.innerText.trim() !== "") {
            // Puliamo il testo statico per estrarre solo la parola descrittiva
            testoOriginale = displayStatico.innerText
                .replace('Dosi per:', '')
                .replace(porzioniOriginali, '')
                .trim();
        }
        if (!testoOriginale) testoOriginale = 'porzioni';

        if (displayStatico) displayStatico.style.display = 'none';

        const divPorzioni = document.createElement('div');
        divPorzioni.className = "portions-edit-area";
        // Nota: ho rimosso lo spazio extra nel tag <div style... che creava problemi di visualizzazione
        divPorzioni.innerHTML = `
        <div style="margin: 10px 0; background: #f0f0f0; padding: 10px; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 0.9rem; font-weight: bold;">Dosi:</span>
            <input type="number" id="input-porzioni" class="no-arrows" 
                   style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;"
                   value="${nOriginale}"
                   onkeydown="if(event.key==='Enter') this.blur();"
                   onblur="ricalcolaDaPorzioni(this.value, ${nOriginale})">
            
            <input type="text" id="input-testo-porzioni" 
                   style="width: 110px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;" 
                   value="${testoOriginale}" 
                   placeholder="es: persone">
        </div>`;

        box.insertBefore(divPorzioni, lista);
    }

    const btn = document.getElementById('btn-modifica-dosi');
    if (btn) {
        btn.innerText = "✅ Fine Modifica";
        btn.onclick = () => location.reload();
    }
};