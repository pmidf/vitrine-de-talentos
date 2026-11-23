INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'fotos-perfil',
    'fotos-perfil',
    false,
    819200,              
    ARRAY['image/jpeg']
)
ON CONFLICT (id) DO NOTHING;