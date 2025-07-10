import { GoogleGenerativeAI } from '@google/generative-ai';

// Inizializza l'API Gemini con la chiave API
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

// Funzione per generare una risposta dal modello Gemini
export async function generateChatResponse(
  prompt: string,
  history: { role: 'user' | 'model', parts: string }[] = [],
  tripContext?: any
) {
  try {
    // Usa il modello Gemini 2.0 Flash Experimental per il chat
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Crea un contesto iniziale per il chatbot
    let systemPrompt = `Sei un assistente di viaggio intelligente per l'app VoyageSmart.
Il tuo compito è aiutare l'utente con la pianificazione e la gestione del suo viaggio.
Rispondi in modo conciso, amichevole e utile. Fornisci suggerimenti pratici e pertinenti.
Usa un tono conversazionale ma professionale.

LINEE GUIDA PER LA FORMATTAZIONE DELLE RISPOSTE:
1. NON iniziare MAI le tue risposte con "Ciao!" o altri saluti generici.
2. Rispondi direttamente alla domanda dell'utente in modo naturale e conversazionale.
3. Quando mostri elenchi di elementi (alloggi, trasporti, attività), usa una formattazione chiara con:
   - Interruzioni di riga tra elementi diversi
   - Asterischi (**) per evidenziare i titoli delle sezioni
   - Elenchi puntati per elementi multipli dello stesso tipo
4. Mantieni le risposte concise ma complete, evitando ripetizioni inutili.
5. Usa sempre una linea vuota tra elementi di un elenco quando contengono più di una riga di informazioni.`;

    // Aggiungi il contesto del viaggio se disponibile
    if (tripContext) {
      systemPrompt += `\n\nInformazioni sul viaggio attuale:

**Dettagli base:**
- Nome: ${tripContext.name || 'Non specificato'}
- Destinazione: ${tripContext.destination || 'Non specificata'}
- Date: ${tripContext.startDate ? `Dal ${tripContext.startDate} al ${tripContext.endDate}` : 'Non specificate'}
${tripContext.participants ? `- Partecipanti: ${tripContext.participants.length}` : ''}
${tripContext.weather ? `- Meteo: ${JSON.stringify(tripContext.weather)}` : ''}

**Dettagli aggiuntivi:**
${tripContext.accommodations ? `- Alloggi: ${tripContext.accommodations.length} prenotati` : ''}
${tripContext.transportation ? `- Trasporti: ${tripContext.transportation.length} prenotati` : ''}
${tripContext.activities ? `- Attività: ${tripContext.activities.length} pianificate` : ''}
${tripContext.expenses ? `- Budget: ${tripContext.expenses.total} ${tripContext.expenses.currency}` : ''}

IMPORTANTE: Quando mostri questi dettagli all'utente, formattali in modo chiaro e organizzato, con una separazione visiva tra le diverse sezioni.`;
    }

    // Prepara la chat
    const chat = model.startChat({
      history: history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Invia il messaggio e ottieni la risposta
    const result = await chat.sendMessage(prompt);
    const response = result.response;

    return {
      success: true,
      message: response.text(),
    };
  } catch (error: any) {
    console.error('Error generating chat response:', error);
    return {
      success: false,
      message: 'Mi dispiace, ho avuto un problema nel rispondere. Riprova più tardi.',
      error: error.message,
    };
  }
}
