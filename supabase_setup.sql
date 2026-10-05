-- ==============================================================================
-- SKRIP SETUP LENGKAP SUPABASE UNTUK KOMENTAR, DISKUSI & MODERATOR SWOT IKN
-- ==============================================================================
-- Salin dan jalankan seluruh isi file ini di SQL Editor dashboard Supabase Anda.

-- 1. Buat Tabel Komentar (Jika belum ada)
CREATE TABLE IF NOT EXISTS public.komentar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori TEXT DEFAULT 'Pertanyaan' NOT NULL,
  pesan TEXT NOT NULL,
  terjawab BOOLEAN DEFAULT false NOT NULL,
  jawaban TEXT DEFAULT NULL,
  disembunyikan BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Jika tabel lama sudah pernah dibuat, tambahkan kolom baru jika belum ada
ALTER TABLE public.komentar 
ADD COLUMN IF NOT EXISTS jawaban TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS disembunyikan BOOLEAN DEFAULT false NOT NULL;

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.komentar ENABLE ROW LEVEL SECURITY;

-- 4. Hapus policy lama jika ada (agar aman saat di-run ulang)
DROP POLICY IF EXISTS "Siapapun bisa membaca komentar" ON public.komentar;
DROP POLICY IF EXISTS "Siapapun bisa mengirim komentar" ON public.komentar;
DROP POLICY IF EXISTS "Siapapun bisa mengupdate komentar" ON public.komentar;
DROP POLICY IF EXISTS "Siapapun bisa menghapus komentar" ON public.komentar;

-- 5. Buat Kebijakan Akses (RLS Policies)
-- a. Semua orang bisa membaca komentar
CREATE POLICY "Siapapun bisa membaca komentar"
  ON public.komentar FOR SELECT
  USING (true);

-- b. Audiens bisa mengirim komentar baru
CREATE POLICY "Siapapun bisa mengirim komentar"
  ON public.komentar FOR INSERT
  WITH CHECK (true);

-- c. Moderator bisa mengubah status, menulis jawaban, & sembunyikan komentar
CREATE POLICY "Siapapun bisa mengupdate komentar"
  ON public.komentar FOR UPDATE
  USING (true);

-- d. Moderator bisa menghapus komentar (misal: spam / iseng)
CREATE POLICY "Siapapun bisa menghapus komentar"
  ON public.komentar FOR DELETE
  USING (true);

-- 6. Aktifkan Fitur Realtime agar komentar baru, jawaban, & update langsung muncul di layar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'komentar'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.komentar;
  END IF;
END $$;
