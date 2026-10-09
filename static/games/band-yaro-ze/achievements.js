/* v14: collect existing titles; no additional gameplay requirements. */
const ACHIEVEMENTS=[];
function achievementEntry(id,scope,name,condition,match=null){ACHIEVEMENTS.push({id,scope,name,condition,match:match||((title)=>title===name)});}
const achievementAbility={skill:'歌唱／演奏',looks:'ルックス',charisma:'カリスマ',cooperation:'協調性'};
for(const t of PROFILE_TITLES)achievementEntry('band-'+t.id,'band',t.name,[...t.h.map(k=>achievementAbility[k]+'合計300超'),...t.l.map(k=>achievementAbility[k]+'合計100未満')].join('・'));
const bandAchievementRows=[
 ['mediator','○○がつなぐ4人','1人の協調性80以上、ほか3人は30以下',t=>t.endsWith('がつなぐ4人')],
 ['outsider','3人と、ひとり','1人の協調性25以下、ほか3人は60以上'],
 ['one-skill','○○と、その仲間たち','1人の歌唱／演奏85以上、ほか3人平均60以下、差30以上',t=>t.endsWith('と、その仲間たち')],
 ['one-looks','一人だけ表紙','1人のルックス85以上、ほか3人平均60以下、差30以上'],
 ['one-charisma','王様と3人','1人のカリスマ85以上、ほか3人平均60以下、差30以上'],
 ['cult','伝説の最低野郎','低能力の4人が、カルト的人気のイベントを経験'],
 ['zero','当方ボーカル、全員帰宅','協調性合計50以下で、結成した日に解散'],
 ['session','天才たちのセッション','結成時に4人全員の歌唱／演奏80以上で、この称号を獲得'],
 ['beautiful','華のある4人','結成時に全員のルックス80以上で、この称号を獲得'],
 ['best-friends','最高の仲間','結成時に全員の協調性80以上で、この称号を獲得'],
 ['sparks','火花散る4人','結成時に全員の協調性15以下で、この称号を獲得'],
 ['face-budokan','顔だけで武道館','武道館を経験し、ルックスが最も高く歌唱／演奏平均55未満'],
 ['char-budokan','熱狂の武道館','武道館を経験し、カリスマが最も高い'],
 ['budokan','武道館に立った4人','武道館を経験し、この称号を獲得'],
 ['dome','ドームを揺らす4人','ドーム公演を経験'],
 ['late','遅咲きの星','結成から10年以上かけてプロ入り'],
 ['veteran','世代をつなぐベテラン','プロとして活動期間15年以上'],
 ['local','地方の生ける伝説','アマチュアのまま活動期間15年以上'],
 ['meteor','短く燃えた流星','最大ファン10万人以上、活動4年以内で解散'],
 ['amateur-long','売れなくても、俺たちの音','アマチュアのまま10年以上活動して解散'],
 ['amateur','ライブハウスの青春','アマチュアのまま10年未満で解散'],
 ['million','ミリオンバンド','アルバム1作品で100万枚以上'],
 ['kohaku','紅白のステージへ','紅白歌合戦に出演'],
 ['life','4人だけのバンド人生','プロのまま解散し、ほかのバンド称号がない'],
 ['nameless','名もなき4人の物語','アマチュアで解散し、ほかのバンド称号がない'],
 ['world','世界へ届いた4人','海外での反響から世界進出のイベントを経験'],
 ['world-star','世界のスター','米ビルボードのアルバムチャート1位に到達'],
 ['hall','殿堂入りバンド','最大ファン300万人以上']
];
for(const [id,name,condition,match] of bandAchievementRows)achievementEntry('band-'+id,'band',name,condition,match);
const individualAchievementRows=[
 ['万能の逸材','本人の4能力がすべて80以上'],['天才ボーカリスト','Voの歌唱力95以上で、この特性を獲得'],['演奏の天才','Gt／Ba／Drの演奏力95以上で、この特性を獲得'],['天性の美形','ルックス95以上で、この特性を獲得'],['生まれながらのカリスマ','カリスマ95以上で、この特性を獲得'],['最高の仲間','協調性95以上で、この特性を獲得'],['富豪の息子','富豪の息子として生成された人物'],
 ['魂のボーカル','Voの歌唱力85以上'],['腕で語るGt','Gtの演奏力85以上'],['腕で語るBa','Baの演奏力85以上'],['腕で語るDr','Drの演奏力85以上'],['バンドの華','ルックス85以上'],['人を惹きつける磁場','カリスマ85以上'],['4人を支えた人','協調性85以上'],['自由すぎる魂','協調性15以下'],['あの日の仲間','解散時にほかの個人称号がない'],
 ['限界を超えた歌声','歌唱力100超の節目イベント'],['限界を超えた演奏','演奏力100超の節目イベント'],['時代を超える華','ルックス100超の節目イベント'],['もはや伝説の存在感','カリスマ100超の節目イベント'],['伝説の楽器を継ぐ者','伝説の楽器を受け継ぐ'],['下積みを忘れない人','アマチュア時代から支えた相手と結婚'],['立ち直った人','薬物事件後、治療と生活の立て直しを経て復帰'],['お茶の間の人気者','番組出演などで個人の人気が急上昇'],
 ['ソロ活動でも歌う声','Voのソロ活動イベント'],['歌声で振り向かせる人','Voの歌唱が評価される個人イベント'],['速弾きで知られるギタリスト','Gtの演奏が評価される個人イベント'],['低音を支える名手','Baの演奏が評価される個人イベント'],['リズムを動かす名手','Drの演奏が評価される個人イベント'],['モデルとしても注目','人気のあるプロとして写真の個人イベント'],['写真で見つかった人','写真から注目される個人イベント'],['名前で客を呼ぶ人','カリスマが評価される個人イベント']
];
individualAchievementRows.forEach(([name,condition],i)=>achievementEntry('member-'+i,'member',name,condition));
let achievementNotice=[];
function ensureAchievements(d){d.achievements??={};return d;}
function collectAchievements(d,b,announce=false){ensureAchievements(d);if(!b?.members)return false;let changed=false;const titles=[...(b.bandTitles||[]),...(b.currentProfileTitles||[]),...(b.titleLedger||[]).map(t=>t.name),b.formationTitle,b.profileTitle].filter(Boolean).map(t=>t.replace(/^かつての称号：/,''));if(isHallBand(b))titles.push('殿堂入りバンド');for(const a of ACHIEVEMENTS){if(d.achievements[a.id])continue;let member=null;let qualified=a.scope==='band'?titles.some(a.match):b.members.some((m,i)=>{const found=[...(b.memberTitles?.[i]||[]),...(m.traits||[])].some(a.match);if(found)member={name:m.name,role:m.role,index:i};return found;});if(!qualified)continue;d.achievements[a.id]={bandId:b.id,bandName:b.name,tick:b.tick,member,at:Date.now()};changed=true;if(announce){b.newAchievementIds??=[];if(!b.newAchievementIds.includes(a.id))b.newAchievementIds.push(a.id);achievementNotice.push(a.name);}}return changed;}
function migrateAchievements(d){ensureAchievements(d);const records=[...(d.history||[]),...(d.hall||[])];for(const b of records)collectAchievements(d,b,false);if(d.active?.band)collectAchievements(d,d.active.band,false);return d;}
function achievementCounts(){return ['band','member'].map(scope=>{const list=ACHIEVEMENTS.filter(a=>a.scope===scope);return {scope,total:list.length,done:list.filter(a=>data.achievements?.[a.id]).length}});}
function achievementButton(){const [b,m]=achievementCounts();return `<button class="achievement-link" data-action="achievements"><strong>称号実績</strong><span>バンド ${b.done}／${b.total}　個人 ${m.done}／${m.total}</span></button>`;}
function newAchievementSummary(b){const list=(b.newAchievementIds||[]).map(id=>ACHIEVEMENTS.find(a=>a.id===id)).filter(Boolean);return list.length?`<div class="new-achievement-summary"><b>今回、初めて獲得した称号 ${list.length}個</b><div class="titlechips">${list.map(a=>`<span>${esc(a.name)}</span>`).join('')}</div></div>`:'';}
function achievementScreen(){const counts=achievementCounts();shell(`<div class="content"><div class="eyebrow">YOUR TITLE COLLECTION</div><h2 class="compacttitle">称号実績</h2><div class="achievement-progress">${counts.map(c=>`<div><small>${c.scope==='band'?'バンド':'個人'}</small><b>${c.done}／${c.total}</b></div>`).join('')}</div><p class="sub">これまで出会った4人の記録。バンド史を削除しても達成実績は残ります。</p>${counts.map(c=>`<h3>${c.scope==='band'?'バンド':'個人'} ${c.done}／${c.total}</h3>${ACHIEVEMENTS.filter(a=>a.scope===c.scope).map(a=>{const r=data.achievements[a.id],saved=r&&(data.history||[]).concat(data.hall||[]).some(b=>b.id===r.bandId);return `<article class="achievement-card ${r?'achieved':'locked'}"><small>${r?'達成済み':'未達成'}</small><h4>${r?'✓ ':''}${esc(a.name)}</h4><p>${esc(a.condition)}</p>${r?`<div class="achievement-origin">初獲得：${esc(r.bandName)}${r.member?'<br>'+esc(r.member.role+' / '+r.member.name):''}${saved?`<button class="quiet" data-action="open" data-id="${esc(r.bandId)}">このバンド史を見る</button>`:'<span class="sub">バンド史は未保存または削除済み</span>'}</div>`:''}</article>`}).join('')}`).join('')}</div>`,btn('バンド史へ','history','secondary')+btn('タイトルへ','home'));}
