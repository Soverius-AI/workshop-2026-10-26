import { practice } from './database.mjs';
import { embedTexts } from './artifacts.mjs';

export async function searchDocuments(question: string) {
  const [vector] = await embedTexts([question], 'query');
  const { rows } = await practice.query(`
    SELECT id, source, title, section, page, content AS text,
           1 - (embedding <=> $1::vector) AS score
    FROM practice.chunks
    WHERE space_id = $2 AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT 5
  `, [JSON.stringify(vector), process.env.EMBED_SPACE_ID]);
  return { hits: rows };
}
