/* Pointer capture keeps the moving finger independent from the attack finger. */
(function(root){
function stickVector(dx,dy,radius=44){const d=Math.hypot(dx,dy);if(d<radius*.16)return {x:0,y:0};const strength=Math.min(1,(d/radius-.16)/.84);return {x:dx/d*strength,y:dy/d*strength};}
function installTouch(arena,zone,button,onAttack){
 const stick=zone.querySelector('.stick'),knob=zone.querySelector('.knob');
 const state={x:0,y:0};let pointer=null,origin=null;
 function reset(){const id=pointer;pointer=null;state.x=state.y=0;origin=null;stick.classList.remove('active');stick.style.left='';stick.style.top='';knob.style.transform='';if(id!==null&&zone.hasPointerCapture(id))zone.releasePointerCapture(id);}
 zone.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||pointer!==null)return;e.preventDefault();pointer=e.pointerId;zone.setPointerCapture(pointer);const box=zone.getBoundingClientRect();origin={x:e.clientX,y:e.clientY};stick.style.left=(e.clientX-box.left)+'px';stick.style.top=(e.clientY-box.top)+'px';stick.classList.add('active');});
 zone.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();const dx=e.clientX-origin.x,dy=e.clientY-origin.y;Object.assign(state,stickVector(dx,dy));const d=Math.hypot(dx,dy)||1,f=Math.min(d,44)/d;knob.style.transform=`translate(${dx*f}px,${dy*f}px)`;});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])zone.addEventListener(name,e=>{if(e.pointerId===pointer)reset();});
 button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();onAttack();});
 button.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();onAttack();}});
 arena.addEventListener('contextmenu',e=>e.preventDefault());
 // Browser gesture prevention is limited to the game; the ad/footer remain scrollable.
 arena.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
 arena.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
 return {state,reset};
}
root.BattleTouch={stickVector,installTouch};if(typeof module!=='undefined')module.exports=root.BattleTouch;
})(typeof window!=='undefined'?window:globalThis);
