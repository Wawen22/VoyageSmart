/**
 * Intelligent Parsing Service
 * Servizio per interpretare intelligentemente le risposte dell'utente
 */

import { parse, format, isValid } from 'date-fns';
import { it } from 'date-fns/locale';

/**
 * Interpreta una data scritta in linguaggio naturale
 */
export function parseNaturalDate(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();
  
  // Patterns per date in italiano
  const datePatterns = [
    // Formato ISO: 2025-04-25
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // Formato europeo: 25/04/2025, 25-04-2025
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // Formato americano: 04/25/2025
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  ];

  // Prova i pattern numerici
  for (const pattern of datePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let year, month, day;
      
      if (pattern === datePatterns[0]) { // ISO format
        [, year, month, day] = match;
      } else if (pattern === datePatterns[1]) { // European format
        [, day, month, year] = match;
      } else { // American format
        [, month, day, year] = match;
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    }
  }

  // Pattern per date in linguaggio naturale italiano
  const naturalPatterns = [
    // "25 aprile 2025", "25 aprile", "aprile 25"
    /(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?/,
    // "aprile 25 2025", "aprile 25"
    /(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{1,2})(?:\s+(\d{4}))?/
  ];

  const monthMap: Record<string, number> = {
    gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
    luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12
  };

  for (const pattern of naturalPatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let day: number, month: number, year: number;
      const currentYear = new Date().getFullYear();
      
      if (pattern === naturalPatterns[0]) {
        // "25 aprile 2025"
        day = parseInt(match[1]);
        month = monthMap[match[2]];
        year = match[3] ? parseInt(match[3]) : currentYear;
      } else {
        // "aprile 25 2025"
        month = monthMap[match[1]];
        day = parseInt(match[2]);
        year = match[3] ? parseInt(match[3]) : currentYear;
      }
      
      const date = new Date(year, month - 1, day);
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd');
      }
    }
  }

  // Pattern per date relative
  const today = new Date();
  const relativePatterns = [
    { pattern: /oggi/, offset: 0 },
    { pattern: /domani/, offset: 1 },
    { pattern: /dopodomani/, offset: 2 },
    { pattern: /fra (\d+) giorni?/, offset: null },
    { pattern: /tra (\d+) giorni?/, offset: null }
  ];

  for (const { pattern, offset } of relativePatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let targetDate: Date;
      
      if (offset !== null) {
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + offset);
      } else {
        // Pattern con numero di giorni
        const days = parseInt(match[1]);
        targetDate = new Date(today);
        targetDate.setDate(today.getDate() + days);
      }
      
      return format(targetDate, 'yyyy-MM-dd');
    }
  }

  return null;
}

/**
 * Interpreta il tipo di accommodation
 */
export function parseAccommodationType(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();
  console.log('=== parseAccommodationType ===');
  console.log('Input:', input);
  console.log('Clean input:', cleanInput);

  // Prima controlla se è un valore diretto valido
  const validTypes = ['hotel', 'apartment', 'hostel', 'house', 'villa', 'resort', 'camping', 'other'];
  console.log('Valid types:', validTypes);
  console.log('Checking if cleanInput is in validTypes:', validTypes.includes(cleanInput));

  if (validTypes.includes(cleanInput)) {
    console.log(`✅ Direct match found! Returning: ${cleanInput}`);
    return cleanInput;
  }

  const typeMap: Record<string, string[]> = {
    hotel: ['hotel', 'albergo', 'grand hotel', 'boutique hotel'],
    apartment: ['appartamento', 'casa', 'airbnb', 'casa vacanze', 'appartamentino', 'monolocale', 'bilocale'],
    hostel: ['ostello', 'hostel', 'backpacker'],
    house: ['casa', 'villetta', 'casetta', 'abitazione'],
    villa: ['villa', 'villa di lusso', 'dimora'],
    resort: ['resort', 'villaggio turistico', 'club'],
    camping: ['camping', 'campeggio', 'camper', 'tenda'],
    other: ['altro', 'diverso', 'non so']
  };

  // Cerca corrispondenze esatte o parziali
  for (const [type, keywords] of Object.entries(typeMap)) {
    for (const keyword of keywords) {
      console.log(`Checking if "${cleanInput}" includes "${keyword}"`);
      if (cleanInput.includes(keyword)) {
        console.log(`Match found! Returning: ${type}`);
        return type;
      }
    }
  }

  console.log('No match found, returning null');
  return null;
}

/**
 * Interpreta la valuta
 */
