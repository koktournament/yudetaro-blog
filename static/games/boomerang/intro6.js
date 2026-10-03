/* Stage 6: Aegis begins without a weak point; six shield impacts create one. */
(function(root){
const A='皇帝 アイギス',S='シュウ',U='？？？';
const script=[
 {speaker:U,text:'……攻撃時に防御が疎かになるとは、未熟よのう'},
 {speaker:S,text:'誰だ！',face:'panic'},
 {speaker:A,text:'重鉄盾帝国ガードラ――\n皇帝、アイギスである'},
 {speaker:'シオン王国兵',text:'皇帝！！！！！？？？'},
 {speaker:A,text:'よくぞ、我が精鋭たちを倒したものよ'},
 {speaker:A,text:'我が直々に相手をしてやろう\n強者との戦闘ほど、心躍るもの無し！'},
 {speaker:S,text:'なんて奴だ……',face:'serious'},
 {speaker:A,text:'帝国皇帝とは――帝国最強'},
 {speaker:A,text:'老いも若きも、男も女も、\n生まれも貧富も関係なし'},
 {speaker:A,text:'強さ！\n強さのみ！'},
 {speaker:A,text:'すべてを倒した者が、皇帝になるのだ！'},
 {speaker:S,text:'へえ……皇帝が一番か',face:'serious'},
 {speaker:A,text:'我に死角なし！'},
 {speaker:S,text:'（確かに……撃ち込む場所が見つからない）\n（でも――）',face:'panic'},
 {speaker:S,text:'（おいらのブーメラン）\n（霊木から作られた、おいらのたった一つの武器）',face:'serious'},
 {speaker:S,text:'（今までの戦いで、あいつら自慢の盾に何度もぶつかったけど――）\n（おいらのブーメランには、傷一つない！）',face:'serious'},
 {speaker:S,text:'おいらは――\nおいらのブーメランを信じるだけだ！！',face:'idea'},
 {speaker:S,text:'シュシュッとやっつけてやる！',face:'grin'},
 {speaker:A,text:'戦場に火を放てい！'},
 {action:'ignite',duration:.85},
 {speaker:A,text:'いざ！\n戦場では、一人の騎士――'},
 {speaker:A,text:'参る！！'},
 {action:'battle',duration:1.35}
];
function create({finish,ignite}){const el=id=>document.getElementById(id),portrait=el('portrait').getContext('2d');
 const timeline=new StageIntro.Timeline(c=>{el('dialogue').hidden=!!c.duration;el('intro-scene').textContent='FINAL STAGE · 皇帝 アイギス';if(c.action==='ignite')ignite();if(c.text){el('speaker').textContent=c.speaker;el('dialogue-text').textContent=c.text;StoryArt.draw(portrait,c.speaker,c.face);}},()=>{el('intro-layer').hidden=true;el('dialogue').hidden=true;finish();},script);
 const text=(ctx,s,x,y,size=34)=>{ctx.save();ctx.font=`900 ${size}px Meiryo,sans-serif`;ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#25150e';ctx.strokeText(s,x,y);ctx.fillStyle='#fff0bd';ctx.fillText(s,x,y);ctx.restore();};
 return {timeline,get active(){return timeline.active;},start(){el('intro-layer').hidden=false;timeline.start();},advance(){timeline.advance();},tick(dt){if(!document.hidden)timeline.tick(dt);},render(ctx){const c=timeline.cue;StoryArt.drawAegis(ctx,760,205,false);ShuSprites.draw(ctx,c.action==='battle'?'idle':'front',0,440,420);if(c.action==='ignite'||c.action==='battle')StoryArt.drawFinalFire(ctx,performance.now()/1000);if(c.action==='ignite')text(ctx,'ゴオオオオ……',640,220,42);if(c.action==='battle'){ctx.fillStyle='#07111bdd';ctx.fillRect(0,265,1280,140);text(ctx,'BATTLE START!',640,355,60);}}};}
root.StageSixIntro={script,create};
})(window);
