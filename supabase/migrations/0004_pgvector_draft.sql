-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to public.knowledge_items (using 1536 dimension by default)
alter table public.knowledge_items add column if not exists embedding vector(1536);

-- Create semantic match search function using cosine distance
create or replace function public.match_knowledge_items (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) returns table (
  id uuid,
  tenant_id uuid,
  title text,
  content text,
  tags text[],
  similarity float,
  metadata jsonb
) language plpgsql as $$
begin
  return query
  select
    ki.id,
    ki.tenant_id,
    ki.title,
    ki.content,
    ki.tags,
    1.0 - (ki.embedding <=> query_embedding) as similarity,
    ki.metadata
  from public.knowledge_items ki
  where ki.embedding is not null and 1.0 - (ki.embedding <=> query_embedding) > match_threshold
  order by ki.embedding <=> query_embedding
  limit match_count;
end;
$$;