export function parseCurrency(input: string): string | null {
  const cleanInput = input.toLowerCase().trim();
  console.log('=== parseCurrency ===');
  console.log('Input:', input);
  console.log('Clean input:', cleanInput);

  // Prima controlla se è un codice valuta diretto
  const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD'];
  const upperInput = cleanInput.toUpperCase();
  console.log('Upper input:', upperInput);
  console.log('Valid currencies:', validCurrencies);
  console.log('Is valid currency:', validCurrencies.includes(upperInput));

  if (validCurrencies.includes(upperInput)) {
    console.log(`✅ Direct currency match found! Returning: ${upperInput}`);
    return upperInput;
  }

  const currencyMap: Record<string, string[]> = {
    EUR: ['euro', 'eur', '€', 'europa'],
    USD: ['dollaro', 'usd', '$', 'dollar', 'americano'],
    GBP: ['sterlina', 'gbp', '£', 'pound', 'inglese', 'britannica'],
    CHF: ['franco', 'chf', 'svizzero', 'svizzera'],
    JPY: ['yen', 'jpy', '¥', 'giapponese'],
    CAD: ['dollaro canadese', 'cad', 'canadese']
  };

  for (const [currency, keywords] of Object.entries(currencyMap)) {
    for (const keyword of keywords) {
      console.log(`Checking if "${cleanInput}" includes "${keyword}"`);
      if (cleanInput.includes(keyword)) {
        console.log(`Currency match found! Returning: ${currency}`);
        return currency;
      }
    }
  }

  console.log('No currency match found, returning null');
  return null;
}

/**
 * Interpreta un numero/costo, possibilmente con valuta
 */
export function parseNumber(input: string): number | null {
  const cleanInput = input.replace(/[^\d.,]/g, '').replace(',', '.');
  const number = parseFloat(cleanInput);

  if (isNaN(number) || number < 0) {
    return null;
  }

  return number;
}

/**
 * Interpreta costo e valuta insieme (es. "320 euro", "150 USD")
 */
export function parseCostWithCurrency(input: string): {
  cost: number | null;
  currency: string | null;
} {
  const cleanInput = input.trim();
  console.log('=== parseCostWithCurrency ===');
  console.log('Input:', cleanInput);

  // Pattern per riconoscere numero + valuta
  const patterns = [
    // "320 euro", "150 dollari", "50 sterline"
    /(\d+(?:[.,]\d+)?)\s*(euro|eur|€|dollaro|dollari|usd|\$|sterlina|sterline|gbp|£|franco|franchi|chf|yen|jpy|¥)/i,
    // "€320", "$150", "£50"
    /(€|\$|£|¥)\s*(\d+(?:[.,]\d+)?)/i,
    // Solo numero
    /^(\d+(?:[.,]\d+)?)$/
  ];

  for (const pattern of patterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      let cost: number;
      let currencyText: string;

      if (pattern === patterns[0]) {
        // Numero + valuta testuale
        cost = parseFloat(match[1].replace(',', '.'));
        currencyText = match[2].toLowerCase();
      } else if (pattern === patterns[1]) {
        // Simbolo + numero
        currencyText = match[1];
        cost = parseFloat(match[2].replace(',', '.'));
      } else {
        // Solo numero
        cost = parseFloat(match[1].replace(',', '.'));
        console.log('Only number found:', cost);
        return { cost, currency: null };
      }

      // Mappa i simboli e testi alle valute
      const currencyMap: Record<string, string> = {
        'euro': 'EUR', 'eur': 'EUR', '€': 'EUR',
        'dollaro': 'USD', 'dollari': 'USD', 'usd': 'USD', '$': 'USD',
        'sterlina': 'GBP', 'sterline': 'GBP', 'gbp': 'GBP', '£': 'GBP',
        'franco': 'CHF', 'franchi': 'CHF', 'chf': 'CHF',
        'yen': 'JPY', 'jpy': 'JPY', '¥': 'JPY'
      };

      const currency = currencyMap[currencyText] || null;
      console.log('Parsed cost:', cost, 'currency:', currency);

      if (!isNaN(cost) && cost >= 0) {
        return { cost, currency };
      }
    }
  }

  console.log('No cost/currency pattern matched');
  return { cost: null, currency: null };
}

/**
 * Interpreta risposte di conferma
 */
