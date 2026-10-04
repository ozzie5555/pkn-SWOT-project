/**
 * src/data.js
 * ---------------------------------------------------------------------------
 * SATU-SATUNYA SUMBER KONTEN untuk halaman "Analisis SWOT Ibu Kota Nusantara".
 * Semua komponen HANYA membaca dari file ini. Untuk mengganti materi, cukup
 * ubah nilai di sini tanpa menyentuh kode komponen.
 *
 * CATATAN: array `latarBelakang`, `swot`, dan `timeline` berisi data sesuai
 * brief dan TIDAK diubah. Blok `meta` hanya berisi teks antarmuka (judul
 * halaman, label bagian, placeholder footer) yang tidak memuat fakta/angka baru.
 * ---------------------------------------------------------------------------
 */

/* ------------------------------- Teks UI --------------------------------- */

export const meta = {
  judul: 'Analisis SWOT Ibu Kota Nusantara (IKN)',
  subjudul:
    'Ringkasan kekuatan, kelemahan, peluang, dan ancaman pembangunan Ibu Kota Nusantara.',
  tombolMulai: 'Mulai Jelajahi',
  labelJelajahi: 'Jelajahi analisis',
  // Label untuk indikator progres baca di header.
  progresBaca: 'Progres baca halaman',
  // Ticker mono di bawah hero. HANYA kata kunci yang sudah muncul di konten
  // (tidak ada fakta/angka baru) — fungsinya mengikat pembaca ke tema.
  marquee: [
    'Smart Forest City',
    'Net-Zero 2045',
    'Kalimantan Timur',
    'Indonesia-sentris',
    'Kawasan Inti Pusat Pemerintahan',
    'Otorita IKN',
  ],
  section: {
    latarBelakang: {
      judul: 'Latar Belakang',
      deskripsi:
        'Alasan di balik pemindahan ibu kota negara dari Jakarta ke Kalimantan Timur.',

      // Angka sorotan — SEMUA nilainya diambil dari deskripsi latarBelakang di
      // bawah (bukan fakta/angka baru), hanya disajikan ulang sebagai chip.
      stats: [
        { nilai: '> 57%', label: 'PDB nasional terpusat di Pulau Jawa' },
        { nilai: '75%', label: 'Wilayah dialokasikan sebagai kawasan hijau' },
        { nilai: '2045', label: 'Target emisi net-zero (Smart Forest City)' },
      ],

      // Peta Indonesia (bab 01). Koordinat peta sudah diverifikasi di
      // src/lib/peta-data.js. Jarak dihitung (haversine) dari pusat IKN
      // 0,973°S 116,699°E — angka nyata, bukan karangan.
      //
      // `diPeta: false` = tidak digambar sebagai titik di peta karena terlalu
      // berdekatan dengan IKN (skala peta tidak memisahkannya dengan jujur);
      // tetap ditampilkan di daftar sebagai kota rujukan.
      peta: {
        judul: 'Peta Sebaran Ibu Kota Nusantara',
        keterangan:
          'Titik IKN berada di Kabupaten Penajam Paser Utara dan Kutai Kartanegara, Kalimantan Timur. Posisi titik sudah diverifikasi terhadap koordinat aslinya — zoom untuk melihat nama tiap provinsi, atau klik provinsi untuk memilihnya.',
        // Angka ringkas di bawah peta — SEMUA fakta nyata (bukan karangan):
        // 34 provinsi = jumlah provinsi Indonesia saat ini; Indonesia
        // dilewati garis khatulistiwa; IKN 0,973°S → ~108 km di selatannya.
        fakta: [
          { nilai: '34', label: 'Provinsi di Indonesia' },
          { nilai: '0,973° S', label: 'Lintang IKN dari khatulistiwa' },
          { nilai: '± 108 km', label: 'Jarak IKN ke garis khatulistiwa' },
          { nilai: '± 1.240 km', label: 'Jarak Jakarta ke IKN' },
        ],
        titik: [
          {
            nama: 'Ibu Kota Nusantara',
            singkat: 'IKN',
            peran: 'Ibu kota baru',
            x: 371.8,
            y: 143.4,
            utama: true,
          },
          {
            nama: 'Jakarta',
            singkat: 'Jakarta',
            peran: 'Ibu kota lama · ± 1.240 km dari IKN',
            x: 201,
            y: 234,
            lama: true,
          },
          {
            nama: 'Samarinda',
            peran: 'Kota terdekat · ± 70 km dari IKN',
            x: 380,
            y: 135,
            diPeta: false,
          },
          {
            nama: 'Balikpapan',
            peran: 'Kota terdekat · ± 40 km dari IKN',
            x: 374,
            y: 149,
            diPeta: false,
          },
        ],
      },
    },
    swot: {
      judul: 'Analisis SWOT',
      deskripsi:
        'Buka tiap baris untuk melihat definisi teori dan tiga poin konkretnya.',
    },
    timeline: {
      judul: 'Timeline Pembangunan',
      deskripsi: 'Empat tahap besar pembangunan Ibu Kota Nusantara hingga 2045.',
    },
    diskusi: {
      judul: 'Aspirasi & Diskusi',
      deskripsi:
        'Sampaikan pandangan kritis, pertanyaan, atau masukan untuk sesi diskusi presentasi.',
      kategoriOpsi: ['Pertanyaan', 'Pandangan', 'Saran'],
    },
  },
  footer: {
    judulAnggota: 'Anggota Kelompok',
    deskripsiAnggota:
      'Tim penyusun dan pengembang media pembelajaran Analisis SWOT Ibu Kota Nusantara.',
    anggota: [
      { id: 1, nama: 'Amaris Wursita', role: 'Anggota Kelompok' },
      { id: 2, nama: 'Krisna Mandala Putra', role: 'Anggota Kelompok' },
      { id: 3, nama: 'Lathifa Ramadanti Putri', role: 'Anggota Kelompok' },
      { id: 4, nama: 'Lukas Danu Saptaji', role: 'Anggota Kelompok' },
      { id: 5, nama: 'Rieva Asancaya Aneela El Daviq', role: 'Anggota Kelompok' },
      { id: 6, nama: 'Restu Galih Pratama', role: 'Anggota Kelompok' },
      { id: 7, nama: 'Satrya Panji Atmoko Siregar', role: 'Anggota Kelompok' },
      { id: 8, nama: 'Theodora Ovrisa Ersalina', role: 'Anggota Kelompok' },
    ],
    kredit: 'Dibuat sebagai media pembelajaran. Konten disusun dari data yang tersedia.',
  },
}

