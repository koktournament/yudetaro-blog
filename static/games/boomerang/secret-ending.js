/* Secret reward after defeating Warden Unleashed. */
(function(root){
const A='アイギス';
const script=[
 {action:'castle',duration:.7},
 {speaker:A,face:'helmet',text:'フッ、驚天動地とはまさにこのことだな。'},
 {speaker:A,face:'helmet',text:'まさか我が誇り高き盾を打ち砕く者が現れるとは、夢にも思わなんだぞ。'},
 {speaker:A,face:'helmet',text:'脆く、頼りなげな木製の武器に、一体いかなる異能の力を込めたというのだ？'},
 {speaker:A,face:'helmet',text:'あー、暑い'},
 {speaker:A,face:'helmet',text:'もう負けたし　皇帝じゃないし'},
 {speaker:A,face:'helmet',text:'言葉遣いも普通でいいや'},
 {speaker:A,face:'helmet',text:'低音でしゃべるの疲れるし'},
 {speaker:A,face:'unmasked',text:'暑い……兜ぬご'},
 {action:'reveal',duration:2.4}
];
function create({finish}){
 const el=id=>document.getElementById(id),portrait=el('portrait').getContext('2d');
 const scene=new Image(),face=new Image();scene.src='assets/aegis-unmasked.png';face.src='assets/aegis-secret-portrait.png';
 const timeline=new StageIntro.Timeline(c=>{
  el('dialogue').hidden=!!c.duration;el('intro-scene').textContent='城にて';
  if(c.text){el('speaker').textContent=A;el('dialogue-text').textContent=c.text;portrait.clearRect(0,0,160,160);if(c.face==='helmet')StoryArt.drawEndingPortrait(portrait,'serious');else if(face.complete&&face.naturalWidth)portrait.drawImage(face,0,0,face.naturalWidth,face.naturalHeight,0,0,160,160);}
 },()=>{el('intro-layer').hidden=true;el('dialogue').hidden=true;el('skip-intro').hidden=false;finish();},script);
 return {timeline,get active(){return timeline.active},start(){el('intro-layer').hidden=false;el('skip-intro').hidden=true;timeline.start()},advance(){timeline.advance()},tick(dt){if(!document.hidden)timeline.tick(dt)},render(ctx){const c=timeline.cue||{};if(c.action==='reveal'&&scene.complete&&scene.naturalWidth){ctx.save();ctx.filter='brightness(1.07) contrast(1.04)';const h=720,w=scene.naturalWidth/scene.naturalHeight*h;ctx.drawImage(scene,0,0,scene.naturalWidth,scene.naturalHeight,(1280-w)/2,0,w,h);ctx.restore();return;}ctx.fillStyle='#101521';ctx.fillRect(0,0,1280,720);ctx.fillStyle='#401e27';ctx.fillRect(142,0,125,720);ctx.fillRect(1013,0,125,720);ctx.fillStyle='#be985f';ctx.fillRect(197,0,13,720);ctx.fillRect(1070,0,13,720);ctx.fillStyle='#ffffff08';ctx.beginPath();ctx.arc(640,160,300,0,Math.PI*2);ctx.fill();}};
}
root.StageSecretEnding={script,create};
})(window);