import { _supabase, app } from './config.js';

export async function showManutenzione() {
    app.innerHTML = `<div class="loader">Analisi in corso...</div>`;

    // 1. Recuperiamo gli orfani dalla tua VISTA
    const promiseOrfani = _supabase.from('ingredienti_non_usati').select('*');

    // 2. Recuperiamo gli ingredienti rari (usati 1 volta)
    // Usiamo il conteggio sulle relazioni per trovarli
    const promiseRari = _supabase
        .from('ingredienti')
        .select(`
            pk_ingrediente, 
            ingrediente, 
            ingredienti_ricette!inner(
                fk_ricetta,
                ricette(pk_ricetta, titolo)
            )
        `)
        .order('ingrediente', { ascending: true })
        .then(({ data }) => {
            // Filtriamo lato client quelli che compaiono esattamente 1 volta
            return data.filter(ing => ing.ingredienti_ricette.length === 1);
        });

    const [resOrfani, rari] = await Promise.all([promiseOrfani, promiseRari]);

    const orfani = resOrfani.data || [];

    let html = `
        <div class="manutenzione-container">
            <h2>Manutenzione Database</h2>
            
            <section class="card-manutenzione orfani">
                <h3>🚫 Ingredienti Orfani (${orfani.length})</h3>
                <p>Estratti dalla vista <code>ingredienti_non_usati</code></p>
                ${orfani.length > 0 ? `
                    <button class="btn-danger" onclick="pulisciOrfaniDalDB()">
                        Cancella questi ingredienti (${orfani.length})
                    </button>
                    <div class="tag-container">
                        ${orfani.map(i => `<span class="tag-orfano">${i.ingrediente}</span>`).join('')}
                    </div>
                ` : '<p class="success">🎉 Il database è pulitissimo!</p>'}
            </section>

            <section class="card-manutenzione rari">
                <h3>🔍 Ingredienti Rari (${rari.length})</h3>
                <p>Usati in una sola ricetta.</p>
              <div class="lista-rari-dettagli">
                    ${rari.map(i => {
        const ricetta = i.ingredienti_ricette[0].ricette;
        return `
                            <div class="item-raro">
                                <span class="tag-raro">${i.ingrediente}</span>
                                <span class="freccia">→</span>
                                <a href="#" class="link-ricetta" onclick="naviga('ricetta', ${ricetta.pk_ricetta})">
                                    ${ricetta.titolo}
                                </a>
                            </div>
                        `;
    }).join('')}
                </div>
            </section>
        </div>
    `;

    app.innerHTML = html;
}

window.pulisciOrfaniDalDB = async () => {
    if (!confirm("Vuoi eliminare definitivamente tutti gli ingredienti non utilizzati?")) return;

    // Cancelliamo gli ingredienti la cui PK è presente nella vista
    // Sfruttiamo una subquery implicita: cancelliamo dove l'ID è tra quelli degli orfani
    const { data: daCancellare } = await _supabase.from('ingredienti_non_usati').select('pk_ingrediente');
    const ids = daCancellare.map(d => d.pk_ingrediente);

    if (ids.length === 0) return;

    const { error } = await _supabase
        .from('ingredienti')
        .delete()
        .in('pk_ingrediente', ids);

    if (error) {
        alert("Errore: " + error.message);
    } else {
        alert(`Eliminati ${ids.length} ingredienti con successo.`);
        showManutenzione(); // Refresh
    }
};