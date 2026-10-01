/* Deterministic simulation; positions are in the fixed 1280 × 720 arena. */
(function(root){
'use strict';
const W=1280,H=720,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function curve(origin,t){const u=1-t;return {x:clamp(origin.x+3*u*t*t*280+t*t*t*300,14,W-14),y:clamp(origin.y-3*u*u*t*280-3*u*t*t*400-t*t*t*150,14,H-14)};}
class Battle{
 constructor(stage=1){this.reset(stage);}
 reset(stage=this.stage||1){this.stage=[1,2,3].includes(stage)?stage:1;this.maxBossHP=this.stage===3?70:this.stage===2?80:100;this.player={x:515,y:555,hp:100,inv:0};this.boss={x:640,y:222,baseY:222,hp:this.maxBossHP,dir:1,phase:'move',timer:2.4,flash:0,shieldFlash:0};this.weapon={state:'held',x:515,y:555,t:0,trail:[]};this.bullets=[];this.events=[];this.time=0;this.state='ready';this.reviveUsed=false;this.stats={throws:0,hits:0,blocks:0};}
 emit(type,x,y){this.events.push({type,x,y});}
 fire(){const b=this.boss,p=this.player,angle=Math.atan2(p.y-(b.y+41),p.x-b.x),spread=this.stage>=2?[-.30,0,.30]:[-.17,0,.17];for(const offset of spread)this.bullets.push({x:b.x,y:b.y+41,vx:Math.cos(angle+offset)*155,vy:Math.sin(angle+offset)*155});b.phase='recover';b.timer=.42;this.emit('shoot',b.x,b.y+41);}
 start(stage=this.stage){this.reset(stage);this.state='playing';}
 revive(){if(this.state!=='over'||this.reviveUsed)return false;this.reviveUsed=true;this.player.hp=50;this.player.inv=2;this.bullets=[];this.events=[];this.state='paused';return true;}
 throw(){if(this.state!=='playing'||this.weapon.state!=='held')return false;const p=this.player;this.weapon={state:'out',x:p.x,y:p.y-21,origin:{x:p.x,y:p.y-21},t:0,trail:[]};this.stats.throws++;this.emit('throw',p.x,p.y);return true;}
 blocked(){return distance(this.weapon,this.boss)<55;}
 shielded(w=this.weapon,b=this.boss){if(this.stage!==3)return w.y>b.y+13&&Math.abs(w.x-b.x)<43;const front=w.y>b.y+12&&Math.abs(w.x-b.x)<52,left=w.x<b.x-8&&w.y>b.y-38;return front||left;}
 hitBoss(){const b=this.boss,w=this.weapon,shield=this.shielded(w,b);if(shield){b.shieldFlash=.23;this.stats.blocks++;this.emit('shield',w.x,w.y);}else{b.hp=Math.max(0,b.hp-10);b.flash=.24;this.stats.hits++;this.emit('hit',w.x,w.y);}
 // Launch away from the impact toward the front, with lateral spread from contact position.
 const dx=w.x-b.x,side=shield?clamp(dx/49,-.65,.65):(Math.sign(dx)||b.dir||1)*Math.max(.4,Math.min(.9,Math.abs(dx)/49));
 const length=Math.hypot(side,1),range=shield?235:175;
 w.state='falling';w.from={x:w.x,y:w.y};w.to={x:clamp(w.x+side/length*range,24,W-24),y:clamp(w.y+range/length,24,H-24)};
 w.duration=shield?.62:.78;w.height=shield?56:32;w.spin=shield?48:25;w.angle=this.time*22;w.z=0;w.t=0;w.trail=[];
 if(b.hp===0){this.state='clear';this.emit('clear',b.x,b.y);}}
 rebound(dt){const w=this.weapon;if(w.state!=='falling')return;w.t+=dt;const u=clamp(w.t/w.duration,0,1),travel=(1.4*u-.4*u*u);w.x=w.from.x+(w.to.x-w.from.x)*travel;w.y=w.from.y+(w.to.y-w.from.y)*travel;w.z=4*w.height*u*(1-u);w.angle+=w.spin*(1-.35*u)*dt;if(u===1){w.state='ground';w.z=0;w.t=0;this.emit('land',w.x,w.y);}}
 update(dt,input={}){if(this.state==='clear'){this.rebound(Math.min(dt,.1));return;}if(this.state!=='playing')return;for(let remain=Math.min(dt,.1);remain>0;){const step=Math.min(remain,1/120);this.step(step,input);remain-=step;if(this.state!=='playing')break;}}
 step(dt,input){this.time+=dt;const p=this.player,b=this.boss,w=this.weapon;p.inv=Math.max(0,p.inv-dt);b.flash=Math.max(0,b.flash-dt);b.shieldFlash=Math.max(0,b.shieldFlash-dt);
 let mx=input.x??((input.right?1:0)-(input.left?1:0)),my=input.y??((input.down?1:0)-(input.up?1:0)),n=Math.max(1,Math.hypot(mx,my));p.x=clamp(p.x+mx/n*235*dt,20,W-20);p.y=clamp(p.y+my/n*235*dt,22,H-25);
 b.timer-=dt;const mobile=this.stage>=2;if(b.phase==='move'||mobile){const speed=this.stage===3?112:this.stage===2?102:73;b.x+=b.dir*speed*dt;if(b.x>930){b.x=930;b.dir=-1;}if(b.x<350){b.x=350;b.dir=1;}if(this.stage===3)b.y=b.baseY+Math.sin(this.time*2.5)*52;}if(b.phase==='move'){if(b.timer<=0){if(mobile)this.fire();else{b.phase='windup';b.timer=.8;this.emit('windup',b.x,b.y);}}}else if(b.phase==='windup'&&b.timer<=0){this.fire();}else if(b.phase==='recover'&&b.timer<=0){b.phase='move';b.timer=this.stage>=2?1.85:2.4;}
 const sep=distance(p,b);if(sep<60){const nx=sep>0?(p.x-b.x)/sep:0,ny=sep>0?(p.y-b.y)/sep:1;p.x=b.x+nx*60;p.y=b.y+ny*60;}
 if(w.state==='held'){w.x=p.x;w.y=p.y-21;}else if(w.state==='out'||w.state==='returning'){w.t+=dt;if(w.state==='out'){Object.assign(w,curve(w.origin,Math.min(w.t/1.2,1)));if(w.t>=1.2){w.state='returning';w.t=0;}}else{const d=distance(w,p),speed=540;if(d<speed*dt+17){w.state='held';w.trail=[];this.emit('catch',p.x,p.y);}else{w.x+=(p.x-w.x)/d*speed*dt;w.y+=(p.y-w.y)/d*speed*dt;}}if(w.state!=='held'){w.trail.push({x:w.x,y:w.y});if(w.trail.length>32)w.trail.shift();if(distance(w,b)<49)this.hitBoss();}}else if(w.state==='falling'){this.rebound(dt);}else if(w.state==='ground'&&!this.blocked()&&distance(w,p)<30){w.state='held';this.emit('pickup',p.x,p.y);}
 this.bullets=this.bullets.filter(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;if(distance(q,p)<21){if(p.inv<=0){p.hp=Math.max(0,p.hp-20);p.inv=1.1;this.emit('damage',p.x,p.y);if(p.hp===0){this.state='over';this.emit('over',p.x,p.y);}}return false;}return q.x>-20&&q.x<W+20&&q.y>-20&&q.y<H+20;});
 }
 snapshot(){return {stage:this.stage,bossMaxHP:this.maxBossHP,state:this.state,playerHP:this.player.hp,bossHP:this.boss.hp,weapon:this.weapon.state,blocked:this.weapon.state==='ground'&&this.blocked(),...this.stats};}
}
root.BoomerangBattle={Battle,curve,W,H};if(typeof module!=='undefined')module.exports=root.BoomerangBattle;
})(typeof window!=='undefined'?window:globalThis);

