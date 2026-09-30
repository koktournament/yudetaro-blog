(function(root){
const shu=new Image(),guard=new Image(),soldier=new Image();shu.src='assets/shu-reference.png';guard.src='assets/guard-reference.png';soldier.src='assets/soldier-reference.png';
const soldierBack=new Image();soldierBack.src='assets/soldier-back.png';
const ready=Promise.all([shu.decode(),guard.decode(),soldier.decode(),soldierBack.decode()]);
const shuFaces={grin:[1003,123,280,285],serious:[995,493,209,224],smile:[1227,490,207,229],panic:[994,774,211,239],idea:[1224,780,207,232]};
const guardFaces={smug:[1312,497,211,201],angry:[1083,500,211,201],surprised:[1078,779,216,238]};
function draw(ctx,speaker,face){ctx.save();ctx.imageSmoothingEnabled=true;ctx.clearRect(0,0,160,160);if(speaker==='シュウ'){let r=shuFaces[face]||shuFaces.serious;ctx.drawImage(shu,...r,0,0,160,160);}else if(speaker==='シールダ十人隊長'){let r=guardFaces[face]||guardFaces.smug;ctx.drawImage(guard,...r,0,0,160,160);}else{const r=face==='panic'||face==='dizzy'?[1000,741,208,205]:[1005,479,210,200];ctx.drawImage(soldier,...r,0,0,160,160);}ctx.restore();}
function drawSoldier(ctx,x,y,angle=0,dizzy=false){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.imageSmoothingEnabled=false;ctx.drawImage(soldierBack,390,350,550,800,-24,-43,48,70);if(dizzy){ctx.fillStyle='#ffd582';ctx.font='20px sans-serif';ctx.fillText('✦',-8,-51);}ctx.restore();}
root.StoryArt={ready,draw,drawSoldier};
})(window);
