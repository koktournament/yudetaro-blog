/* Stage 5: Rampart turns an impenetrable guard into a vulnerable charge. */
(function(root){
const R='筆頭騎士 ランパート',S='シュウ';
const script=[
 {action:'arrival',duration:1.15},{speaker:R,text:'ほう……'},{speaker:R,text:'我らが宮廷魔術師殿を倒せる者がいたとはな'},
 {speaker:R,text:'奴の回転防壁には、この私でも苦労させられたのだがな'},
 {speaker:R,text:'必殺のチャージで、盾を数枚破壊する必要があったぞ'},
 {speaker:S,text:'えっ！？',face:'panic'},{speaker:S,text:'じゃあ……\nさっきの敵の盾にあった隙間は――',face:'panic'},
 {speaker:S,text:'あいつの攻撃でできたのか！？',face:'idea'},
 {speaker:R,text:'さあ――\nその腕前、見せてくれ'},
 {action:'guard',duration:1.0},{speaker:S,text:'隙がない……！',face:'panic'},
 {speaker:S,text:'いや……よく見るんだ\n必ず穴は空く！！',face:'serious'}, {action:'battle',duration:1.35}
];
function create({finish}){const el=id=>document.getElementById(id),portrait=el('portrait').getContext('2d');
 const timeline=new StageIntro.Timeline(c=>{el('dialogue').hidden=!!c.duration;el('intro-scene').textContent='STAGE 5 · 筆頭騎士 ランパート';if(c.text){el('speaker').textContent=c.speaker;el('dialogue-text').textContent=c.text;StoryArt.draw(portrait,c.speaker,c.face);}},()=>{el('intro-layer').hidden=true;el('dialogue').hidden=true;finish();},script);
 const text=(ctx,s,x,y,size=34)=>{ctx.save();ctx.font=`900 ${size}px Meiryo,sans-serif`;ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#2e1716';ctx.strokeText(s,x,y);ctx.fillStyle='#fff0bd';ctx.fillText(s,x,y);ctx.restore();};
 return {timeline,get active(){return timeline.active;},start(){el('intro-layer').hidden=false;timeline.start();},advance(){timeline.advance();},tick(dt){if(!document.hidden)timeline.tick(dt);},render(ctx){const c=timeline.cue,t=timeline.elapsed;let y=210;if(c.action==='arrival')y=-120+330*Math.min(1,t/.78);StoryArt.drawRampart(ctx,650,y,c.action==='guard'?'charge':'move');if(c.action==='guard'){text(ctx,'ガシャン！',650,175,38);}if(c.cut==='rampart'){}ShuSprites.draw(ctx,c.action==='battle'?'idle':'front',0,480,405);if(c.action==='battle'){ctx.fillStyle='#07111bdd';ctx.fillRect(0,265,1280,140);text(ctx,'BATTLE START!',640,355,60);}}};}
root.StageFiveIntro={script,create};if(typeof module!=='undefined')module.exports={StageFiveIntro:root.StageFiveIntro};
})(typeof window!=='undefined'?window:globalThis);
