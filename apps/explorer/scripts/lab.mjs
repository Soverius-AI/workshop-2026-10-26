import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {chunkCorpus,validateArtifact} from '../lib/artifacts.mjs';
const [command,...args]=process.argv.slice(2);
try{
 const {values}=parseArgs({args,options:Object.fromEntries(['pdf','source-name','size','overlap','strategy','sources','out','input'].map(name=>[name,{type:'string'}]))});
 const flag=(name,fallback)=>values[name]??fallback;
 await mkdir('output',{recursive:true});
 if(command==='chunk'){
  const strategy=flag('strategy','section');
  const options={size:Number(flag('size',900)),overlap:Number(flag('overlap',['paragraph','structure'].includes(strategy)?0:100)),strategy};
  chunkCorpus({documents:[]},options); // Validate parameters before opening a PDF.
  let corpus;
  if(values.pdf){
   if(values.sources)throw Error('Use either --pdf or --sources.');
   const {readPdfCorpus}=await import('../lib/pdf.mjs');
   corpus=await readPdfCorpus(values.pdf,values['source-name'],options);
  }else{
   if(strategy==='structure')throw Error('Structure chunking needs --pdf with embedded bookmarks.');
   corpus=JSON.parse(await readFile(new URL('../data/prepared-corpus.json',import.meta.url),'utf8'));
   const sources=flag('sources','all');if(sources!=='all')corpus.documents=corpus.documents.filter(d=>sources.split(',').includes(d.id));
  }
  if(!corpus.documents.length)throw Error('No matching source IDs');
  const a=chunkCorpus(corpus,options);
  if(corpus.input){
   a.input=corpus.input;
   a.chunks=a.chunks.map(c=>({...c,fileName:corpus.input.name,documentHash:corpus.input.sha256}));
   console.log(`PDF: ${corpus.input.name} (${corpus.input.pages} pages). Text extracted automatically; inspect table reading order against the PDF.`);
   if(corpus.input.skippedPages.length)console.warn('Pages with no selectable text skipped: '+corpus.input.skippedPages.join(', '));
  }
  if(a.input?.layout)console.log(JSON.stringify(a.input.layout));
  const oversized=a.chunks.filter(c=>c.oversized).length;if(oversized)console.warn(`${oversized} chunks exceed the size target to preserve complete paragraphs.`);
  validateArtifact(a);
  const output=flag('out','output/chunks.json');await writeFile(output,JSON.stringify(a,null,2));console.log(`${a.chunks.length} chunks → ${output}`);
 }else if(command==='store'){
  const {storeArtifact,practice}=await import('../lib/database.mjs');
  try{console.log(await storeArtifact(JSON.parse(await readFile(resolve(flag('input','output/embeddings.json')),'utf8'))));}finally{await practice.end();}
 }else throw Error('Commands: chunk [--pdf /input/document.pdf] [--size 900 --overlap 100 --strategy section|fixed|paragraph|structure --sources ID,ID --out output/chunks.json] | store [--input output/embeddings.json]');
}catch(e){console.error(e.message);process.exitCode=1;}
