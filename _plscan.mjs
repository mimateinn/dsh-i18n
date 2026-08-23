
import fs from 'node:fs';
const en='src/en', pl='src/pl';
const files=fs.readdirSync(en).filter(f=>f.endsWith('.json')).sort();
let compared=0; const same=[];
for(const f of files){
  const a=JSON.parse(fs.readFileSync(en+'/'+f,'utf8'));
  const b=JSON.parse(fs.readFileSync(pl+'/'+f,'utf8'));
  const m=new Map(b.entries.map(e=>[e.ns,e.dict]));
  const orderOk = a.entries.every((e,i)=>b.entries[i]&&b.entries[i].ns===e.ns&&JSON.stringify(Object.keys(b.entries[i].dict))===JSON.stringify(Object.keys(e.dict)));
  if(!orderOk) console.log('ORDER MISMATCH '+f);
  for(const e of a.entries) for(const [k,v] of Object.entries(e.dict)){ compared++; if(m.get(e.ns)[k]===v) same.push(f+' ['+e.ns+'.'+k+'] = '+JSON.stringify(v)); }
}
console.log('files='+files.length+' compared='+compared);
console.log(same.join('\n'));
