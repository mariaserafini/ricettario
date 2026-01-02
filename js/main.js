// 1. Importa le funzioni dai tuoi file
import { renderDifficolta, renderStars, generaStelline, aggiornaVoto, renderRecipeCard, convertiInMinuti, formattaTempo, toggleNascondi } from './ui.js';
import { showHome } from './home.js';
import { showLatest } from './recenti.js';
import { showRicetta, saveComment } from './ricetta.js';
import { showSearch, handleIngSearch, addTag, removeTag, openQtaPrompt, eseguiRicerca, renderTags, clearSearch } from './ricerca.js';
import { _supabase } from './config.js';

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
window.convertiInMinuti = convertiInMinuti;
window.formattaTempo = formattaTempo;
window.toggleNascondi = toggleNascondi;

window.showSearch = showSearch;
window.handleIngSearch = handleIngSearch;
window.addTag = addTag;
window.removeTag = removeTag;
window.openQtaPrompt = openQtaPrompt;
window.eseguiRicerca = eseguiRicerca;
window.renderTags = renderTags;
window.clearSearch = clearSearch;

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
        if (sezione === 'ricerca') {
            clearSearch();
            showSearch();
        }
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

async function checkUser() {
    // Definiamo i riferimenti agli elementi HTML
    const loginDiv = document.getElementById('login-container');
    const appDiv = document.getElementById('app');
    const navbar = document.querySelector('.navbar');

    const { data: { user } } = await _supabase.auth.getUser();

    if (user) {
        if (loginDiv) loginDiv.style.display = 'none';
        appDiv.style.display = 'block';
        if (navbar) navbar.style.display = 'flex';
        gestisciPercorso(); // Usa la logica che hai già per caricare la pagina corretta
    } else {
        if (loginDiv) loginDiv.style.display = 'flex'; // Mostra il login
        appDiv.style.display = 'none';
        if (navbar) navbar.style.display = 'none'; // Nasconde la nav se non loggato
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorP = document.getElementById('login-error');

    const { error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        errorP.innerText = "Accesso negato: " + error.message;
    } else {
        checkUser(); // Se il login va a buon fine, ricarica la vista
    }
}

// Inizializzazione al caricamento
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }
    checkUser();
});

