/* v22: soft word affinities plus hard historical requirements; independent per-band draws. */
const SONG_LANGUAGE_LABELS={jp:'日本語',english:'全英語','jp-en-hook':'日本語＋英語サビ','en-jp-hook':'英語＋日本語サビ','section-cross':'パートごとに日本語・英語','line-cross':'日本語・英語ミックス'};
function lyricSeed(){const bytes=new Uint32Array(4);if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(bytes);else for(let i=0;i<4;i++)bytes[i]=Math.floor(Math.random()*4294967296);return Array.from(bytes,x=>x.toString(16).padStart(8,'0')).join('');}
function lyricRandom(seed){let a=0x9e3779b9,b=0x243f6a88,c=0xb7e15162,d=0xdeadbeef;for(const char of String(seed)){a=Math.imul(a^char.charCodeAt(0),2654435761);b=Math.imul(b^a,1597334677);c=Math.imul(c^b,2246822507);d=Math.imul(d^c,3266489909);}return ()=>{a|=0;b|=0;c|=0;d|=0;let t=((a+b)|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+(c<<3)|0;c=c<<21|c>>>11;c=c+t|0;return (t>>>0)/4294967296;};}
function composeModularSong(seed,theme,mode,context={facts:[],traits:{}}){
 const D=LYRIC_PARTS,r=lyricRandom(seed),normalize=s=>s.toLowerCase().replace(/[\p{P}\p{Z}\s_]/gu,'');
 function weighted(arr,weight=()=>1){if(!arr.length)throw Error('Empty lyric pool');const weights=arr.map(weight),sum=weights.reduce((n,w)=>n+w,0);if(!(sum>0))throw Error('No eligible lyric material');let roll=r()*sum;for(let i=0;i<arr.length;i++){roll-=weights[i];if(roll<0)return arr[i];}return arr.at(-1);}
 const themeWeight=t=>lyricAffinityWeight({tags:D.themeTags[t]||[]},context,t);
 theme=theme||weighted(Object.keys(D.pairings),themeWeight);mode=mode||weighted(D.languages);
 const secondary=weighted(D.pairings[theme],themeWeight),used=new Set(),sourceCount=new Map(),patterns={},audit=[];let experienceUnits=0;
 function allowed(meta){return !meta?.disabled&&lyricAllowed(meta,context)&&(!(meta?.requires?.length)||experienceUnits<3);}
 function claim(a){a.lines.forEach(s=>used.add(normalize(s)));sourceCount.set(a.source,(sourceCount.get(a.source)||0)+1);if(a.requires?.length)experienceUnits++;audit.push({source:a.source,kind:a.kind,tags:a.tags||[],requires:a.requires||[],lines:[...a.lines]});return a;}
 function pool(lang,t,role){return (D.pools[[lang,t,role].join('|')]||[]).map(i=>D.atoms[i]);}
 function authored(lang,role,kind,limit){
  const t=r()<.68?theme:secondary;const candidates=role==='call'?D.families[theme].flatMap(f=>pool(lang,'@'+f,'call')):pool(lang,t,role);
  function available(arr){const unique=[...new Set(arr)],byKind=unique.filter(a=>a.kind===kind),valid=a=>allowed(a)&&!a.lines.some(s=>used.has(normalize(s)))&&(sourceCount.get(a.source)||0)<limit;const preferred=byKind.filter(valid);return preferred.length?preferred:unique.filter(valid);}
  let options=available(candidates);
  if(!options.length)options=available(role==='call'?candidates:D.pairings[theme].flatMap(t=>pool(lang,t,role)));
  if(!options.length)options=available(Object.entries(D.pools).filter(([k])=>k.startsWith(lang+'|')&&k.endsWith('|'+role)).flatMap(([,ids])=>ids.map(i=>D.atoms[i])));
  // Broader pools never bypass a requirement or the within-song repetition checks.
  if(!options.length)return composed(lang,role==='call'?'feeling':role);
  return claim(weighted(options,a=>lyricAffinityWeight(a,context,theme)));
 }
 const wordPools=new Map();
 function word(lang,slot){const key=lang+'|'+slot+'|'+(experienceUnits<3?'open':'plain');let prepared=wordPools.get(key);if(!prepared){const options=D.words[lang][slot].filter(x=>allowed(D.wordMeta[lang+'|'+slot+'|'+x]));let sum=0;const cumulative=options.map(x=>sum+=lyricAffinityWeight(D.wordMeta[lang+'|'+slot+'|'+x],context,theme));prepared={options,cumulative,sum};wordPools.set(key,prepared);}const roll=r()*prepared.sum;let lo=0,hi=prepared.cumulative.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(roll<prepared.cumulative[mid])hi=mid;else lo=mid+1;}return prepared.options[lo];}
 function composed(lang,role){
  for(let attempt=0;attempt<100;attempt++){
   let text,components;if(role==='scene'){const subject=word(lang,'subjects'),verb=word(lang,'predicates');text=subject+(lang==='jp'?'が':' ')+verb;components=[['subjects',subject],['predicates',verb]];}
   else{const slot=role==='call'?'calls':role==='feeling'?'feelings':'turns',frame=word(lang,slot),target=word(lang,'targets');text=frame.replace('{}',target);components=[[slot,frame],['targets',target]];}
   if(used.has(normalize(text)))continue;
   const metas=components.map(([slot,x])=>D.wordMeta[lang+'|'+slot+'|'+x]||{}),tags=[...new Set(metas.flatMap(m=>m.tags||[]))],requires=[...new Set(metas.flatMap(m=>m.requires||[]))];
   return claim({lines:[text],source:'composed:'+text,kind:'composed',tags,requires});
  }throw Error('Exhausted composed units');
 }
 function langFor(section,pos){if(mode==='jp'||mode==='english')return mode;if(mode==='jp-en-hook')return section==='chorus'&&pos>=3?'english':'jp';if(mode==='en-jp-hook')return section==='chorus'&&pos>=3?'jp':'english';if(mode==='section-cross')return ['chorus','bridge'].includes(section)?'english':'jp';return pos%2?'english':'jp';}
 function section(kind,isChorus=false,count=4){
  const layouts=isChorus?D.chorusPatterns:D.sectionPatterns,index=Math.floor(r()*layouts.length),roles=layouts[index].slice(0,isChorus?6:count),generated=new Set(),lines=[],core=[];patterns[kind]=index;
  roles.forEach((role,pos)=>{const lang=langFor(isChorus?'chorus':kind,pos),pair=r()<.28&&!isChorus;let a;
   if((role==='call'&&r()<.5)||(isChorus&&['scene','feeling','turn'].includes(role)&&!generated.has(role))||(!isChorus&&role!=='call'&&r()<.2)){a=composed(lang,role);generated.add(role);}
   else a=authored(lang,role,role==='call'?'fragment':pair?'pair':'line',isChorus?1:2);
   const chunk=[...a.lines];core.push(chunk.join('\n'));
   if(mode==='line-cross'&&r()<.38){const b=authored(lang==='jp'?'english':'jp','call','fragment',isChorus?1:2);chunk[chunk.length-1]+=' — '+b.lines[0];}lines.push(...chunk);
  });
  if(isChorus){const repeat=Math.floor(r()*5);if(repeat===1)return {lines:[lines[0],lines[1]+'　'+lines[2],lines[3],lines[4]+'　'+lines[5]],core};if(repeat===2)lines.splice(1,0,lines[0]);if(repeat===3)lines.push(lines.at(-1));if(repeat===4)lines.splice(2,0,lines[0]);}
  return {lines,core};
 }
 const chorus=section('chorus',true),structures=D.structures.map((value,index)=>({value,index}));
 const arrangement=context.answers?.[1],picked=weighted(structures,x=>arrangement==null?1:arrangement===0?(x.value.split(' ').length<=7?2.5:1):(x.value.includes('S')||x.value.includes('P')?2:1)),structure=picked.index,cache={},labels={I:'Intro',V1:'Verse 1',V2:'Verse 2',V3:'Verse 3',P:'Pre-Chorus',C:'Chorus',B:'Bridge',S:'Instrumental Break',F:'Final Chorus',O:'Outro'};
 const lyrics=picked.value.split(' ').map(key=>{if(key==='S')return '[Instrumental Break]';let part;if(key==='C'||key==='F')part=chorus;else{if(!cache[key])cache[key]=section(key==='B'?'bridge':key==='I'?'intro':key==='O'?'outro':'verse',false,['I','O'].includes(key)?2:4);part=cache[key];}return '['+labels[key]+']\n'+part.lines.join('\n');}).join('\n\n');
 // Title words obey the same historical conditions; no IDs appear in lyrics or titles.
 const titleLang=mode==='english'?'english':'jp',title=word(titleLang,'subjects')+' / '+word(titleLang,'targets');
 return {title,lyrics,theme,secondary,language:mode,chorus:chorus.lines.join('\n'),chorusCore:chorus.core,structure,patterns,selectionAudit:audit};
}
