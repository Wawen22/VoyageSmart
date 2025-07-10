# Changelog

Tutte le modifiche importanti a questo progetto saranno documentate in questo file.

## [Unreleased]

### Changed
- **AI Model Upgrade**: Aggiornato da `gemini-1.5-flash-latest` a `gemini-2.0-flash-exp`
  - Migliorata la qualità delle risposte dell'AI Assistant
  - Migliorata la generazione di attività nel Wizard Itinerario
  - Mantenute le stesse configurazioni di temperatura (0.7) e max tokens (2048)
  - Aggiornati tutti i file di configurazione e documentazione

### Files Updated
- `src/lib/services/geminiService.ts`
- `src/lib/config.ts`
- `src/app/api/ai/generate-activities/route.ts`
- `src/app/api/ai/chat/route.ts`
- `Documentation/features/ai-features.md`
- `Documentation/technical/AI_DOCUMENTATION.md`

## [Previous Versions]

### AI Features Implementation
- Implementato AI Assistant per supporto viaggi
- Implementato AI Wizard per generazione automatica attività
- Integrazione con Google Gemini AI
- Sistema di sottoscrizioni per funzionalità AI
- Rate limiting e gestione errori

### Core Features
- Sistema di gestione viaggi completo
- Gestione alloggi, trasporti, spese
- Pianificatore itinerari con calendario
- Integrazione mappe Mapbox
- Sistema di autenticazione Supabase
- Dashboard amministratore
- Sistema referral e codici promozionali
