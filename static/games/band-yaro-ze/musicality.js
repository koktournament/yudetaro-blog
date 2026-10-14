/* v20: answers describe sound; genre labels never replace these instructions. */
const MUSIC_QUESTIONS=[
 ['新曲を最初に聴かせるなら？','一発で引っかかる曲','聴くたび発見がある曲'],
 ['練習で曲がまとまってきた。もう一歩どうする？','余計な音を削る','別の展開を試す'],
 ['リズムで客を乗せるなら？','前へ前へと押していく','揺れながら引き込んでいく'],
 ['ギターの音を決めるなら？','一音の輪郭を立てる','音が重なる響きを作る'],
 ['歌詞を書く時、大切にするのは？','言いたいことを言い切る','聴いた人が想像できる余白'],
 ['サビへ入る瞬間は？','流れを止めず、勢いで持っていく','一度引いてから、大きく開く'],
 ['ステージ上の4人は？','普段の俺達をさらけ出す','普段とは違う俺達になる'],
 ['録音で残したいのは？','その場でしか出ない熱','細部まで磨いた一曲']
];
const MUSIC_INSTRUCTIONS=[
 ['immediate memorable hooks','details revealed through repeated listening'],
 ['economical arrangement, few essential parts','developing sections and contrasting motifs'],
 ['forward-driving rhythm','swaying elastic groove'],
 ['sharp articulated guitar attack','layered resonant guitar textures'],
 ['direct declarative lyric delivery','suggestive images with interpretive space'],
 ['momentum carried into the chorus','a pullback before the chorus opens'],
 ['unaffected intimate presence','heightened dramatic presence'],
 ['live-room energy preserved','carefully shaped recording detail']
];
const MUSIC_GENRES=[['パンク寄り',[0,0,0,0,0,0,0,0],'punk-rooted rock'],['ハードロック寄り',[0,1,0,0,0,1,1,1],'hard rock'],['メタル寄り',[1,1,0,0,1,1,1,1],'metal-rooted rock'],['グラム寄り',[0,0,1,1,0,1,1,1],'glam-rooted rock'],['オルタナ寄り',[1,1,1,1,1,1,0,1],'alternative rock'],['ガレージ寄り',[0,0,1,0,0,0,0,0],'garage-rooted rock'],['ブルースロック寄り',[1,0,1,0,1,0,0,0],'blues-rooted rock']];
function musicalTendency(answers){if(!Array.isArray(answers)||answers.length!==8)return {name:'まだ音を探す4人',english:'four-piece rock'};const scores=MUSIC_GENRES.map(g=>({g,cost:g[1].reduce((s,n,i)=>s+(n!==answers[i]?1:0),0)}));const best=Math.min(...scores.map(s=>s.cost)),top=scores.filter(s=>s.cost===best);return top.length===1?{name:top[0].g[0],english:top[0].g[2]}:{name:'複数の個性が混ざったロック',english:'distinctive four-piece rock'};}
function ensureMusic(b){b.musicProfiles??=[];b.musicJournal??=[];b.musicOrder??=0;if(!b.soundSignature){b.soundSignature={vocal:pick(['warm lightly grainy male timbre','bright clear male timbre','low resonant male timbre','dry lean male timbre']),guitar:pick(['dry amp edge','warm amplifier body','bright upper-mid guitar color','rounded low-mid guitar color'])};}return b;}
function recordMusicMoment(b,reason){ensureMusic(b);const s={t:b.tick,o:++b.musicOrder,a:b.members.map(m=>[m.skill,m.looks,m.charisma,m.cooperation]),v:b.musicProfiles.length-1,h:b.history.length,f:b.fans,p:b.pro?b.labelTier==='indie'?'indie':'major':'amateur',reason};b.musicJournal.push(s);return s;}
function interviewEvent(b){const q=b.pendingChoice,i=q.index;return q.event={title:MUSIC_QUESTIONS[i][0],text:(q.reason==='change'?'これから、俺達はどんな音を出していこうか。':b.tick===1?'初めて客の前で音を出した。\n「俺達は、どんな音を出していこうか」':'重ねてきた活動を振り返り、俺達の音を話し合う。')+'\n\n'+b.members[i%4].name+'が問いかけた。\n一つずつ、今の4人の答えを探そう。',label:'OUR MUSIC / '+(i+1)+' OF 8',kind:'choice',gain:0};}
function beginMusicInterview(b,reason,original=null){ensureMusic(b);b.pendingChoice={type:'music',reason,index:0,answers:[],original};return interviewEvent(b);}
const v19CreateMusicBand=createBand;
createBand=function(ms,name){const b=v19CreateMusicBand(ms,name);ensureMusic(b);recordMusicMoment(b,'formation');return b;};
const v19MusicStep=stepBand;
stepBand=function(b){ensureMusic(b);if(b.pendingChoice)return b.pendingChoice.event;if(!b.ended&&b.tick>=1&&!b.musicProfiles.length)return beginMusicInterview(b,'initial');if(!b.musicJournal.length)recordMusicMoment(b,'resume');const before=b.tick,e=v19MusicStep(b);if(b.tick!==before&&!b.ended)recordMusicMoment(b,'activity');return e;};
const v19MusicButtons=choiceButtons;
choiceButtons=function(b){const q=b.pendingChoice;if(q?.type!=='music')return v19MusicButtons(b);const x=MUSIC_QUESTIONS[q.index];return btn(esc(x[1]),'decide:music:'+q.index+':0')+btn(esc(x[2]),'decide:music:'+q.index+':1','secondary');};
const v19MusicResolve=resolveBandChoice;
resolveBandChoice=function(b,answer){if(!b?.pendingChoice)return null;ensureMusic(b);const q=b.pendingChoice;if(q.type==='music'){const m=/^music:(\d):([01])$/.exec(answer);if(!m||Number(m[1])!==q.index)return q.event;q.answers.push(Number(m[2]));q.index++;if(q.index<8)return interviewEvent(b);const tendency=musicalTendency(q.answers);b.musicProfiles.push({tick:b.tick,order:b.musicOrder+1,answers:[...q.answers],reason:q.reason});let e;if(q.reason==='change'){b.pendingChoice=q.original;e=v19MusicResolve(b,'change');e.text='話し合いで、新しい音の方向性を決めた。\n\n'+e.text;}else{b.pendingChoice=null;e={title:'これが、今の俺達の音だ',text:'八つの問いに、四人なりの答えを出した。\n'+q.answers.map((a,i)=>'・'+MUSIC_QUESTIONS[i][a+1]).join('\n')+'\n\nこの答えを、次の一曲へ持っていこう。',label:'OUR SOUND',kind:'musicDirection',gain:0};recordLife(b,e);}recordMusicMoment(b,'music-'+q.reason);return e;}
if(q.type==='direction'&&answer==='change')return beginMusicInterview(b,'change',JSON.parse(JSON.stringify(q)));
const e=v19MusicResolve(b,answer);if(e&&b.pendingChoice!==q)recordMusicMoment(b,'decision');return e;};
function musicSnapshots(b){ensureMusic(b);const valid=b.musicJournal.filter(s=>s.t>=1&&s.t<b.tick&&(s.v>=0||!b.musicProfiles.length));const lastPerTick=new Map();for(const s of valid)lastPerTick.set(s.t,s);if(lastPerTick.size)return [...lastPerTick.values()];const recorded=b.musicJournal.filter(s=>s.v>=0&&(!b.ended||s.t<b.tick));if(recorded.length)return [recorded.at(-1)];return [b.musicJournal[0]||{t:0,o:0,a:(b.initialMembers||b.members).map(m=>[m.skill,m.looks,m.charisma,m.cooperation]),v:-1,h:1,f:0,p:'amateur',reason:'formation'}];}
function musicPeriods(b){const groups=new Map();for(const s of musicSnapshots(b)){const label=s.t<=6?'結成初期':s.p==='amateur'?'アマで活動した時期':b.proTick!=null&&s.t<b.proTick+12?'プロ入り直後':'プロとして活動を重ねた時期';if(!groups.has(label))groups.set(label,[]);groups.get(label).push(s);}return [...groups].map(([name,snapshots])=>({name,snapshots}));}
function chooseSongMoment(b){const group=pick(musicPeriods(b)),snapshot=pick(group.snapshots);return {period:group.name,snapshot,profile:b.musicProfiles[snapshot.v]||null,history:b.history.slice(0,snapshot.h).filter(h=>h.tick<=snapshot.t&&h.kind!=='end')};}
