# 🔐 API Key Security Guide

## 🚨 PROBLEMA CRITICO RISOLTO

**Data**: 2025-07-10  
**Problema**: API key Gemini hardcoded nel codice e visibile su GitHub  
**Stato**: ✅ RISOLTO  

### Azioni Immediate Completate

1. ✅ **Rimosso API key hardcoded** da:
   - `src/app/api/ai/generate-activities/route.ts`
   - `src/components/ai/ItineraryWizard.tsx`

2. ✅ **Aggiunta validazione** per verificare presenza API key
3. ✅ **Aggiunta gestione errori** quando API key non è configurata

## 🔧 Azioni Richieste per Completare la Sicurezza

### 1. **INVALIDARE IMMEDIATAMENTE L'API KEY ESPOSTA**

```bash
# Vai su Google AI Studio
https://aistudio.google.com/app/apikey

# 1. Elimina la chiave compromessa: AIzaSyCdjn1Ox8BqVZUMTWMo9ZMMUYiKpkAym2E
# 2. Genera una nuova API key
# 3. Aggiorna il file .env.local
```

### 2. **Configurare Nuova API Key**

Crea/aggiorna il file `.env.local`:

```env
# Gemini AI - NUOVA CHIAVE SICURA
NEXT_PUBLIC_GEMINI_API_KEY=la_tua_nuova_chiave_qui
```

### 3. **Verificare .gitignore**

Assicurati che `.env.local` sia nel `.gitignore`:

```gitignore
# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 4. **Rimuovere dalla History Git (OPZIONALE)**

Se vuoi rimuovere completamente la chiave dalla history:

```bash
# ATTENZIONE: Questo riscrive la history Git
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch src/app/api/ai/generate-activities/route.ts' \
  --prune-empty --tag-name-filter cat -- --all

# Forza il push (solo se necessario)
git push origin --force --all
```

## 🛡️ Best Practices per la Sicurezza

### ✅ DO - Cosa Fare

1. **Usa sempre variabili d'ambiente** per API keys
2. **Valida la presenza** delle chiavi prima dell'uso
3. **Gestisci errori** quando le chiavi mancano
4. **Usa prefissi appropriati**:
   - `NEXT_PUBLIC_` per chiavi client-side
   - Nessun prefisso per chiavi server-side sensibili

### ❌ DON'T - Cosa NON Fare

1. **Mai hardcodare API keys** nel codice
2. **Mai committare** file `.env.local`
3. **Mai condividere** API keys in chat/email
4. **Mai usare** la stessa chiave per dev/prod

## 🔍 Controlli di Sicurezza

### Script di Verifica

```bash
# Cerca API keys hardcoded
grep -r "AIzaSy" src/ --exclude-dir=node_modules
grep -r "sk_" src/ --exclude-dir=node_modules
grep -r "pk_" src/ --exclude-dir=node_modules

# Verifica .env.local non sia tracciato
git status --ignored | grep .env.local
```

### Validazione Runtime

Il codice ora include validazione automatica:

```typescript
// ✅ Implementato in generate-activities/route.ts
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!geminiApiKey) {
  return NextResponse.json(
    { error: 'Servizio AI non disponibile. Contatta l\'amministratore.' },
    { status: 500 }
  );
}
```

## 📋 Checklist Post-Incident

- [x] API key hardcoded rimosso dal codice
- [x] Validazione API key aggiunta
- [x] Gestione errori implementata
- [ ] **API key compromessa invalidata su Google AI Studio**
- [ ] **Nuova API key generata e configurata**
- [ ] **Deployment con nuova chiave**
- [ ] **Test funzionalità AI**

## 🚀 Deployment Sicuro

### Variabili d'Ambiente per Produzione

```env
# Produzione - Vercel/Netlify
NEXT_PUBLIC_GEMINI_API_KEY=nuova_chiave_produzione

# Development
NEXT_PUBLIC_GEMINI_API_KEY=nuova_chiave_development
```

### Verifica Post-Deployment

1. Test funzionalità AI Assistant
2. Test AI Wizard generazione attività
3. Verifica logs per errori API key
4. Controllo rate limiting funzionante

---

**⚠️ IMPORTANTE**: Completa immediatamente i punti della checklist per garantire la sicurezza dell'applicazione.
