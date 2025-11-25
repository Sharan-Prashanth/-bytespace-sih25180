-- Migration: create novelty_reports table and unique index on filename
CREATE TABLE IF NOT EXISTS public.novelty_reports (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    filename text NOT NULL,
    file_path text,
    novelty_percentage numeric,
    result jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Ensure filename is unique so upserts can target it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'novelty_reports_filename_idx'
    ) THEN
        CREATE UNIQUE INDEX novelty_reports_filename_idx ON public.novelty_reports (filename);
    END IF;
END$$;
