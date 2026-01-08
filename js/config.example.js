const { createClient } = supabase;
export const _supabase = createClient('il tuo riferimento a upabase');
export const app = document.getElementById('app');
//export const GOOGLE_API_KEY = 'la tua chiave google (se usi cloudVision) --> scommenta questa riga e commenta la prossima e modifica il codice in import-testo.js e in import-foto.js';
export const GEMINI_API_KEY = 'la tua chiave Gemini'; 