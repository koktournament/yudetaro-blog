/* 未確定項目の試作設定。正式な仕様値ではなく、試遊後に調整する。 */
const TUNING={initialMin:1,initialMax:100,eventsPerYear:6,lifeCost:3,growthPerYear:1,proThreshold:10000,amateurScale:1.5,proScale:12,standoutScale:2.3,fanExponent:4};
const ROLES=['Vo','Gt','Ba','Dr'];
const pick=a=>a[Math.floor(Math.random()*a.length)];
const rand=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const NAME_DATA={
family:['佐伯','高橋','桐谷','森田','浅野','黒田','藤井','小野','坂本','松井','水野','相沢','立花','大西','三浦','長谷川','田中','中村','石井','西村','神崎','真島','柴崎','朝倉','神田','橘','一ノ瀬','望月','瀬戸','羽柴','成瀬','杉浦','早川','滝沢','榊','片桐','宮下','川島','五十嵐','市川','橋本','内田','岡崎','遠藤','泉','野崎','久保','荒木','吉川','白石','梶原','小宮','青柳','南','北原','東','西崎','安藤','沢田','矢野'],
given:['蓮','翔','直人','健太','涼','拓也','誠','亮介','大輔','和也','悠','修平','真司','洋介','光','達也','慎','圭','一樹','隼人','雅人','琢磨','聡','淳','英二','浩一','剛','仁','晃','修','豊','信也','竜也','克己','祐介','正人','智也','純一','俊','悟','哲也','恭介','晴彦','大吾','健二','隆','秀明','俊介','敦','義人','勇','零','律','司','岳','弦','晶','玲','薫','翼'],
latin:['JIN','RYO','AKI','SHIN','TAKU','KEN','YU','KAZ','SHO','REI','NAO','RUI','REN','HIRO','MASA','TOMO','DAI','GEN','KYO','SATORU','JACK','RAVEN','ZERO','NOISE','ASH','ACE','RAY','NOVA','LUKE','BLAZE','RIOT','ZIG','ROCKY','JET','EDDIE','SID','LEO','KAI','RICK','NERO'],
kana:['ジン','リョウ','シン','タク','ケン','アキ','レイ','ゼロ','ジャック','レイヴン','アッシュ','エース','ジェット','ノイズ','ブレイズ','ロッキー','ジグ','カイ','ルーク','リック','クロウ','ネロ','ライオット','ジョー','リュウ','キッド','ロキ','レオン','トニー','サニー'],
epithet:['ミッドナイト','ブラック','クレイジー','ワイルド','シルバー','レッド','ミスター','キャプテン','キラー','ファントム','サンダー','スモーキー','ラッキー','ローリング','ドクター','スネーク','スパイダー','バレット','スクリーム','マッド']};
function randomName(){const p=Math.random();if(p<.58)return pick(NAME_DATA.family)+' '+pick(NAME_DATA.given);if(p<.78)return pick(NAME_DATA.latin);if(p<.91)return pick(NAME_DATA.kana);if(p<.97)return pick(NAME_DATA.epithet)+'・'+pick(NAME_DATA.kana);return pick(NAME_DATA.latin)+' '+pick(['K.','J.','Z.','X.','69','ZERO'])}
function createMembers(){const names=new Set();const bandMode=Math.random()<WORLD_RULES.bandRareChance?pick(['miracle','skill','looks','cooperation','chaos']):null;return ROLES.map(role=>{let name;do{name=randomName()}while(names.has(name));names.add(name);const m={role,name,skill:randomStat(),looks:randomStat(),charisma:randomStat(),cooperation:randomStat(),background:Math.random()<WORLD_RULES.richChance?'wealthy':null,face:{hair:rand(0,3),color:rand(0,3),shape:rand(0,2),eyes:rand(0,2),clothes:rand(0,3),skin:rand(0,3)}};if(Math.random()<WORLD_RULES.allRoundChance)for(const k of ['skill','looks','charisma','cooperation'])m[k]=rand(80,100);else if(Math.random()<WORLD_RULES.geniusChance)m.skill=rand(95,100);if(bandMode==='miracle')for(const k of ['skill','looks','charisma','cooperation'])m[k]=rand(80,100);else if(bandMode==='chaos')m.cooperation=rand(1,15);else if(bandMode)m[bandMode]=rand(80,100);m.traits=memberTraits(m);return m})}

