import {practice,readers} from './database.mjs';
import {embedTexts,embeddingConfig} from './artifacts.mjs';
export const evidence=(r)=>r.rows.map(c=>({...c,text:c.content,content:undefined,vector:undefined,embedding:undefined}));
export async function search(b,user){
 const question=String(b.question??'').trim();if(!question||question.length>2000)throw Error('Enter a question (at most 2000 characters).');
 const secure=b.scope==='protected',pool=secure?readers[user.role]:practice,table=secure?'protected.chunks':'practice.chunks';
 const mode=b.mode??'keyword';
 if(mode==='vector'){
  if(secure)throw Error('The protected demo currently uses keyword retrieval; upload real vectors into the practice database for vector search.');
  const settings=(await pool.query('SELECT embedding FROM practice.settings WHERE id=1')).rows[0]?.embedding;
  const config=embeddingConfig();if(!settings||settings.spaceId!==config.spaceId||settings.model!==config.model||settings.documentPrefix!==config.documentPrefix||settings.queryPrefix!==config.queryPrefix)throw Error('Stored vectors and query model do not match. Re-embed and import with the current configuration.');
  const vector=(await embedTexts([question],'query'))[0];if(vector.length!==settings.dimensions)throw Error('Query dimension mismatch');
  const sql=`SELECT id,source,title,section,page,content,1-(embedding <=> $1::vector) AS score FROM practice.chunks WHERE space_id=$2 AND embedding IS NOT NULL ORDER BY embedding <=> $1::vector LIMIT 20`;
  return {question,scope:b.scope,mode,sql,dimensions:vector.length,hits:evidence(await pool.query(sql,[JSON.stringify(vector),config.spaceId]))};
 }
 if(mode!=='keyword')throw Error('Unknown retrieval mode');
 const sql=`WITH query AS (SELECT plainto_tsquery('english',$1) AS q) SELECT id,source,title,section,page,content,ts_rank_cd(to_tsvector('english',content),q) AS score FROM ${table},query WHERE to_tsvector('english',content) @@ q ORDER BY score DESC,id LIMIT 20`;
 return {question,scope:b.scope,mode,sql,hits:evidence(await pool.query(sql,[question]))};
}

export async function retrievePassages(question) {
  const result=await search({question,scope:'practice',mode:'vector'},{role:'operator'});
  return {hits:result.hits.slice(0,5)};
}
