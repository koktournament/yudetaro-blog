/* Stage 1 script, isolated from the combat simulation. */
(function(root){
const S='シュウ',G='シールダ十人隊長',A='王国兵A';
const script=[
 {speaker:A,text:'くっ……重鉄盾帝国ガードラめ！\nここから先へは行かせないぞ！'},
 {speaker:G,text:'フン！\nシオンの兵士など、この盾の前では赤子同然よ！'},
 {speaker:A,text:'な、なにをぉ！'},
 {action:'charge',duration:4.7},
 {speaker:A,text:'あわわわわわ……！\nな、なんて盾だ……ぜんぜん攻撃が通らない……',face:'dizzy'},
 {speaker:'王国兵',text:'あ、あわわ……\n何人で行っても全然ダメだ……！',face:'panic'},
 {speaker:G,text:'ガハハハハ！ 見たか！\nこれぞ重鉄盾帝国ガードラの鉄壁よ！'},
 {speaker:G,text:'無駄だ無駄だ！\n何人来ようが、この盾の前では同じことよ！'},
 {speaker:G,text:'正面から我らを倒せる者などおらん！',action:'slam'},
 {speaker:'？？？',text:'だったら正面からやらなきゃいいじゃん！'},
 {speaker:A,text:'へ？'},
 {action:'entrance',duration:1.1},
 {speaker:S,text:'しゅしゅっと参上！\nおいら、シュウ！',face:'grin'},
 {speaker:A,text:'だ、誰だお前！？'},
 {speaker:S,text:'山で修行してた、ただのブーメラン野郎さ！'},
 {speaker:A,text:'ただの……？'},
 {speaker:S,text:'まあ見てなって！',face:'grin'},
 {speaker:S,text:'あいつ、前はカッチカチだけどさ\n後ろは――',face:'grin'},
 {speaker:S,text:'丸出しじゃん！',cut:'back',face:'grin'},
 {speaker:A,text:'…………\nほんとに丸出しだ……',cut:'back'},
 {speaker:G,text:'なにを見ている！',action:'shake'},
 {speaker:S,text:'敵は前にしかいないと思ってるんだろ？'},
 {speaker:G,text:'当然だ！\n戦とは正面からぶつかるもの！'},
 {speaker:G,text:'後ろを守るなど臆病者のすることよ！'},
 {speaker:A,text:'いや、守った方がいいと思うけど……'},
 {speaker:S,text:'おいらのブーメランなら\n前から投げても、ぐるっと回って後ろを狙える！',face:'grin'},
 {speaker:A,text:'そんなことできるのか？'},
 {speaker:S,text:'できる！'},
 {speaker:A,text:'でも投げたら武器なくなるだろ？'},
 {speaker:S,text:'大丈夫！',face:'grin'},
 {speaker:S,text:'おいらのブーメランは、どこへ飛んでも\n必ず手元へ戻ってくる！',face:'grin'},
 {speaker:A,text:'どこへ飛んでも？'},
 {speaker:S,text:'どこへ飛んでも！'},
 {speaker:A,text:'お前が動いても？'},
 {speaker:S,text:'動いても！'},
 {speaker:A,text:'それ物理的に――'},
 {speaker:S,text:'修行だよ、修行！',face:'grin'},
 {speaker:A,text:'修行ってすごいな……'},
 // Clarify the unchanged combat rule without replacing Shu's original boast.
 {speaker:S,text:'ただし、敵に当てたら弾かれて落ちるからさ。\nそのときは拾いに行くんだ！'},
 {speaker:A,text:'そこは拾うんだな……'},
 {speaker:G,text:'さっきから聞いていれば！',action:'slam'},
 {speaker:G,text:'小僧が妙な武器を振り回しおって！'},
 {speaker:G,text:'その木切れが！\n我が鉄壁の盾に通用するものか！'},
 {speaker:S,text:'別に盾を壊す必要ないし'},
 {speaker:G,text:'なに？'},
 {speaker:S,text:'後ろから当てりゃいいだけ！',face:'grin'},
 {speaker:G,text:'この――！\n生意気な小僧がぁぁぁ！',action:'shake'},
 {action:'battle',duration:1.35}
];
class Timeline{
 constructor(onCue,onEnd,cues=script){this.script=cues;this.onCue=onCue;this.onEnd=onEnd;this.active=false;this.index=-1;this.elapsed=0;this.finished=false;}
 start(){this.active=true;this.finished=false;this.index=-1;this.next();}
 next(){if(!this.active)return;this.index++;this.elapsed=0;if(this.index>=this.script.length){this.finish();return;}this.onCue(this.script[this.index],this.index);}
 tick(dt){if(!this.active)return;this.elapsed+=Math.min(dt,.1);const c=this.script[this.index];if(c.duration&&this.elapsed>=c.duration)this.next();}
 advance(){if(this.active&&!this.script[this.index].duration)this.next();}
 finish(){if(!this.active||this.finished)return;this.active=false;this.finished=true;this.onEnd();}
 get cue(){return this.script[this.index];}
}
function create({sound,finish,paintBoss}){
 const byId=id=>document.getElementById(id),dialog=byId('dialogue'),portrait=byId('portrait').getContext('2d');
 let entered=false,fallen=false,lastImpact=-1,fx=[],clock=0;
 const timeline=new Timeline(c=>{
  dialog.hidden=!!c.duration;byId('intro-scene').textContent=entered?'STAGE 1 · シールダ十人隊長':'シオン王国・戦場';
  if(c.text){byId('speaker').textContent=c.speaker;byId('dialogue-text').textContent=c.text;drawPortrait(c);}
  if(c.action==='charge')lastImpact=-1;
  if(c.action==='slam'){sound('shoot');fx.push({text:'ドン！',x:640,y:285,life:.6});}
 },()=>{byId('intro-layer').hidden=true;dialog.hidden=true;finish();});
 function soldier(ctx,x,y,angle=0,dizzy=false){StoryArt.drawSoldier(ctx,x,y,angle,dizzy);}
 function drawPortrait(c){if(c.speaker==='？？？'){portrait.clearRect(0,0,160,160);portrait.fillStyle='#17283c';portrait.fillRect(0,0,160,160);portrait.fillStyle='#ffda9c';portrait.font='bold 76px sans-serif';portrait.textAlign='center';portrait.fillText('？',80,108);return;}let face=c.face;if(c.speaker===G)face=c.action==='shake'||c.action==='slam'?'angry':c.text==='なに？'?'surprised':'smug';if(c.speaker===S&&!face)face=c.text.includes('修行')||c.text.includes('後ろ')?'idea':'serious';StoryArt.draw(portrait,c.speaker,face);}
 function text(ctx,value,x,y,size=28,color='#f9d489'){ctx.fillStyle=color;ctx.font=`bold ${size}px "Meiryo",sans-serif`;ctx.textAlign='center';ctx.fillText(value,x,y);}
 function start(){entered=false;fallen=false;fx=[];clock=0;byId('intro-layer').hidden=false;timeline.start();}
 function render(ctx){const c=timeline.cue,t=timeline.elapsed;const shake=(c?.action==='slam'||c?.action==='shake')&&t<.55?Math.sin(t*80)*5:0;
  paintBoss(640+shake,205, c?.action==='charge'&&lastImpact>=0 ? .1 : 0);
  if(c?.action==='charge'){
   for(let i=0;i<4;i++){let k=t-i*.85;if(k<0){soldier(ctx,420+i*80,405);continue;}if(k<.45){soldier(ctx,420+i*80+(640-420-i*80)*k/.45,405-145*k/.45);}
    else{const u=Math.min(1,(k-.45)/.55);soldier(ctx,640+(i-1.5)*115*u,260+190*u-Math.sin(u*Math.PI)*50,u*(i%2?1:-1)*2.1,u===1);if(i>lastImpact){lastImpact=i;sound('shield');fx.push({text:i===3?'カキィィン！！':'カキン！',x:640,y:280,life:.7});}}}
   if(t>4)fallen=true;
  }else if(fallen){for(let i=0;i<4;i++)soldier(ctx,467+i*115,450,(i%2?1:-1)*2.1,true);}else{soldier(ctx,520,415);}
  if(c?.action==='entrance'){const u=Math.min(1,t/.8);const x=130+385*u,y=405-Math.sin(Math.PI*u)*130;ShuSprites.draw(ctx,'front',0,x,y);if(u===1&&!entered){entered=true;sound('catch');fx.push({text:'シュタッ！',x:515,y:352,life:.7});}}
  else if(entered){ShuSprites.draw(ctx,c?.action==='battle'?'idle':'front',c?.action==='battle'?0:1,515,380);if(c?.action==='battle')ShuSprites.boomer(ctx,518,373,-.15,1,34);}
  if(c?.cut==='back')StoryArt.showBack(ctx,t);
  for(const f of fx){ctx.save();ctx.globalAlpha=Math.min(1,f.life*3);text(ctx,f.text,f.x,f.y-(.7-f.life)*40,35);if(f.text.includes('カキ')){ctx.strokeStyle='#ffe5a4';ctx.lineWidth=4;for(let j=0;j<8;j++){const a=j*Math.PI/4;ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*38,f.y+Math.sin(a)*20);ctx.lineTo(f.x+Math.cos(a)*70,f.y+Math.sin(a)*45);ctx.stroke();}}ctx.restore();}
  if(c?.action==='battle'){ctx.fillStyle='#07111bcc';ctx.fillRect(0,275,1280,130);text(ctx,'BATTLE START!',640,355,60);}
 }
 
 return {start,render,get active(){return timeline.active;},timeline,tick(dt){if(document.hidden)return;clock+=Math.min(dt,.1);fx.forEach(f=>f.life-=Math.min(dt,.1));fx=fx.filter(f=>f.life>0);timeline.tick(dt);},advance:()=>timeline.advance()};
}
root.StageIntro={create,Timeline,script};if(typeof module!=='undefined')module.exports=root.StageIntro;
})(typeof window!=='undefined'?window:globalThis);
