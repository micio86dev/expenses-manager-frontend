// Italian is the source of truth for the message schema: `en` must satisfy `Messages`.
const it = {
  app: {
    name: 'Expenses manager',
    skipToContent: 'Vai al contenuto',
    loading: 'Caricamento in corso',
  },
  nav: {
    label: 'Navigazione principale',
    dashboard: 'Panoramica',
    expenses: 'Spese',
    categories: 'Categorie',
    settings: 'Impostazioni',
  },
  auth: {
    email: 'Email',
    password: 'Password',
    name: 'Nome',
    login: {
      title: 'Accedi',
      subtitle: 'Bentornato. Accedi per vedere le tue spese.',
      submit: 'Accedi',
      switchPrompt: 'Non hai un account?',
      switchAction: 'Registrati',
    },
    register: {
      title: 'Crea un account',
      subtitle: 'Bastano pochi secondi per iniziare a tenere traccia delle spese.',
      passwordHint: 'Almeno 8 caratteri.',
      submit: 'Crea account',
      switchPrompt: 'Hai già un account?',
      switchAction: 'Accedi',
    },
  },
  dashboard: {
    title: 'Panoramica',
    empty: {
      title: 'Ancora nessun dato',
      description: 'Quando registrerai le prime spese, qui vedrai come stai spendendo.',
    },
  },
  expenses: {
    title: 'Spese',
    empty: {
      title: 'Nessuna spesa registrata',
      description: 'Le spese che aggiungerai compariranno qui, raggruppate per giorno.',
    },
  },
  categories: {
    title: 'Categorie',
    empty: {
      title: 'Nessuna categoria',
      description: 'Le categorie ti aiutano a capire dove vanno i tuoi soldi.',
    },
  },
  settings: {
    title: 'Impostazioni',
    language: {
      label: 'Lingua',
      description: 'La scelta viene ricordata su questo dispositivo e nel tuo account.',
    },
    account: {
      title: 'Account',
      logout: 'Esci',
    },
  },
  errors: {
    network: 'Impossibile raggiungere il server. Controlla la connessione e riprova.',
    unknown: 'Qualcosa è andato storto. Riprova tra poco.',
    sessionExpired: 'La sessione è scaduta. Accedi di nuovo.',
  },
}

export type Messages = typeof it
export default it
