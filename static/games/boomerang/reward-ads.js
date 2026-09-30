(function(root){
'use strict';
class RewardSession{
 constructor({request,onReady,onPlaying,onDone,timeout=12000}){this.request=request;this.onReady=onReady;this.onPlaying=onPlaying;this.onDone=onDone;this.timeout=timeout;this.active=false;}
 begin(){if(this.active)return;this.active=true;let ended=false,viewed=false;const finish=(status)=>{if(ended)return;ended=true;clearTimeout(this.timer);this.active=false;this.show=null;this.onDone(viewed,status);};this.cancel=()=>finish('cancelled');this.timer=setTimeout(()=>finish('unavailable'),this.timeout);
 try{this.request({type:'reward',name:'stage1-revive',beforeReward:show=>{if(ended)return;this.show=()=>{if(ended||!this.show)return;this.show=null;clearTimeout(this.timer);this.onPlaying();show();};this.onReady();},beforeAd:()=>{if(!ended){clearTimeout(this.timer);this.onPlaying();}},adViewed:()=>{if(!ended)viewed=true;},adDismissed:()=>{viewed=false;},adBreakDone:info=>finish(info?.breakStatus||'unavailable')});}catch{finish('error');}}
 play(){this.show?.();}
}
function install(config){let ready=false;if(config.enabled){root.adsbygoogle=root.adsbygoogle||[];root.adBreak=root.adConfig=o=>root.adsbygoogle.push(o);const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(config.publisher);script.dataset.adClient=config.publisher;if(config.testMode)script.dataset.adbreakTest='on';document.head.appendChild(script);root.adConfig({preloadAdBreaks:'on',onReady:()=>{ready=true;}});}return {get ready(){return ready;},request(o){if(!config.enabled||!ready){o.adBreakDone({breakStatus:'notReady'});return;}root.adBreak(o);}};}
root.RewardAds={RewardSession,install};if(typeof module!=='undefined')module.exports=root.RewardAds;
})(typeof window!=='undefined'?window:globalThis);
