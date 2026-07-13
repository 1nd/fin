// CCA: 1
const id = {
  auth: {
    signIn: {
      title: 'Selamat datang di Fin',
      description: 'Login dengan Google untuk memulai. Data Anda hanya disimpan di browser ini.',
      button: 'Login dengan Google',
    },
    signOut: {
      button: 'Keluar',
    },
  },
  settings: {
    language: {
      label: 'Bahasa',
      options: {
        en: 'English',
        id: 'Bahasa Indonesia',
      },
    },
    numberFormat: {
      label: 'Format angka',
      options: {
        'id-ID': 'Indonesia',
        'en-US': 'AS',
      },
    },
    dateFormat: {
      label: 'Format tanggal',
      options: {
        'YYYY-MM-DD': 'Tahun-Bulan-Hari',
        'DD-MM-YYYY': 'Hari-Bulan-Tahun',
        'MM-DD-YYYY': 'Bulan-Hari-Tahun',
      },
    },
  },
} as const;

export default id;
