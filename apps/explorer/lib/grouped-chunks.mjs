import {createHash} from 'node:crypto';

// Size is a soft target: never silently cut a paragraph to satisfy a hard limit.
export function groupedChunks(corpus,{size,overlap,strategy}){
  const chunks=[];
  for(const doc of corpus.documents)for(const section of doc.sections){
    const paragraphs=section.paragraphs??section.text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);
    const sourceHash=createHash('sha256').update(section.text).digest('hex');
    const prefix=section.includeHeading?section.heading+'\n\n':'';
    let group=[],start=0,part=0;
    const flush=()=>{
      if(!group.length)return;
      const text=prefix+group.join('\n\n');
      const id=createHash('sha256').update([doc.id,section.heading,section.page??'',sourceHash,strategy,size,start].join('|')).digest('hex').slice(0,20);
      chunks.push({id,source:doc.id,title:doc.title,section:section.heading,page:section.page??null,version:doc.version,sourceHash,roles:doc.roles,rooms:doc.rooms??[],text,characters:text.length,part:++part,boundary:section.boundary??'paragraphs',headingPath:section.headingPath??[],paragraphStart:start+1,paragraphEnd:start+group.length,oversized:text.length>size});
      start+=group.length;group=[];
    };
    for(const paragraph of paragraphs){
      if(group.length && prefix.length+[...group,paragraph].join('\n\n').length>size)flush();
      group.push(paragraph);
    }
    flush();
  }
  return {schemaVersion:1,kind:'chunks',settings:{size,overlap,strategy,unit:'characters',sizePolicy:'soft target; whole paragraphs preserved'},chunks};
}
