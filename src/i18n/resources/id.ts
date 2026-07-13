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
  categories: {
    title: 'Kategori',
    entityTypes: {
      asset: 'Aset',
      liability: 'Liabilitas',
      income: 'Pemasukan',
      expense: 'Pengeluaran',
    },
    empty: 'Belum ada kategori.',
    addRoot: 'Tambah kategori',
    addChild: 'Tambah subkategori',
    rename: 'Ubah nama',
    delete: 'Hapus',
    move: 'Pindahkan',
    moveHere: 'Pindahkan ke sini',
    moveToTopLevel: 'Pindahkan ke tingkat atas',
    cancelMove: 'Batalkan pemindahan',
    namePlaceholder: 'Nama kategori',
    save: 'Simpan',
    cancel: 'Batal',
    confirmDelete: 'Hapus kategori ini? Entri dan subkategorinya akan dipindahkan ke induknya.',
  },
} as const;

export default id;
