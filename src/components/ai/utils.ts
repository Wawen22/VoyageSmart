// Funzione per generare un saluto casuale
export const getRandomGreeting = () => {
  const greetings = [
    "Benvenuto! Sono il tuo assistente di viaggio",
    "Salve! Sono qui per aiutarti con il tuo viaggio",
    "Buongiorno! Sono il tuo assistente personale",
    "Bentornato! Sono pronto ad assisterti",
    "A tua disposizione! Sono l'assistente di viaggio",
    "Felice di aiutarti! Sono il tuo assistente"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

// Determina la sezione corrente basata sull'URL
export const getCurrentSection = (pathname: string) => {
  if (pathname.includes('/expenses')) return 'expenses';
  if (pathname.includes('/itinerary')) return 'itinerary';
  if (pathname.includes('/accommodations')) return 'accommodations';
  if (pathname.includes('/transportation')) return 'transportation';
  if (pathname.includes('/documents')) return 'documents';
  if (pathname.includes('/media')) return 'media';
  return 'overview'; // Default per la pagina principale del viaggio
};
