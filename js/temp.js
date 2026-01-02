app.innerHTML = `
    <div class="recipe-page-wrapper">
        <div class="nav-actions">
            <button class="btn-back" onclick="naviga('home')">← Torna alla Home</button>
            <button class="btn-action-nav">✏️ Modifica</button>
            <button class="btn-action-nav">🔗 Collega</button>
            <button class="btn-action-nav">📋 Clona</button>
            <button class="btn-action-nav btn-delete">🗑️ Elimina</button>
            <button class="btn-print-text" onclick="copiaVersioneTesto()">📋 Copia</button>
            <button class="btn-action-stampata ${r.stampata ? 'already-printed' : ''}" 
                    onclick="segnaComeStampata(${r.pkRicetta}, ${r.stampata})">
                <span>${r.stampata ? '✅' : '🖨️'}</span> 
                ${r.stampata ? 'Rimuovi da Stampate' : 'Segna come Stampata'}
            </button>
        </div>

        <div class="recipe-header-centered">
            <h1>${r.Titolo} ${r.Etnica ? `<small>(${r.Etnica})</small>` : ''}</h1>
            <div id="rating-area" class="interactive-rating">${renderStars(r.Voto, r.pkRicetta)}</div>
        </div>

        <div class="recipe-grid-layout">
            <aside class="recipe-sidebar">
                <div class="ingredients-box">
                    <h3>Ingredienti</h3>
                    <ul class="ingredients-list">
                        ${r.ingredienti_ricette.map(ing => `
                            <li class="ingredient-item">
                                <strong>${ing.Quant || ''} ${ing.misure?.Misura || ''}</strong> 
                                ${ing.ingredienti?.Ingrediente} ${ing.Dettagli ? `<em>(${ing.Dettagli})</em>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                    <button class="btn-portions" onclick="alert('In arrivo!')">⚖️ Modifica Porzioni</button>
                </div>

                <div class="add-comment-box" style="margin-top: 30px; background: #eee; padding: 15px; border-radius: 8px;">
                    <h4>Aggiungi una nota</h4>
                    <input type="text" id="new-comment-author" placeholder="Tuo nome...">
                    <textarea id="new-comment-text" placeholder="Scrivi qui..."></textarea>
                    <button class="btn-comment" onclick="saveComment(${r.pkRicetta})">Salva Nota</button>
                </div>
            </aside>

            <main class="recipe-main-content">
                <div class="recipe-top-row">
                    <div class="recipe-info-badges">
                        <span class="badge">📂 ${portata}</span>
                        <span class="badge">🔥 ${r.Cottura || 'N/A'}</span>
                        <span class="badge">📊 Diff: ${renderDifficolta(r.Diff)}</span>
                        ${r.Tempo_preparazione ? `<span class="badge">⏱️ ${r.Tempo_preparazione}</span>` : ''}
                    </div>
                    <div class="recipe-main-image">
                        <img src="${immagineUrl}" alt="${r.Titolo}" style="max-width: 200px; height: auto;">
                    </div>
                </div>

                <div class="execution-box">
                    <h3>Preparazione</h3>
                    <p id="exec-to-copy">${r.Esecuzione}</p>
                </div>

                <div class="recipe-footer-meta">
                    <p><strong>Autore:</strong> ${r.Autore} | <strong>Data:</strong> ${new Date(r.Data).toLocaleDateString('it-IT')}</p>
                </div>

                <div class="comments-section">
                    <h3>Note precedenti</h3>
                    <div class="comments-list">
                        ${r.commenti.map(c => `
                            <div class="comment-card-aside" style="background: #fff; margin-bottom: 10px; padding: 10px; border-left: 4px solid orange;">
                                <p>"${c.Commento}"</p>
                                <small>${c.Autore} - ${new Date(c.Data).toLocaleDateString()}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </main>
        </div>
    </div>`;