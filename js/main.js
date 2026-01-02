// 1. Importa le funzioni dai tuoi file
import { renderDifficolta, renderStars, generaStelline, aggiornaVoto, renderRecipeCard } from './ui.js';
import { showHome } from './home.js';
import { showLatest } from './recenti.js';
import { showRicetta, saveComment } from './ricetta.js';
import { showSearch, handleIngSearch, addTag, removeTag, openQtaPrompt, eseguiRicerca, renderTags } from './ricerca.js';

// 2. Rendile "Globali" (Parte A della mia risposta precedente)
// Senza questo passaggio, onclick="showHome()" nell'HTML non funzionerebbe

window.renderDifficolta = renderDifficolta;
window.renderStars = renderStars;
window.generaStelline = generaStelline;
window.showHome = showHome;
window.showLatest = showLatest;
window.showRicetta = showRicetta;
window.saveComment = saveComment;
window.aggiornaVoto = aggiornaVoto;
window.renderRecipeCard = renderRecipeCard;

window.showSearch = showSearch;
window.handleIngSearch = handleIngSearch;
window.addTag = addTag;
window.removeTag = removeTag;
window.openQtaPrompt = openQtaPrompt;
window.eseguiRicerca = eseguiRicerca;
window.renderTags = renderTags;

// Cosa succede quando l'utente preme Indietro o F5
window.onpopstate = () => gestisciPercorso();
window.onload = () => gestisciPercorso();

// Funzione universale per cambiare pagina e aggiornare l'URL
window.naviga = (sezione, id = null) => {
    if (sezione !== 'ricerca' && !id) {
        localStorage.removeItem('lastSearch'); // Pulisce la memoria se cambiamo sezione
    }
    let url = window.location.origin + window.location.pathname;

    if (id) {
        url += `?id=${id}`;
        window.history.pushState({ sezione: 'ricetta', id: id }, '', url);
        showRicetta(id);
    } else {
        url += `?p=${sezione}`;
        window.history.pushState({ sezione: sezione }, '', url);

        // Smista la chiamata alla funzione corretta
        if (sezione === 'home') showHome();
        if (sezione === 'recenti') showLatest();
        if (sezione === 'ricerca') showSearch();
    }
};


function gestisciPercorso() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const pagina = urlParams.get('p');

    if (id) {
        showRicetta(id);
    } else if (pagina === 'recenti') {
        showLatest();
    } else if (pagina === 'ricerca') {
        showSearch();
    } else {
        showHome();
    }
}

