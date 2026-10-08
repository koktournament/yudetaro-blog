/* Ending dialogue and credits after Emperor Aegis is defeated. */
(function(root){
const A='アイギス',S='シュウ',N='ナレーション',background=new Image();background.src='assets/ending.png';
const script=[
 {speaker:A,text:'まさか……我が盾を破壊するとは……',face:'tired'},
 {speaker:A,text:'……とどめをさせ',face:'serious'},
 {speaker:S,text:'ねえねえ',face:'grin'},
 {speaker:A,text:'……なんだ',face:'serious'},
 {speaker:S,text:'おいら、皇帝に勝ったんだよね？',face:'idea'},
 {speaker:A,text:'……そうだ\nだから、とどめをさせ',face:'tired'},
 {speaker:S,text:'さっきさあ\n最強が皇帝って言ったよね？',face:'serious'},
 {speaker:A,text:'言った\n我も、すべてを打ち倒し、この座についたのだ',face:'serious'},
 {speaker:A,text:'さあ、とどめを――',face:'serious'},
 {speaker:S,text:'ねえねえ',face:'grin'},
 {speaker:A,text:'なんだ！！',face:'angry'},
 {speaker:S,text:'じゃあさ\nおいらが皇帝だよね！',face:'grin'},
 {speaker:A,text:'…………\nはあ？？',face:'surprised'},
 {speaker:S,text:'だって、おいら勝ったじゃん！',face:'grin'},
 {speaker:A,text:'…………まあ……そうか',face:'agree'},
 {speaker:A,text:'我……いや\n私は筆頭騎士に格下げか',face:'tired'},
 {speaker:A,text:'ふふふ……\n君が皇帝だな',face:'smile'},
 {speaker:A,text:'それで――新皇帝\n何をする気だ？',face:'curious'},
 {speaker:S,text:'おいらはブーメラン野郎！\nブーメランが大好きなんだ！',face:'grin'},
 {speaker:S,text:'修行をすれば、投げると戻ってきて――\n楽しいんだ！',face:'idea'},
 {speaker:A,text:'そ、そうか……？\nわたしは……どうしたら？？？',face:'surprised'},
 {speaker:S,text:'みんなで一緒に――\nブーメランの修行するぞ！',face:'grin'},
 {speaker:A,text:'へ？\nブーメラン……？',face:'surprised'},
 {speaker:A,text:'…………\n負けたんだから、しょうがないか！',face:'agree'},
 {speaker:N,text:'――こうして重鉄盾帝国ガードラは\nブーメランを修行する平和な国になった',face:'narration'},
 {speaker:N,text:'ちなみに王様は、ブーメランの的当てが\n一番上手い者になるらしい',face:'narration'},
 {action:'the-end',duration:1.4},
 {action:'credits',duration:18}
];
const credits=['企画・原作','ゲームデザイン','プログラム','キャラクターデザイン','シナリオ','ドットアート','サウンド','スペシャルサンクス'];
function create({finish}){const el=id=>document.getElementById(id),portrait=el('portrait').getContext('2d');
 const timeline=new StageIntro.Timeline((c)=>{el('dialogue').hidden=!!c.duration;el('intro-scene').textContent=c.action==='credits'?'STAFF ROLL':'ENDING';if(c.text){el('speaker').textContent=c.speaker===N?'':c.speaker;el('dialogue-text').textContent=c.text;if(c.speaker===A)StoryArt.drawEndingPortrait(portrait,c.face);else if(c.speaker===S)StoryArt.draw(portrait,S,c.face);else portrait.clearRect(0,0,160,160);}},()=>{el('intro-layer').hidden=true;el('dialogue').hidden=true;el('skip-intro').hidden=false;finish();},script);
 const text=(ctx,value,x,y,size=28,color='#fff0bd')=>{ctx.save();ctx.textAlign='center';ctx.font=`900 ${size}px Meiryo,sans-serif`;ctx.lineWidth=Math.max(3,size*.13);ctx.strokeStyle='#151b22';ctx.strokeText(value,x,y);ctx.fillStyle=color;ctx.fillText(value,x,y);ctx.restore();};
 function creditsRender(ctx,t){if(background.complete&&background.naturalWidth)ctx.drawImage(background,0,0,background.naturalWidth,background.naturalHeight,0,0,1280,720);else{ctx.fillStyle='#4a3521';ctx.fillRect(0,0,1280,720);}ctx.fillStyle='#07111a99';ctx.fillRect(0,0,1280,720);const start=760-t*74;credits.forEach((role,i)=>{const y=start+i*128;text(ctx,role,640,y,28);text(ctx,'Yudetaro',640,y+45,38,'#ffe29c');});text(ctx,'THANK YOU FOR PLAYING!',640,start+credits.length*128+75,43,'#fff4cb');}
 return {timeline,get active(){return timeline.active;},start(){el('intro-layer').hidden=false;el('skip-intro').hidden=true;timeline.start();},advance(){timeline.advance();},tick(dt){if(!document.hidden)timeline.tick(dt);},render(ctx){const c=timeline.cue||{};if(c.action==='credits'){creditsRender(ctx,timeline.elapsed);return;}ctx.fillStyle='#07101a88';ctx.fillRect(0,0,1280,720);if(c.action==='the-end'){ctx.fillStyle='#08111de8';ctx.fillRect(0,0,1280,720);text(ctx,'THE END',640,315,70);text(ctx,'ブーメラン野郎！',640,385,38);}else{ShuSprites.draw(ctx,'front',0,360,405);}}};}
root.StageEnding={script,create};
})(window);