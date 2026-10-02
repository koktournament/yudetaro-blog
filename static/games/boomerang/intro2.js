/* Stage 2 shares the same input, audio and battle rules as Stage 1. */
(function(root){
const B='バックラー副隊長',G='シールダ十人隊長',S='シュウ';
const script=[
 {action:'arrival',duration:1.2},
 {speaker:G,text:'ぐえっ！',face:'surprised'},
 {speaker:B,text:'未熟者め……シールダよ',face:'smug'},
 {speaker:B,text:'こやつは重き盾を扱うことすら未熟！'},
 {speaker:B,text:'止まらねば剣ひとつ振るえぬ！',face:'smug'},
 {speaker:G,text:'ふ、副隊長……！',face:'surprised'},
 {speaker:B,text:'どけ！',face:'angry'},
 {action:'kick',duration:1.25},
 {speaker:B,text:'防御さえ強くあれば――'},
 {speaker:B,text:'誰にも負けぬのだ！！',face:'smug'},
 {speaker:S,text:'（……でも、やっぱり後ろの防御は甘いな）',face:'idea',cut:'back'},
 {speaker:S,text:'おいらのブーメランなら、お前にも負けないよ！',face:'grin'},
 {speaker:B,text:'奇怪な武器を使いおって……！',face:'angry'},
 {speaker:B,text:'そのようなもの――'},
 {speaker:B,text:'この鉄壁の盾で、はじき落としてやる！',face:'angry',action:'slam'},
 {action:'battle',duration:1.35}
];
function create({sound,finish}){
 const el=id=>document.getElementById(id),portrait=el('portrait').getContext('2d');
 let expelled=false,landed=false,kicked=false;
 const timeline=new StageIntro.Timeline(c=>{
  el('dialogue').hidden=!!c.duration;
  el('intro-scene').textContent='STAGE 2 · バックラー副隊長';
  if(c.text){el('speaker').textContent=c.speaker;el('dialogue-text').textContent=c.text;StoryArt.draw(portrait,c.speaker,c.face);}
  if(c.action==='slam')sound('shield');
 },()=>{el('intro-layer').hidden=true;el('dialogue').hidden=true;finish();},script);
 function text(ctx,s,x,y,size=34){ctx.save();ctx.font=`900 ${size}px Meiryo,sans-serif`;ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#2e1716';ctx.strokeText(s,x,y);ctx.fillStyle='#fff0bd';ctx.fillText(s,x,y);ctx.restore();}
 function fallen(ctx,x,y,a){ctx.save();ctx.translate(x,y);ctx.rotate(a);ShuSprites.drawGuard(ctx,0,0);ctx.restore();}
 return {timeline,get active(){return timeline.active;},start(){expelled=landed=kicked=false;el('intro-layer').hidden=false;timeline.start();},advance(){timeline.advance();},tick(dt){if(!document.hidden)timeline.tick(dt);},render(ctx){
  const c=timeline.cue,t=timeline.elapsed;
  let bx=640,by=240;
  if(c.action==='arrival'){const u=Math.min(1,t/.7);by=-100+340*u;if(u===1&&!landed){landed=true;sound('hit');}if(u===1)text(ctx,'スタッ！',735,205);}
  if(!expelled){if(c.action==='kick'){const u=Math.min(1,t/.9);fallen(ctx,655+800*u,310-190*Math.sin(u*Math.PI),1.6+u*8);if(!kicked){kicked=true;sound('hit');}text(ctx,'ドガッ！！',785,240,42);text(ctx,'ぬわーーーーっ！！',Math.min(1020,760+200*u),385,27);if(u===1)expelled=true;}else fallen(ctx,654,316,Math.PI/2);}
  const j=c.action==='slam'&&t<.3?Math.sin(t*55)*7:0;
  StoryArt.drawBuckler(ctx,bx+j,by,'idle');
  ShuSprites.draw(ctx,c.action==='battle'?'idle':'front',0,470,398);
  if(c.cut==='back')StoryArt.showBucklerBack(ctx);
  if(c.action==='battle'){ctx.fillStyle='#07111bdd';ctx.fillRect(0,265,1280,140);text(ctx,'BATTLE START!',640,355,60);}
 }};
}
root.StageTwoIntro={script,create};if(typeof module!=='undefined')module.exports=root.StageTwoIntro;
})(typeof window!=='undefined'?window:globalThis);

/* Stage 3: the L-shaped shield blocks the soldiers from two sides. */
(function(root){
const T='タージェ隊長',B='バックラー副隊長',S='シュウ';
const script=[
 {action:'arrival',duration:1.0},{speaker:B,text:'ひぃっ！ た、隊長……！',face:'surprised'},{action:'crawl',duration:1.1},
 {speaker:'王国兵',text:'なんだ？ 今までのやつより小さいぞ！'},{speaker:'王国兵',text:'みんなで一気にやってしまえ！'},
 {action:'surround',duration:3.3},{speaker:'王国兵',text:'つ、強いーーー……！',face:'dizzy'},
 {speaker:T,text:'私は重鉄盾帝国――隊長のタージェだ',face:'talk'},{speaker:T,text:'変わった武器を使うようだが、私に通用するかな？',face:'talk'},
 {speaker:T,text:'その軌道は見せてもらったぞ',face:'normal'},{speaker:T,text:'はじき飛ばしてくれる！！',face:'angry',action:'slam'},
 {speaker:S,text:'隙がない！\nあの盾……攻撃を当てる隙間が少ないぞ！',face:'panic',cut:'front'},
 {speaker:S,text:'おいらの技は、飛んでるハエだって狙えるんだ！\n修行したからな！',face:'grin'},{speaker:S,text:'シュシュッとやっつけてやる！',face:'grin'},{action:'battle',duration:1.35}
];
function create({sound,finish}){const el=id=>document.getElementById(id),portrait=el('portrait').getContext('2d');let bounced=false;
 const timeline=new StageIntro.Timeline(c=>{el('dialogue').hidden=!!c.duration;el('intro-scene').textContent='STAGE 3 · タージェ隊長';if(c.text){el('speaker').textContent=c.speaker;el('dialogue-text').textContent=c.text;StoryArt.draw(portrait,c.speaker,c.face);}if(c.action==='slam')sound('shield');},()=>{el('intro-layer').hidden=true;el('dialogue').hidden=true;finish();},script);
 const text=(ctx,s,x,y,size=34)=>{ctx.save();ctx.font=`900 ${size}px Meiryo,sans-serif`;ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#2e1716';ctx.strokeText(s,x,y);ctx.fillStyle='#fff0bd';ctx.fillText(s,x,y);ctx.restore();};
 return {timeline,get active(){return timeline.active;},start(){bounced=false;el('intro-layer').hidden=false;timeline.start();},advance(){timeline.advance();},tick(dt){if(!document.hidden)timeline.tick(dt);},render(ctx){const c=timeline.cue,t=timeline.elapsed;let ty=220;if(c.action==='arrival')ty=-70+290*Math.min(1,t/.65);StoryArt.drawTarge(ctx,650,ty,'idle');if(c.action==='crawl'){const u=Math.min(1,t/.85);StoryArt.drawBuckler(ctx,540-650*u,400+30*u,'idle');text(ctx,'ズルズル……',430,455,24);}if(c.action==='surround'){for(let i=0;i<4;i++){const u=Math.min(1,Math.max(0,(t-i*.5)/.45));StoryArt.drawSoldier(ctx,400+i*165+(650-(400+i*165))*u,390-90*u,u*(i%2?1:-1)*2.2,u>=1);if(u>=1&&!bounced){bounced=true;sound('shield');}}if(t>2.1)text(ctx,'カキン！ ガキン！ カキィン！！',640,310,30);}if(c.cut==='shield')StoryArt.showTargeShield(ctx);if(c.cut==='front')StoryArt.showTargeFront(ctx);ShuSprites.draw(ctx,c.action==='battle'?'idle':'front',0,450,405);if(c.action==='battle'){ctx.fillStyle='#07111bdd';ctx.fillRect(0,265,1280,140);text(ctx,'BATTLE START!',640,355,60);}}};}
root.StageThreeIntro={script,create};if(typeof module!=='undefined')module.exports={StageTwoIntro:root.StageTwoIntro,StageThreeIntro:root.StageThreeIntro};
})(typeof window!=='undefined'?window:globalThis);

/* Stage 4: Warden's rotating barrier and the two summoned staffs. */
(function(root){
const W='ウォーデン',S='シュウ',K='シオン王国兵';
const script=[
 {action:'cheer',duration:1.2},{speaker:S,text:'やったー！ 隊長も倒したぞ！',face:'grin'},{speaker:K,text:'やったぞ！\nこれで俺たちの勝ちだ！'},
 {action:'thunder',duration:1.35},{action:'mist',duration:1.45},{action:'warning',duration:1.35},
 {speaker:W,text:'重鉄楯帝国に仇なす者――',face:'normal'},{speaker:W,text:'排除する',face:'normal'},
 {action:'staff-left',duration:.85},{speaker:S,text:'なんだ！？',face:'panic'},{action:'staff-right',duration:.85},{action:'barrier',duration:1.35},
 {speaker:S,text:'隙が……ない',face:'panic'},{speaker:S,text:'いや……\n針の穴を通すように……集中！',face:'serious'},
 {speaker:S,text:'あの修行を思い出せ……！',face:'serious'},{speaker:S,text:'行くぞ！！',face:'grin'},{action:'battle',duration:1.35}
];
function create({sound,finish,beginBattleMusic}){const el=id=>document.getElementById(id),portrait=el('portrait').getContext('2d');let cueSound='';
 const timeline=new StageIntro.Timeline(c=>{el('dialogue').hidden=!!c.duration;el('intro-scene').textContent='STAGE 4 · ウォーデン宮廷魔術師';if(c.text){el('speaker').textContent=c.speaker;el('dialogue-text').textContent=c.text;StoryArt.draw(portrait,c.speaker,c.face);}if(c.action==='warning')sound('warning');if(c.action==='battle')beginBattleMusic();},()=>{el('intro-layer').hidden=true;el('dialogue').hidden=true;finish();},script);
 const text=(ctx,s,x,y,size=34,color='#fff0bd')=>{ctx.save();ctx.font=`900 ${size}px Meiryo,sans-serif`;ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#171d35';ctx.strokeText(s,x,y);ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.restore();};
 return {timeline,get active(){return timeline.active;},start(){cueSound='';el('intro-layer').hidden=false;timeline.start();},advance(){timeline.advance();},tick(dt){if(!document.hidden)timeline.tick(dt);},render(ctx){const c=timeline.cue,t=timeline.elapsed;const visible=['mist','warning','staff-left','staff-right','barrier','battle'].includes(c.action)||c.speaker===W;const left=c.action==='staff-left'?Math.min(1,t/.45):c.action==='staff-right'||c.action==='barrier'||c.action==='battle';const right=c.action==='staff-right'?Math.min(1,t/.45):c.action==='barrier'||c.action==='battle';if(c.action==='thunder'){ctx.fillStyle=t<.38?'#061222':'#f6fbff';ctx.fillRect(0,0,1280,720);text(ctx,'ゴロゴロゴロ……',640,275,34);if(t>.55)text(ctx,'ズガァァァン！！',640,390,52,'#dcecff');return;}if(visible){ctx.fillStyle='#07101b66';ctx.fillRect(0,0,1280,720);if(c.action==='mist'||c.action==='warning'){for(let i=0;i<9;i++){ctx.globalAlpha=.16+Math.sin(t*4+i)*.08;ctx.fillStyle='#101426';ctx.beginPath();ctx.arc(640+Math.sin(i*2.4)*170,110+i*20,100,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}StoryArt.drawWarden(ctx,640,222,c.action==='warning'?'cast':'idle');if(left)StoryArt.drawStaff(ctx,350,322);if(right)StoryArt.drawStaff(ctx,930,322);if(c.action==='barrier'||c.action==='battle'){for(let i=0;i<7;i++){const a=-Math.PI/2+i*Math.PI*2/8+t*1.2;StoryArt.drawBarrier(ctx,640+Math.cos(a)*110,222+Math.sin(a)*88,a);}text(ctx,'盾の切れ目を狙え！',640,106,24,'#aee5ff');}if(c.action==='warning'){ctx.fillStyle='#080b18bb';ctx.fillRect(0,0,1280,720);for(let i=0;i<3;i++)text(ctx,'WARNING',640,245+i*72,48,'#ff5d56');}if(c.action==='battle'){ctx.fillStyle='#07111bdd';ctx.fillRect(0,265,1280,140);text(ctx,'BATTLE START!',640,355,60);}}else{for(let i=0;i<3;i++)StoryArt.drawSoldier(ctx,550+i*60,350,0,false);ShuSprites.draw(ctx,'front',0,445,405);if(c.action==='cheer')text(ctx,'やったー！',640,280,38);}}};}
root.StageFourIntro={script,create};
if(typeof module!=='undefined')module.exports={StageTwoIntro:root.StageTwoIntro,StageThreeIntro:root.StageThreeIntro,StageFourIntro:root.StageFourIntro};
})(typeof window!=='undefined'?window:globalThis);