export function parseConfirmation(input: string): boolean | null {
  const cleanInput = input.toLowerCase().trim();
  
  const positiveResponses = [
    'sì', 'si', 'yes', 'ok', 'okay', 'va bene', 'perfetto', 'confermo', 
    'conferma', 'salva', 'procedi', 'continua', 'esatto', 'corretto', 'giusto'
  ];
  
  const negativeResponses = [
    'no', 'non', 'annulla', 'cancel', 'stop', 'ferma', 'sbagliato', 
    'non salvare', 'non va bene', 'non confermo'
  ];

  // Controlla risposte positive
  for (const response of positiveResponses) {
    if (cleanInput.includes(response)) {
      return true;
    }
  }

  // Controlla risposte negative
  for (const response of negativeResponses) {
    if (cleanInput.includes(response)) {
      return false;
    }
  }

  return null;
}

/**
 * Estrae informazioni di contatto (email, telefono)
 */
export function parseContactInfo(input: string): string | null {
  const cleanInput = input.trim();
  
  // Pattern per email
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = cleanInput.match(emailPattern);
  
  // Pattern per telefono (vari formati)
  const phonePatterns = [
    /\+?\d{1,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/,
    /\d{3}[\s\-]?\d{3}[\s\-]?\d{4}/,
    /\d{10,}/
  ];
  
  let phoneMatch = null;
  for (const pattern of phonePatterns) {
    phoneMatch = cleanInput.match(pattern);
    if (phoneMatch) break;
  }

  // Combina email e telefono se presenti
  const parts = [];
  if (emailMatch) parts.push(emailMatch[0]);
  if (phoneMatch) parts.push(phoneMatch[0]);
  
  if (parts.length > 0) {
    return parts.join(' - ');
  }

  // Se non trova pattern specifici ma c'è del testo, restituisce il testo
  if (cleanInput.length > 0) {
    return cleanInput;
  }

  return null;
}

/**
 * Funzione principale per interpretare intelligentemente le risposte
 */
export function intelligentParse(input: string, fieldType: string): {
  success: boolean;
  value: any;
  confidence: number;
  suggestion?: string;
} {
  const cleanInput = input.trim();
  
  if (!cleanInput) {
    return { success: false, value: null, confidence: 0 };
  }

  switch (fieldType) {
    case 'date':
      const date = parseNaturalDate(cleanInput);
      return {
        success: !!date,
        value: date,
        confidence: date ? 0.9 : 0,
        suggestion: date ? `Interpretato come: ${format(new Date(date), 'dd MMMM yyyy', { locale: it })}` : undefined
      };

    case 'accommodation_type':
      console.log('=== Parsing accommodation type ===');
      console.log('Clean input:', cleanInput);
      const type = parseAccommodationType(cleanInput);
      console.log('Parsed type:', type);
      return {
        success: !!type,
        value: type,
        confidence: type ? 0.8 : 0,
        suggestion: type ? `Interpretato come: ${type}` : undefined
      };

    case 'currency':
      const currency = parseCurrency(cleanInput);
      return {
        success: !!currency,
        value: currency,
        confidence: currency ? 0.9 : 0,
        suggestion: currency ? `Interpretato come: ${currency}` : undefined
      };

    case 'number':
      // Prova prima il parsing avanzato costo+valuta
      const costWithCurrency = parseCostWithCurrency(cleanInput);
      if (costWithCurrency.cost !== null) {
        const result = {
          success: true,
          value: costWithCurrency.cost,
          confidence: 0.9,
          suggestion: costWithCurrency.currency
            ? `Interpretato come: ${costWithCurrency.cost} ${costWithCurrency.currency}`
            : `Interpretato come: ${costWithCurrency.cost}`,
          additionalData: costWithCurrency.currency ? { currency: costWithCurrency.currency } : undefined
        };
        return result;
      }

      // Fallback al parsing semplice
      const number = parseNumber(cleanInput);
      return {
        success: number !== null,
        value: number,
        confidence: number !== null ? 0.9 : 0,
        suggestion: number !== null ? `Interpretato come: ${number}` : undefined
      };

    case 'confirmation':
      const confirmation = parseConfirmation(cleanInput);
      return {
        success: confirmation !== null,
        value: confirmation,
        confidence: confirmation !== null ? 0.95 : 0,
        suggestion: confirmation !== null ? `Interpretato come: ${confirmation ? 'Sì' : 'No'}` : undefined
      };

    case 'contact':
      const contact = parseContactInfo(cleanInput);
      return {
        success: !!contact,
        value: contact,
        confidence: contact ? 0.7 : 0,
        suggestion: contact ? `Interpretato come: ${contact}` : undefined
      };

    default:
      // Per campi di testo libero (nome, indirizzo, note)
      return {
        success: true,
        value: cleanInput,
        confidence: 1.0
      };
  }
}
