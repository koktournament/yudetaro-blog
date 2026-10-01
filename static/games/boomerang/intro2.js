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
 {speaker:S,text:'（……でも、やっぱり後ろの防御は甘いな）',face:'idea'},
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
  if(c.action==='battle'){ctx.fillStyle='#07111bdd';ctx.fillRect(0,265,1280,140);text(ctx,'BATTLE START!',640,355,60);}
 }};
}
root.StageTwoIntro={script,create};if(typeof module!=='undefined')module.exports=root.StageTwoIntro;
})(typeof window!=='undefined'?window:globalThis);
