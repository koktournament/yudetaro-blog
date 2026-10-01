/* Stage 3: the L-shaped shield blocks the soldiers from two sides. */
(function(root){
const T='タージェ隊長',B='バックラー副隊長',S='シュウ';
const script=[
 {action:'arrival',duration:1.0},
 {speaker:B,text:'ひぃっ！ た、隊長……！',face:'surprised'},
 {action:'crawl',duration:1.1},
 {speaker:'王国兵',text:'なんだ？ 今までのやつより小さいぞ！'},
 {speaker:'王国兵',text:'みんなで一気にやってしまえ！'},
 {action:'surround',duration:3.3},
 {speaker:'王国兵',text:'つ、強いーーー……！',face:'dizzy'},
 {speaker:T,text:'私は重鉄盾帝国――隊長のタージェだ',face:'talk'},
 {speaker:T,text:'変わった武器を使うようだが、私に通用するかな？',face:'talk'},
 {speaker:T,text:'その軌道は見せてもらったぞ',face:'normal'},
 {speaker:T,text:'はじき飛ばしてくれる！！',face:'angry',action:'slam'},
 {speaker:S,text:'隙がない！\nあの盾……攻撃を当てる隙間が少ないぞ！',face:'panic',cut:'shield'},
 {speaker:S,text:'おいらの技は、飛んでるハエだって狙えるんだ！\n修行したからな！',face:'grin'},
 {speaker:S,text:'シュシュッとやっつけてやる！',face:'grin'},
 {action:'battle',duration:1.35}
];
function create({sound,finish}){
 const el=id=>document.getElementById(id),portrait=el('portrait').getContext('2d');let bounced=false;
 const timeline=new StageIntro.Timeline(c=>{el('dialogue').hidden=!!c.duration;el('intro-scene').textContent='STAGE 3 · タージェ隊長';if(c.text){el('speaker').textContent=c.speaker;el('dialogue-text').textContent=c.text;StoryArt.draw(portrait,c.speaker,c.face);}if(c.action==='slam')sound('shield');},()=>{el('intro-layer').hidden=true;el('dialogue').hidden=true;finish();},script);
 function text(ctx,s,x,y,size=34){ctx.save();ctx.font=`900 ${size}px Meiryo,sans-serif`;ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#2e1716';ctx.strokeText(s,x,y);ctx.fillStyle='#fff0bd';ctx.fillText(s,x,y);ctx.restore();}
 return {timeline,get active(){return timeline.active;},start(){bounced=false;el('intro-layer').hidden=false;timeline.start();},advance(){timeline.advance();},tick(dt){if(!document.hidden)timeline.tick(dt);},render(ctx){const c=timeline.cue,t=timeline.elapsed;let ty=220;if(c.action==='arrival')ty=-70+290*Math.min(1,t/.65);StoryArt.drawTarge(ctx,650,ty,'idle');
   if(c.action==='crawl'){const u=Math.min(1,t/.85);StoryArt.drawBuckler(ctx,540-650*u,400+30*u,'idle');text(ctx,'ズルズル……',430,455,24);}
   if(c.action==='surround'){for(let i=0;i<4;i++){const u=Math.min(1,Math.max(0,(t-i*.5)/.45));const x=400+i*165+(650-(400+i*165))*u,y=390-90*u;StoryArt.drawSoldier(ctx,x,y,u*(i%2?1:-1)*2.2,u>=1);if(u>=1&&!bounced){bounced=true;sound('shield');}}if(t>2.1)text(ctx,'カキン！ ガキン！ カキィン！！',640,310,30);}
   if(c.cut==='shield')StoryArt.showTargeShield(ctx);
   ShuSprites.draw(ctx,c.action==='battle'?'idle':'front',0,450,405);
   if(c.action==='battle'){ctx.fillStyle='#07111bdd';ctx.fillRect(0,265,1280,140);text(ctx,'BATTLE START!',640,355,60);}
 }};
}
root.StageThreeIntro={script,create};if(typeof module!=='undefined')module.exports=root.StageThreeIntro;
})(typeof window!=='undefined'?window:globalThis);
