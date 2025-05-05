# Configurazione Cron Job per Gestione Sottoscrizioni

Questo documento descrive come configurare un cron job per automatizzare la verifica delle sottoscrizioni scadute in VoyageSmart.

## Panoramica

VoyageSmart dispone già di un endpoint API (`/api/cron/check-subscriptions`) che verifica e aggiorna le sottoscrizioni scadute. Tuttavia, questo endpoint deve essere chiamato periodicamente per funzionare correttamente. Configureremo un cron job che chiama questo endpoint una volta al giorno.

## Opzioni di Implementazione

### 1. Vercel Cron Jobs (Consigliato)

Se l'applicazione è ospitata su Vercel, puoi utilizzare i [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs).

#### Configurazione:

1. Crea un file `vercel.json` nella root del progetto:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-subscriptions",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Questo configurerà un cron job che chiama l'endpoint ogni giorno a mezzanotte.

2. Assicurati che il tuo piano Vercel supporti i cron job (disponibili nei piani Pro e Enterprise).

### 2. AWS EventBridge con Lambda

Se preferisci utilizzare AWS:

1. Crea una funzione Lambda che chiama l'endpoint:

```javascript
const https = require('https');

exports.handler = async (event) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'your-app-domain.com',
      port: 443,
      path: '/api/cron/check-subscriptions',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
};
```

2. Configura una regola EventBridge per eseguire la funzione Lambda ogni giorno:
   - Vai alla console AWS EventBridge
   - Crea una nuova regola
   - Seleziona "Schedule" come tipo di regola
   - Imposta l'espressione cron a `0 0 * * ? *` (ogni giorno a mezzanotte)
   - Seleziona la tua funzione Lambda come target

### 3. GitHub Actions

Puoi anche utilizzare GitHub Actions per eseguire un cron job:

1. Crea un file `.github/workflows/check-subscriptions.yml`:

```yaml
name: Check Expired Subscriptions

on:
  schedule:
    - cron: '0 0 * * *'  # Ogni giorno a mezzanotte

jobs:
  check-subscriptions:
    runs-on: ubuntu-latest
    steps:
      - name: Call subscription check endpoint
        run: |
          curl -X GET "https://your-app-domain.com/api/cron/check-subscriptions" \
          -H "Authorization: Bearer ${{ secrets.CRON_API_KEY }}"
```

2. Aggiungi il tuo `CRON_API_KEY` ai segreti del repository GitHub.

## Sicurezza

Per proteggere l'endpoint da chiamate non autorizzate:

1. Genera una chiave API segreta:
   ```
   openssl rand -base64 32
   ```

2. Aggiungi questa chiave come variabile d'ambiente `CRON_API_KEY` nel tuo ambiente di produzione.

3. Assicurati che l'endpoint verifichi questa chiave API, come già implementato nel codice:
   ```typescript
   const authHeader = request.headers.get('authorization');
   const apiKey = process.env.CRON_API_KEY;
   
   if (apiKey && (!authHeader || authHeader !== `Bearer ${apiKey}`)) {
     return NextResponse.json(
       { error: 'Unauthorized' },
       { status: 401 }
     );
   }
   ```

## Monitoraggio

Per assicurarti che il cron job funzioni correttamente:

1. Aggiungi log dettagliati nell'endpoint `/api/cron/check-subscriptions`
2. Configura avvisi in caso di errori
3. Considera l'implementazione di un sistema di monitoraggio come Sentry per tracciare eventuali problemi

## Test

Prima di implementare in produzione:

1. Testa l'endpoint manualmente per assicurarti che funzioni correttamente
2. Crea alcune sottoscrizioni di test con date di scadenza imminenti
3. Verifica che le sottoscrizioni vengano aggiornate correttamente dopo la chiamata all'endpoint

## Implementazione Futura

In futuro, considera di migliorare il sistema con:

1. Notifiche email agli utenti quando la loro sottoscrizione sta per scadere
2. Dashboard amministrativa per monitorare lo stato delle sottoscrizioni
3. Rapporti periodici sulle metriche delle sottoscrizioni (conversioni, churn, etc.)
