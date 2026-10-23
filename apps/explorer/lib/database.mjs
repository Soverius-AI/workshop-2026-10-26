import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {chunkCorpus,validateArtifact,resolveEmbeddingConfig} from './artifacts.mjs';
const common={host:process.env.PGHOST??'127.0.0.1',port:Number(process.env.PGPORT??5436),database:process.env.PGDATABASE??'raglab',connectionTimeoutMillis:5000};
export const connection=(user)=>({...common,user,password:user==='lab_admin'?(process.env.ADMIN_PASSWORD??'local-workshop-admin'):'local-workshop'});
export const practice=new pg.Pool({...connection('lab_writer'),max:5});
export const readers=Object.fromEntries(['operator','maintenance'].map(role=>[role,new pg.Pool({...connection('rag_'+role),max:4})]));
export async function initialize() {
 const db=new pg.Client(connection('lab_admin'));await db.connect();
 try{
 await db.query(`CREATE EXTENSION IF NOT EXISTS vector;
 DO $$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='lab_writer') THEN CREATE ROLE lab_writer LOGIN PASSWORD 'local-workshop' NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='rag_operator') THEN CREATE ROLE rag_operator LOGIN PASSWORD 'local-workshop' NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='rag_maintenance') THEN CREATE ROLE rag_maintenance LOGIN PASSWORD 'local-workshop' NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF;
 END $$;
 REVOKE CREATE ON SCHEMA public FROM PUBLIC;
 REVOKE TEMPORARY ON DATABASE "${common.database.replaceAll('"','""')}" FROM PUBLIC;
 CREATE SCHEMA IF NOT EXISTS practice;
 CREATE SCHEMA IF NOT EXISTS protected;
 CREATE TABLE IF NOT EXISTS practice.chunks(id text PRIMARY KEY, source text NOT NULL, title text NOT NULL, section text, page integer, content text NOT NULL, metadata jsonb NOT NULL DEFAULT '{}', embedding vector, space_id text);
 CREATE TABLE IF NOT EXISTS practice.settings(id integer PRIMARY KEY CHECK(id=1), embedding jsonb);
 CREATE TABLE IF NOT EXISTS protected.documents(id text PRIMARY KEY,title text NOT NULL,roles text[] NOT NULL);
 CREATE TABLE IF NOT EXISTS protected.chunks(id text PRIMARY KEY,source text REFERENCES protected.documents(id),title text,section text,page integer,content text NOT NULL,roles text[] NOT NULL,embedding vector);
 CREATE TABLE IF NOT EXISTS protected.links(source text REFERENCES protected.documents(id),target text REFERENCES protected.documents(id),relation text NOT NULL,PRIMARY KEY(source,target));
 ALTER TABLE protected.documents ENABLE ROW LEVEL SECURITY;
 ALTER TABLE protected.chunks ENABLE ROW LEVEL SECURITY;
 ALTER TABLE protected.links ENABLE ROW LEVEL SECURITY;
 DROP POLICY IF EXISTS role_access ON protected.documents;
 CREATE POLICY role_access ON protected.documents FOR SELECT USING (substring(current_user::text FROM 5)=ANY(roles));
 DROP POLICY IF EXISTS role_access ON protected.chunks;
 CREATE POLICY role_access ON protected.chunks FOR SELECT USING (substring(current_user::text FROM 5)=ANY(roles));
 DROP POLICY IF EXISTS role_access ON protected.links;
 CREATE POLICY role_access ON protected.links FOR SELECT USING (EXISTS(SELECT 1 FROM protected.documents d WHERE d.id=source) AND EXISTS(SELECT 1 FROM protected.documents d WHERE d.id=target));
 GRANT USAGE ON SCHEMA practice TO lab_writer;
 GRANT SELECT,INSERT,UPDATE,DELETE ON practice.chunks,practice.settings TO lab_writer;
 GRANT USAGE ON SCHEMA protected TO rag_operator,rag_maintenance;
 GRANT SELECT ON protected.documents,protected.chunks,protected.links TO rag_operator,rag_maintenance;
 ALTER ROLE lab_writer SET statement_timeout='5s';
 ALTER ROLE rag_operator SET statement_timeout='5s';
 ALTER ROLE rag_maintenance SET statement_timeout='5s';`);
 const corpus=JSON.parse(await readFile(new URL('../data/prepared-corpus.json',import.meta.url),'utf8'));
 await db.query('BEGIN');
 for(const doc of corpus.documents) await db.query('INSERT INTO protected.documents VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET title=$2,roles=$3',[doc.id,doc.title,doc.roles]);
 for(const c of chunkCorpus(corpus).chunks) await db.query('INSERT INTO protected.chunks(id,source,title,section,page,content,roles) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO UPDATE SET content=$6,roles=$7',[c.id,c.source,c.title,c.section,c.page,c.text,c.roles]);
 for(const [a,b,relation] of [['SOV-OPS-COOL-01','SOV-EQUIP-01','uses equipment register'],['SOV-EQUIP-01','DANFOSS-OPTYMA','references manual'],['SOV-EQUIP-01','DANFOSS-AKRC','references controller guide'],['SOV-OPS-COOL-01','SOV-PEOPLE-01','contacts'],['SOV-OPS-COOL-01','SOV-MAINT-017','previous incident'],['SOV-PEOPLE-01','SOV-FAC-EXT-01','coordinates external visits']]) await db.query('INSERT INTO protected.links VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[a,b,relation]);
 await db.query('COMMIT');
 }finally{await db.end();}
}
export async function storeArtifact(input) {
 const a=validateArtifact(input,{vectors:true}); const config=resolveEmbeddingConfig(a.embedding); const client=await practice.connect();
 try{
 await client.query('BEGIN');
 // One current practice corpus, atomically replaced so different embedding spaces cannot mix.
 await client.query('DELETE FROM practice.chunks');
 for(const c of a.chunks) await client.query('INSERT INTO practice.chunks VALUES($1,$2,$3,$4,$5,$6,$7,$8::vector,$9)',[c.id,c.source??'upload',c.title??'Uploaded document',c.section??'',c.page??null,c.text,JSON.stringify({...c,vector:undefined,text:undefined}),JSON.stringify(c.vector),config.spaceId]);
 await client.query('INSERT INTO practice.settings VALUES(1,$1) ON CONFLICT(id) DO UPDATE SET embedding=$1',[JSON.stringify({...config,dimensions:a.dimensions})]);
 await client.query('COMMIT');return {count:a.chunks.length,dimensions:a.dimensions};
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
export async function sqlQuery(sql) {
 if(typeof sql!=='string'||sql.length>30000||!/^\s*(select|insert|with|explain)\b/i.test(sql)) throw Error('Use SELECT, INSERT, WITH or EXPLAIN in the training console.');
 // A new restricted connection per call prevents session settings leaking between exercises.
 const c=new pg.Client({...connection('lab_writer'),query_timeout:6000});await c.connect();
 try{
  const r=await c.query({text:sql,queryMode:'extended'});
  return {columns:r.fields.map(f=>f.name),rows:r.rows.slice(0,200),rowCount:r.rowCount,truncated:r.rows.length>200};
 }finally{await c.end();}
}
