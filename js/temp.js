export async function saveRicetta(e, id = null) {
    e.preventDefault();

    // 1. Riferimento corretto al pulsante (usando l'evento)
    const btnSalva = e.currentTarget;
    const originalText = btnSalva.innerText;

    // 2. Validazione Campi Obbligatori
    let titolo = document.getElementById('f-titolo').value.trim();
    const autore = document.getElementById('f-autore').value.trim();
    const esecuzione = document.getElementById('f-esecuzione').value.trim();
    const rows = document.querySelectorAll('.ingredient-row');

    if (!titolo || !autore || !esecuzione || rows.length === 0) {
        alert("Errore: Titolo, Autore, Esecuzione e almeno un ingrediente sono obbligatori.");
        return;
    }

    // Disabilita pulsante
    btnSalva.disabled = true;
    btnSalva.innerText = "Salvataggio in corso...";

    try {
        titolo = titolo.charAt(0).toUpperCase() + titolo.slice(1).toLowerCase();

        // 3. Gestione Tempi
        const getInterval = (idPrefix) => {
            const h = document.getElementById(`f-time-${idPrefix}-h`).value || 0;
            const m = document.getElementById(`f-time-${idPrefix}-m`).value || 0;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        };

        // Gestione titoli duplicati
        if (!id) {
            const { data: simili } = await _supabase
                .from('ricette')
                .select('titolo')
                .ilike('titolo', `${titolo}%`);

            if (simili && simili.length > 0) {
                let maxNumero = 1;
                let trovatoEsatto = false;
                simili.forEach(s => {
                    if (s.titolo.toLowerCase() === titolo.toLowerCase()) trovatoEsatto = true;
                    const match = s.titolo.match(/\((\d+)\)$/);
                    if (match) {
                        const num = parseInt(match[1]);
                        if (num > maxNumero) maxNumero = num;
                    }
                });
                if (trovatoEsatto || maxNumero > 1) {
                    titolo = `${titolo} (${maxNumero + 1})`;
                }
            }
        }

        const ricettaData = {
            titolo,
            autore,
            esecuzione,
            etnica: document.getElementById('f-etnica').value || null,
            cottura: document.getElementById('f-cottura').value || null,
            diff: parseInt(document.getElementById('f-diff').value) || null,
            fk_cat: document.getElementById('f-categoria').value || null,
            n_porzioni: document.getElementById('f-porzioni-qta').value ? parseInt(document.getElementById('f-porzioni-qta').value) : null,
            porzioni: document.getElementById('f-porzioni-tipo').value || null,
            tempo_cottura: getInterval('cottura'),
            tempo_preparazione: getInterval('prep'),
            tempo_agg: getInterval('agg'),
            data: new Date().toISOString()
        };

        // SALVATAGGIO RICETTA
        const payload = id ? { pk_ricetta: id, ...ricettaData } : ricettaData;
        const { data: savedRicetta, error: rError } = await _supabase
            .from('ricette')
            .upsert(payload)
            .select()
            .single();

        if (rError) throw rError;
        const pk_ricetta = savedRicetta.pk_ricetta;

        // 4. Gestione Immagine
        const fotoInput = document.getElementById('f-foto');
        if (fotoInput && fotoInput.files[0]) {
            const compressedBlob = await resizeImage(fotoInput.files[0], 800, 800);
            const fileName = `ric_${pk_ricetta}.jpg`;
            const { error: upError } = await _supabase.storage
                .from('foto-ricette')
                .upload(fileName, compressedBlob, { upsert: true });

            if (!upError) {
                const { data: pUrl } = _supabase.storage.from('foto-ricette').getPublicUrl(fileName);
                await _supabase.from('ricette').update({ immagine: pUrl.publicUrl }).eq('pk_ricetta', pk_ricetta);
            }
        }

        // 5. GESTIONE INGREDIENTI
        if (id) {
            await _supabase.from('ingredienti_ricette').delete().eq('fk_ricetta', id);
        }

        for (const row of rows) {
            let nomeIng = row.querySelector('.ing-nome').value.trim();
            if (!nomeIng) continue;

            nomeIng = nomeIng.charAt(0).toUpperCase() + nomeIng.slice(1).toLowerCase();
            // Cambiato parseInt in parseFloat per gestire grammi/decimali
            const quant = row.querySelector('.ing-qta').value ? parseFloat(row.querySelector('.ing-qta').value) : null;
            const fk_misura = row.querySelector('.ing-misura').value || null;
            const dettagli = row.querySelector('.ing-dettagli').value || null;

            // Trova o crea ingrediente
            let { data: ingExist } = await _supabase.from('ingredienti').select('pk_ingrediente').eq('ingrediente', nomeIng).maybeSingle();

            let fk_ingrediente;
            if (!ingExist) {
                const { data: newIng, error: ingErr } = await _supabase.from('ingredienti').insert({ ingrediente: nomeIng }).select().single();
                if (ingErr) throw ingErr;
                fk_ingrediente = newIng.pk_ingrediente;
            } else {
                fk_ingrediente = ingExist.pk_ingrediente;
            }

            // Inserisci legame
            const { error: linkErr } = await _supabase.from('ingredienti_ricette').insert({
                fk_ricetta: pk_ricetta,
                fk_ingrediente,
                fk_misura,
                quant,
                dettagli
            });
            if (linkErr) console.error("Errore legame ingrediente:", linkErr);
        }

        alert("Ricetta salvata con successo!");
        // Reindirizzamento alla pagina della ricetta appena creata
        if (window.naviga) {
            window.naviga('ricetta', pk_ricetta);
        }

    } catch (error) {
        console.error("Errore generale:", error);
        alert("Si è verificato un errore durante il salvataggio: " + error.message);
        btnSalva.disabled = false;
        btnSalva.innerText = originalText;
    }
}


ALTER TABLE ingredienti_ricette set fk_ingrediente = 448 where fk_ingrediente = 559;
5620