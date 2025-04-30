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
    // Usa il modello Gemini Pro per il chat
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Crea un contesto iniziale per il chatbot
    let systemPrompt = `Sei un assistente di viaggio intelligente per l'app VoyageSmart. 
Il tuo compito è aiutare l'utente con la pianificazione e la gestione del suo viaggio.
Rispondi in modo conciso, amichevole e utile. Fornisci suggerimenti pratici e pertinenti.
Usa un tono conversazionale ma professionale.`;

    // Aggiungi il contesto del viaggio se disponibile
    if (tripContext) {
      systemPrompt += `\n\nInformazioni sul viaggio attuale:
Nome: ${tripContext.name || 'Non specificato'}
Destinazione: ${tripContext.destination || 'Non specificata'}
Date: ${tripContext.startDate ? `Dal ${tripContext.startDate} al ${tripContext.endDate}` : 'Non specificate'}
${tripContext.participants ? `Partecipanti: ${tripContext.participants.length}` : ''}
${tripContext.weather ? `Meteo: ${JSON.stringify(tripContext.weather)}` : ''}
${tripContext.accommodations ? `Alloggi: ${tripContext.accommodations.length} prenotati` : ''}
${tripContext.transportation ? `Trasporti: ${tripContext.transportation.length} prenotati` : ''}
${tripContext.activities ? `Attività: ${tripContext.activities.length} pianificate` : ''}
${tripContext.expenses ? `Budget: ${tripContext.expenses.total} ${tripContext.expenses.currency}` : ''}`;
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
