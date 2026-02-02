-- Script SQL para crear la tabla work_centers
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.work_centers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.work_centers ENABLE ROW LEVEL SECURITY;

-- Create policy (allow public access for demo, secure in production)
CREATE POLICY "Allow public access to work_centers" 
ON public.work_centers 
FOR ALL 
USING (true);

-- Optional: Insert sample data
INSERT INTO public.work_centers (name, address, description)
VALUES 
    ('Oficina Central', 'Calle Mayor 123, Madrid', 'Sede principal de la empresa'),
    ('Almacén Norte', 'Polígono Industrial, Barcelona', 'Centro de distribución principal')
ON CONFLICT DO NOTHING;
