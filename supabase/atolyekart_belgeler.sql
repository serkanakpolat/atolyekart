-- AtölyeKart bilgi bankası (Supabase RAG akışları için)
-- Supabase > SQL Editor'de bir kez çalıştır. Tekrar çalıştırmak güvenli (if not exists / or replace).
--
-- Embedding: Gemini gemini-embedding-001 → 3072 boyut. pgvector'ün HNSW/IVFFlat indeksleri en fazla
-- 2000 boyutu destekler; tablo birkaç düzine satır olduğu için indekssiz tam tarama yeterince hızlı.

create extension if not exists vector;

create table if not exists public.atolyekart_belgeler (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(3072)
);

-- Kategoriye göre silme ve filtreleme için
create index if not exists atolyekart_belgeler_kategori_idx
  on public.atolyekart_belgeler ((metadata->>'kategori'));

-- n8n Supabase Vector Store'un çağırdığı arama fonksiyonu (Options > Query Name).
-- filter: araçtaki metadata filtresi, ör. {"kategori": "sss"}
create or replace function public.match_atolyekart_belgeler (
  query_embedding vector(3072),
  match_count int default null,
  filter jsonb default '{}'
) returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (atolyekart_belgeler.embedding <=> query_embedding) as similarity
  from public.atolyekart_belgeler
  where metadata @> filter
  order by atolyekart_belgeler.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Tarayıcıdan (anon/publishable anahtar) erişim kapalı; n8n secret (service_role) anahtarla RLS'i aşar.
alter table public.atolyekart_belgeler enable row level security;

-- Yeni Supabase projeleri SQL ile açılan tablolara API rollerinin yetkisini otomatik vermiyor;
-- verilmezse n8n "permission denied for table atolyekart_belgeler (403)" alır. Yalnızca service_role'e verilir.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.atolyekart_belgeler to service_role;
grant usage, select on sequence public.atolyekart_belgeler_id_seq to service_role;
grant execute on function public.match_atolyekart_belgeler(vector, int, jsonb) to service_role;