/* ----------------------------- Latar Belakang ---------------------------- */

export const latarBelakang = [
  { judul: "Daya Dukung Lingkungan dan Kepadatan Jakarta", deskripsi: "Jakarta menghadapi penurunan muka tanah (land subsidence), potensi banjir rob, polusi udara, dan kemacetan kronis. Pemisahan fungsi tata kelola negara dari pusat bisnis bertujuan menurunkan beban ekologis kota metropolitan lama." },
  { judul: "Pemerataan Perekonomian (Indonesia-sentris)", deskripsi: "Aktivitas ekonomi terkonsentrasi di Pulau Jawa yang menyumbang lebih dari 57% PDB nasional. Pemindahan ke Kalimantan Timur diarahkan memicu titik pertumbuhan ekonomi baru di Indonesia tengah dan timur." },
  { judul: "Visi Smart Forest City", deskripsi: "Dibangun dari nol dengan penataan ruang terencana. 75% wilayah dialokasikan sebagai kawasan hijau, memanfaatkan energi baru terbarukan, dan menargetkan emisi net-zero pada 2045." }
];

/* -------------------------------- Analisis ------------------------------- */

export const swot = [
  {
    kategori: "Strengths", label: "Kekuatan", warna: "green",
    teori: "Keunggulan atau sumber daya internal yang sudah dimiliki secara sah dan menjadi modal dasar keberhasilan proyek.",
    poin: [
      { judul: "Penguasaan Lahan Negara", deskripsi: "Mayoritas lahan inti pemerintahan memakai area eks Hutan Tanaman Industri (HTI) milik negara, sehingga biaya pengadaan lahan dan konflik pembebasan tanah lebih kecil dibanding kota padat." },
      { judul: "Kekuatan Payung Hukum", deskripsi: "Kewenangan IKN berdasar UU No. 3 Tahun 2022 (jo. UU No. 21 Tahun 2023) yang memberi otonomi khusus kepada Otorita IKN." },
      { judul: "Lokasi Geografis yang Terhubung", deskripsi: "Berada di tengah kepulauan nusantara, dekat jalur pelayaran ALKI II, dan diapit dua kota penyangga mapan: Balikpapan dan Samarinda." }
    ]
  },
  {
    kategori: "Weaknesses", label: "Kelemahan", warna: "red",
    teori: "Keterbatasan kapasitas internal, defisit sarana, atau beban biaya awal yang harus ditanggung organisasi.",
    poin: [
      { judul: "Ketergantungan Anggaran Awal pada Kas Negara", deskripsi: "Pada fase awal, infrastruktur dasar (bendungan, sanitasi air minum, jalan tol KIPP) masih sangat bergantung pada APBN sebelum investasi swasta masuk penuh." },
      { judul: "Ekosistem Penunjang Hidup Masih Terbatas", deskripsi: "Fasilitas komunitas seperti sekolah bertaraf internasional, rumah sakit spesialis, pusat perbelanjaan, dan hiburan belum sepenuhnya lengkap bagi ASN tahap pertama." },
      { judul: "Kendala Rekayasa Tanah", deskripsi: "Tanah lempung serpih (clay shale) di beberapa zona konstruksi butuh teknik stabilisasi dan fondasi khusus yang menambah biaya dan waktu pengerjaan." }
    ]
  },
  {
    kategori: "Opportunities", label: "Peluang", warna: "blue",
    teori: "Faktor positif dari lingkungan eksternal dan tren makro yang bisa dimanfaatkan untuk akselerasi pertumbuhan.",
    poin: [
      { judul: "Arus Pembiayaan Hijau Global (ESG)", deskripsi: "Konsep kota netral karbon membuka peluang pendanaan berkelanjutan (green bonds) dari lembaga keuangan multilateral dunia." },
      { judul: "Kutub Baru Industri Kawasan Timur", deskripsi: "Mendorong ekspansi logistik kelautan, teknologi bersih, dan rantai pasok hilirisasi di Kalimantan dan Sulawesi." },
      { judul: "Pemberdayaan Birokrasi Digital Sepenuhnya", deskripsi: "Peluang menerapkan smart governance dan sistem paperless tanpa hambatan infrastruktur lama." }
    ]
  },
  {
    kategori: "Threats", label: "Ancaman", warna: "orange",
    teori: "Risiko dan ketidakpastian eksternal di luar kendali langsung perencana yang berpotensi menghambat tujuan.",
    poin: [
      { judul: "Ketidakpastian Minat Investor Swasta Global", deskripsi: "Suku bunga acuan global yang tinggi dan gejolak geopolitik dapat membuat investor luar negeri bersikap wait and see." },
      { judul: "Dampak Fragmentasi Ekologis", deskripsi: "Risiko terganggunya koridor pergerakan satwa endemik (orangutan, bekantan) jika pengawasan zonasi hijau di luar wilayah inti tidak konsisten." },
      { judul: "Dinamika Sosial dan Batas Wilayah Adat", deskripsi: "Potensi sengketa tanah adat/ulayat di wilayah penyangga jika mitigasi sosial dan afirmasi masyarakat lokal kurang transparan." }
    ]
  }
];

/* -------------------------------- Timeline ------------------------------- */

export const timeline = [
  { periode: "2022–2024", judul: "Fondasi Utama KIPP", deskripsi: "Pembangunan Kawasan Inti Pusat Pemerintahan: Istana Kepresidenan, kantor menteri koordinator, hunian ASN, serta suplai air dan listrik dasar." },
  { periode: "2025–2029", judul: "Pemindahan Bertahap", deskripsi: "Pemindahan bertahap pegawai kementerian/lembaga serta ekspansi fasilitas komersial, pendidikan, dan kesehatan swasta." },
  { periode: "2030–2039", judul: "Pengembangan Klaster", deskripsi: "Klaster industri ramah lingkungan, inovasi digital, dan perluasan sistem transportasi terpadu." },
  { periode: "2040–2045", judul: "Kota Mandiri Net-Zero", deskripsi: "IKN beroperasi penuh sebagai kota mandiri bertaraf internasional yang inklusif dan beremisi net-zero." }
];