function average(b,k){return b.members.reduce((s,m)=>s+m[k],0)/4}
function strengths(b){return ['skill','looks','charisma'].map(key=>({key,value:average(b,key)})).sort((a,b)=>b.value-a.value)}
function bandType(b){const s=strengths(b);if(s[0].value<55)return '地道なライブを重ねた4人';if(s[1].value>=70&&s[0].value-s[1].value<10)return '実力と華が重なったバンド';return {skill:'音で成り上がった実力派',looks:'顔から火がついたバンド',charisma:'観客を飲み込んだ4人'}[s[0].key]}
function createBand(members,name){const b={id:globalThis.crypto?.randomUUID?.()||String(Date.now())+Math.random(),name,members,initialMembers:JSON.parse(JSON.stringify(members)),tick:0,life:members.reduce((s,m)=>s+m.cooperation,0),fans:0,maxFans:0,pro:false,proTick:null,history:[{tick:0,title:'18歳、バンド結成',text:'音楽雑誌の募集欄で集まった4人。'+name+'の人生が始まった。'}],milestones:[],ended:false,afters:[]};ensureLife(b);ensureWorld(b);ensureChronicle(b);ensureContinuity(b);const formation=formationEvent(b);b.history[0].text=formation.text;if(b.formationTitle)b.history[0].title=formation.title;return b}
function fanGain(b){
// 全12能力値が小さな値から貢献。突出した能力には連続的な追加効果。
const routes=['skill','looks','charisma'].map(k=>average(b,k));
const total=b.members.reduce((sum,m)=>sum+m.skill+m.looks+m.charisma,0);
const standout=routes.reduce((sum,value)=>sum+Math.pow(value/100,TUNING.fanExponent),0);
const scale=b.pro?TUNING.proScale:TUNING.amateurScale;
return Math.max(1,Math.round((total*scale/4)*(1+standout*TUNING.standoutScale)*(0.65+Math.random()*.85)));
}
function regularEvent(b,gain){const e=worldNarrative(b,gain);if(average(b,'cooperation')<35&&Math.random()<.25){const line=freshEvent(b,poolEntries('tension',TENSION_LINES.map(text=>({title:'',text}))));e.text+='\n'+line.text}return e}
function abilityAftermath(m){const sorted=['skill','looks','charisma'].sort((a,b)=>m[b]-m[a]);const top=sorted[0];if(m[top]>=80){if(top==='skill')return m.role==='Vo'?pick([{job:'ソロシンガー',text:'解散後も歌い続けた。小さなライブから再出発し、やがて自分の声で新たなファンをつかんだ。'},{job:'歌唱指導者',text:'その歌声を今度は誰かのために。歌唱指導者として、次の世代のデビューを支えている。'}]):pick([{job:'サポートミュージシャン',text:'演奏の腕を買われ、有名アーティストのツアーで活躍。ステージで生きる人生は続いている。'},{job:'音楽講師',text:'音楽教室を開いた。かつてステージで磨いた腕を、今度は若い生徒たちへ伝えている。'}]);if(top==='looks')return pick([{job:'俳優',text:'芸能界へ転身。初めは小さな役だったが、いつしかドラマで見かける顔になった。'},{job:'モデル',text:'モデルとして新たな道へ。雑誌で見かけた昔のファンが、思わずその名前を確かめた。'},{job:'アイドル',text:'アイドルとして再デビュー。別のステージでも、その姿に歓声が上がった。'}]);return pick([{job:'政治家',text:'その求心力を別の世界で発揮。地元の声を集め、やがて政治家として活動を始めた。'},{job:'宗教家',text:'独自の思想を語り始めた。その言葉に人が集まり、やがて宗教団体を率いるようになった。'},{job:'新バンドの中心人物',text:'また新しい仲間を集めた。一度終わったはずのバンド人生が、違う名前で動き始めた。'}])}if(m.skill>=60)return pick([{job:'地元の音楽家',text:'地元で働きながら、週末にはライブへ。売れることより、音を出すことを選んだ。'},{job:'楽器店スタッフ',text:'楽器店で働くようになった。初めて楽器を買う若者に、自分の18歳を重ねている。'}]);return pick([{job:'会社員',text:'音楽を辞め、会社員になった。飲み会でバンド時代の話をすると、ちょっとだけ盛り上がる。'},{job:'家業を継ぐ',text:'地元へ戻り、家業を継いだ。店の奥には今も、4人で写った一枚の写真が飾ってある。'},{job:'ライブハウス店主',text:'小さなライブハウスを開いた。今度は、ステージに立つ若者たちを見守る側になった。'},{job:'普通の暮らし',text:'音楽から離れ、穏やかな毎日を送っている。あの頃の曲が流れると、少しだけ手を止める。'}])}
function stepBand(b){
if(b.ended)return null;ensureLife(b);ensureWorld(b);ensureChronicle(b);ensureContinuity(b);b.tick++;b.life-=TUNING.lifeCost;
const rebuilding=b.tick<b.reputationUntil||b.viceStates.some(s=>s?.type==='drug');const normal=rebuilding?Math.max(1,Math.round(fanGain(b)*.08)):fanGain(b),notes=[];let e=rebuilding?{title:'音楽へ戻るための日々',text:'予定を絞り、4人は生活と音楽を立て直している。新しい客は少ないが、静かに応援を続けてくれる人もいる。',label:'REBUILDING DAYS'}:regularEvent(b,normal);let gained=normal;
if(b.tick===1){e=firstLiveEvent(b);addSong(b,null,300);}
const albumDue=b.pro&&b.debutTick!=null&&b.tick>b.debutTick&&(b.tick-b.debutTick)%LIFE_RULES.albumInterval===0;
const catastrophe=b.tick>1&&Math.random()<LIFE_RULES.suddenEndChance;
if(catastrophe){e={title:'突然の活動終了',text:pick(['重大な契約トラブルが発覚した。話し合いを重ねても解決せず、4人は突然の解散を発表した。','取り返しのつかない不祥事が発覚した。予定していた活動はすべて中止。バンドは、その日をもって解散した。']),label:'SUDDEN END',kind:'sudden'};b.endReason=e.text;b.life=0;gained=0;}
else if(b.tick>1){
let world=null;
if(b.life<=6&&Math.random()<WORLD_RULES.bondChance)world=bondEvent(b);
else if(Math.random()<WORLD_RULES.legendChance)world=legendaryEvent(b);
else world=recoveryDue(b)||careerTransition(b);
if(!world&&!albumDue){if(Math.random()<WORLD_RULES.bondChance)world=bondEvent(b);else if(Math.random()<WORLD_RULES.familyChance)world=familyEvent(b);else if(Math.random()<WORLD_RULES.viceChance)world=viceEvent(b);else if(!b.pro&&!rebuilding&&Math.random()<WORLD_RULES.openingChance)world=openingEvent(b);else if(!rebuilding&&Math.random()<WORLD_RULES.richEventChance)world=wealthyEvent(b);else if(!b.viceStates.some(s=>s?.type==='drug')&&Math.random()<.14)world=continuationEvent(b);else if(Math.random()<WORLD_RULES.instrumentChance)world=instrumentEvent(b);}
if(world){e=world;gained=world.gain<0?world.gain:normal+world.gain;if(albumDue){const a=releaseAlbum(b);notes.push(a);gained+=a.gain;}}
else if(albumDue){e=releaseAlbum(b);gained=normal+e.gain;}
else if(Math.random()<LIFE_RULES.rareAbilityChance){e=rareAbilityEvent(b);gained=normal;}
else if(b.tick-b.lastNegativeTick>=6&&Math.random()<LIFE_RULES.negativeChance){e=scaledNegative(b);gained=e.gain;}
else if(!b.pro&&!rebuilding&&b.tick-(b.lastContestTick??-100)>=6&&Math.random()<LIFE_RULES.contestChance){e=contestantEvent(b);gained=normal+e.gain;b.awards.push({name:e.title,tick:b.tick});}
else if(bigJobsAllowed(b)&&Math.random()<LIFE_RULES.breakoutChance){e=gatedFeatureEvent(b);gained=normal+e.gain;}
else if(bigJobsAllowed(b)){
const stage=careerEvent(b,normal);const repeat=!stage&&Math.random()<.12?repeatVenueEvent(b):null;if(repeat){e=repeat;gained=normal+repeat.gain;}else if(stage){e=stage;gained=normal+Math.round(b.fans*(stage.careerKey==='tv'||stage.careerKey==='primeTV'?.2:.1));}
else if(!b.exposures.includes('kohaku')&&b.fans>=200000&&b.tick%6===5&&Math.random()<.24){b.exposures.push('kohaku');e={title:'紅白歌合戦に出場！',text:'大晦日、4人が紅白のステージへ。家族のそろうテレビの前で、自分たちの曲が流れる。翌日から、これまで届かなかった世代にも反響が広がった。',label:'KOUHAKU',kind:'exposure',careerKey:'kohaku'};gained=normal+Math.round(b.fans*(.4+Math.random()*.35));}
else if(!b.exposures.includes('overseas')&&b.fans>=80000&&Math.random()<.09){b.exposures.push('overseas');const country=pick(['台湾','韓国','イギリス','アメリカ','ドイツ']);e={title:'初めての海外公演・'+country,text:country+'の客席から、自分たちの曲を歌う声が聞こえた。言葉は違っても、4人の音を待っている人がいる。',label:'OVERSEAS LIVE',kind:'exposure',careerKey:'overseas'};gained=normal+Math.round(b.fans*.3);}
else if(b.tick-b.debutTick<=18&&!b.awards.some(a=>a.key==='新人賞'||a.name==='新人賞'||a.name==='日本レコード大賞・新人賞')&&b.fans>=20000&&Math.random()<.1){e=awardEvent(b,'新人賞');gained=normal+e.gain;}
else if(b.albums.some(a=>a.sales>=300000)&&!b.awards.some(a=>a.name==='日本レコード大賞')&&Math.random()<.06){e=awardEvent(b,'日本レコード大賞');gained=normal+e.gain;}
else if(b.albums.length&&Math.random()<.035&&!b.awards.some(a=>a.key==='ベストアルバム賞'||a.name==='ベストアルバム賞')){e=awardEvent(b,'ベストアルバム賞');gained=normal+e.gain;}
}}
if(b.tick===90&&!catastrophe){const v=veteranEvent(b);notes.push(v);gained+=v.gain;}
if(b.tick%6===0){b.members.forEach(m=>m.skill+=TUNING.growthPerYear);e.growth=true;}
const limits=catastrophe?[]:limitEvents(b);for(const l of limits){notes.push(l);gained+=l.gain;}
b.fans=Math.max(0,b.fans+gained);b.maxFans=Math.max(b.maxFans,b.fans);e.gain=gained;
applySetback(b,e);rememberRecognition(b,e);rememberDisplayedEvent(b,e);if(e.kind||e.careerKey||e.news)recordLife(b,e);for(const n of notes)recordLife(b,n);
if(!b.pro&&b.proStage==='amateur'&&b.fans>TUNING.proThreshold&&b.life>0){e=scoutedEvent(b,e);recordLife(b,e);}
if(notes.length)e.text+='\n\n'+notes.map(n=>n.title+'。'+n.text).join('\n');
if(b.tick%18===0&&!e.kind&&!e.careerKey)b.history.push({tick:b.tick,title:'活動'+b.tick/6+'年。4人の音が育つ',text:e.text});
if(b.life<=0){b.ended=true;const low=average(b,'cooperation')<35;const closing=closingLife(b,catastrophe,low);b.afters=b.members.map((m,i)=>aftermath(m,b,i));const reason=b.endReason||(low?'音楽の方向性も、交わす言葉も、少しずつすれ違っていった。':'一緒に走った4人。いつしか、それぞれが思い描く次の人生は違っていた。');const callback=b.endStyle==='farewell'?closingCallback(b):'';const end={title:catastrophe?'突然の解散':closing.title,text:reason+'\n'+closing.reaction+(callback?'\n'+callback:'')+'\n'+closing.ending+'\n'+b.name+'、解散。',gain:gained,label:closing.label,kind:'end',growth:e.growth};if(e.kind==='album')end.text='最後のアルバム『'+e.album.title+'』を発売した。\n'+end.text;if(e.kind==='contract')end.text='プロ契約を結んだ矢先のことだった。\n'+end.text;if(e.kind==='debut')end.text='デビュー公演から、ほどなくして。\n'+end.text;recordLife(b,end);updateTitles(b);return end;}
updateTitles(b);return e;
}
if(typeof module!=='undefined')module.exports={TUNING,createMembers,createBand,stepBand,fanGain,strengths,aftermath};

function aftermath(m,b=null,index=null){return contextualAftermath(m,b,index)}
