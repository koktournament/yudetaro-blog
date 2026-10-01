/* Original master-sheet layout retained by the transparent extraction. */
(function(root){
const atlas=new Image(),weapon=new Image();
atlas.src='assets/shu-atlas.png';weapon.src='assets/boomerang.png';
const rows={idle:{y:338,h:136,x:[248,445],w:195},run:{y:474,h:139,x:[248,445,642,835],w:195},throw:{y:614,h:144,x:[852],w:193},hurt:{y:758,h:142,x:[248,427],w:178},down:{y:758,h:142,x:[607,797,1015,1240],w:198}};
const walk=new Image(),guard=new Image();walk.src='assets/shu-walk-v2.png';guard.src='assets/guard.png';
const ready=Promise.all([atlas.decode(),weapon.decode(),walk.decode(),guard.decode()]);
function drawWalk(ctx,frame,x,y,alpha){const cell=[0,4,5,1,3,5][frame%6],col=cell%3,row=Math.floor(cell/3),anchors=[[282,493],[768,493],[1250,493],[285,990],[771,997],[1250,990]],a=anchors[cell],scale=.175;ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(walk,col*512,row*512,512,512,Math.round(x-(a[0]-col*512)*scale),Math.round(y+28-(a[1]-row*512)*scale),512*scale,512*scale);ctx.restore();}
function drawGuard(ctx,x,y,flash=0){ctx.save();ctx.imageSmoothingEnabled=false;if(flash>0)ctx.filter='brightness(1.7)';ctx.drawImage(guard,300,190,680,840,x-51.6,y-67.2,103.2,127.2);ctx.restore();}
function draw(ctx,kind,frame,x,y,alpha=1){if(kind==='run'||kind==='idle'||kind==='hurt'||kind==='throw'){drawWalk(ctx,kind==='run'?frame:2,x,y,alpha);return;}if(!atlas.complete||!atlas.naturalWidth)return;const row=rows[kind],sx=row.x[frame%row.x.length],scale=.56;ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
 // Fixed ground anchor; wide attack and fallen frames retain their natural extent.
 ctx.drawImage(atlas,sx,row.y,row.w,row.h,Math.round(x-57),Math.round(y+23-row.h*scale),row.w*scale,row.h*scale);ctx.restore();}
function boomer(ctx,x,y,angle,alpha=1,size=43){if(!weapon.complete||!weapon.naturalWidth)return;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(weapon,0,0,weapon.width,weapon.height,-size/2,-size/2,size,size);ctx.restore();}
rows.front={y:900,h:160,x:[248,445],w:195};
function portrait(ctx,frame){ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,frame?486:272,910,140,140,0,0,160,160);}
root.ShuSprites={ready,draw,boomer,portrait,drawGuard};
})(window);
