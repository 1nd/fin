// CCA: 1
const en = {
  common: {
    loading: 'Loading…',
    retry: 'Retry',
    confirm: 'Confirm',
    cancel: 'Cancel',
  },
  nav: {
    dashboard: 'Dashboard',
    categories: 'Categories',
    entries: 'Entries',
    reports: 'Reports',
    settings: 'Settings',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    categoryReparentCycle:
      "A category can't be moved under itself or one of its own subcategories.",
  },
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
  categories: {
    title: 'Categories',
    entityTypes: {
      asset: 'Assets',
      liability: 'Liabilities',
      income: 'Income',
      expense: 'Expenses',
    },
    empty: 'No categories yet.',
    addRoot: 'Add category',
    addChild: 'Add subcategory',
    rename: 'Rename',
    delete: 'Delete',
    move: 'Move',
    moveHere: 'Move here',
    moveToTopLevel: 'Move to top level',
    cancelMove: 'Cancel move',
    namePlaceholder: 'Category name',
    save: 'Save',
    cancel: 'Cancel',
    confirmDelete: 'Delete this category? Its entries and subcategories move to its parent.',
    deleteConfirmTitle: 'Delete category?',
    loadError: 'Your categories could not be loaded.',
  },
} as const;

export default en;
