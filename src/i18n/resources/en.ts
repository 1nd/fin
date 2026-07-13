// CCA: 1
const en = {
  auth: {
    signIn: {
      title: 'Welcome to Fin',
      description: 'Sign in with Google to get started. Your data is stored only in this browser.',
      button: 'Sign in with Google',
    },
    signOut: {
      button: 'Sign out',
    },
  },
  settings: {
    language: {
      label: 'Language',
      options: {
        en: 'English',
        id: 'Bahasa Indonesia',
      },
    },
    numberFormat: {
      label: 'Number format',
      options: {
        'id-ID': 'Indonesian',
        'en-US': 'US',
      },
    },
    dateFormat: {
      label: 'Date format',
      options: {
        'YYYY-MM-DD': 'Year-Month-Day',
        'DD-MM-YYYY': 'Day-Month-Year',
        'MM-DD-YYYY': 'Month-Day-Year',
      },
    },
  },
} as const;

export default en;
