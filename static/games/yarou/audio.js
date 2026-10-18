export const MUSIC_LEVELS={accused:0,'verdict-call':0,judgment:0,execution:0,banished:0,ending:.4,voice:.2,lineup:0,summon:0,result:.6,personality:.7};
const effectNames={click:'confirm',page:'page',gavel:'gavel',stamp:'gavel',transition:'page'};
const volumes={click:.65,page:.75,gavel:.85,stamp:.7,transition:.35};
export class CourtAudio{
 constructor(env=globalThis,onChange=()=>{}){
  this.env=env;this.onChange=onChange;this.enabled=false;this.musicMuted=false;this.effectsMuted=false;
  this.musicVolume=.18;this.effectsVolume=.35;this.scene='title';this.hidden=false;this.typeActive=false;this.buffers={};this.typing=null;this.loading=null;this.generation=0;
  this.bgm=new env.Audio(new URL('./assets/audio/court-bgm.mp3',import.meta.url).href);this.bgm.loop=true;this.bgm.preload='none';this.bgm.playsInline=true;
 }
 _init(){
  if(this.ctx)return;const Context=this.env.AudioContext||this.env.webkitAudioContext;
  if(!Context)throw Error('このブラウザーでは音声を開始できません。');
  this.ctx=new Context();this.musicGain=this.ctx.createGain();this.fxGain=this.ctx.createGain();
  this.musicGain.gain.value=0;this.fxGain.gain.value=this.effectsVolume;
  this.musicGain.connect(this.ctx.destination);this.fxGain.connect(this.ctx.destination);
  this.media=this.ctx.createMediaElementSource(this.bgm);this.media.connect(this.musicGain);
 }
 _notify(message=''){this.onChange({enabled:this.enabled,musicMuted:this.musicMuted,effectsMuted:this.effectsMuted,musicVolume:this.musicVolume,effectsVolume:this.effectsVolume,message});}
 async setEnabled(value){
  this.enabled=!!value;this._notify();
  if(!this.enabled){this.generation++;this.bgm.pause();this._stopTypeSource();if(this.musicGain)this.musicGain.gain.value=0;return;}
  try{
   this._init();
   // Both calls are made synchronously in the user's gesture before the first await.
   const resume=this.ctx.resume();const play=this._music();
   this._loadEffects().catch(()=>this._notify('効果音を読み込めませんでした。もう一度「音」をONにしてください。'));
   await resume;await play;
   if(this.typeActive)this._startTypeSource();
  }catch{
   this.enabled=false;this.bgm.pause();this._stopTypeSource();this._notify('音を開始できませんでした。もう一度「音」を押してください。');
  }
 }
 async _loadEffects(){
  if(this.loading)return this.loading;
  this.loading=Promise.all(['confirm','page','gavel','typewriter'].map(async name=>{
   if(this.buffers[name])return;
   const r=await this.env.fetch(new URL(`./assets/audio/${name}.mp3`,import.meta.url));if(!r.ok)throw Error(name);
   this.buffers[name]=await this.ctx.decodeAudioData(await r.arrayBuffer());
  })).then(()=>{if(this.typeActive)this._startTypeSource();}).catch(e=>{this.loading=null;throw e;});
  return this.loading;
 }
 targetMusic(){return this.enabled&&!this.musicMuted&&!this.hidden?this.musicVolume*(MUSIC_LEVELS[this.scene]??1):0;}
 async _music(){
  if(!this.ctx)return;const target=this.targetMusic(),generation=++this.generation;
  const t=this.ctx.currentTime;this.musicGain.gain.cancelScheduledValues(t);this.musicGain.gain.setValueAtTime(this.musicGain.gain.value,t);this.musicGain.gain.linearRampToValueAtTime(target,t+.55);
  if(target>0){if(this.bgm.paused)await this.bgm.play();}
  else if(this.hidden||!this.enabled||this.musicMuted){this.bgm.pause();}
  else this.env.setTimeout(()=>{if(this.generation===generation&&this.targetMusic()===0)this.bgm.pause();},600);
 }
 setScene(scene){this.scene=scene;this._music().catch(()=>this._notify('BGMが停止しました。「音」を押すと再開できます。'));}
 setHidden(hidden){this.hidden=hidden;if(hidden)this._stopTypeSource();else if(this.typeActive)this._startTypeSource();this._music().catch(()=>{});}
 setMusicVolume(v){this.musicVolume=Math.max(0,Math.min(1,Number(v)||0));this._music().catch(()=>{});this._notify();}
 setEffectsVolume(v){this.effectsVolume=Math.max(0,Math.min(1,Number(v)||0));if(this.fxGain)this.fxGain.gain.value=this.effectsMuted?0:this.effectsVolume;this._notify();}
 setMusicMuted(v){this.musicMuted=!!v;this._music().catch(()=>{});this._notify();}
 setEffectsMuted(v){this.effectsMuted=!!v;if(this.fxGain)this.fxGain.gain.value=this.effectsMuted?0:this.effectsVolume;if(v)this._stopTypeSource();else if(this.typeActive)this._startTypeSource();this._notify();}
 effect(kind='click'){
  if(!this.enabled||this.hidden||this.effectsMuted||!this.ctx)return false;
  const buffer=this.buffers[effectNames[kind]];if(!buffer)return false;
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;gain.gain.value=volumes[kind]??.5;
  source.playbackRate.value=kind==='stamp'?.8:kind==='transition'?.9:1;
  let filter;if(kind==='stamp'){filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=950;source.connect(filter);filter.connect(gain);}else source.connect(gain);
  gain.connect(this.fxGain);source.onended=()=>{source.disconnect();gain.disconnect();filter?.disconnect();};source.start();return true;
 }
 startTyping(){this.typeActive=true;this._startTypeSource();}
 stopTyping(){this.typeActive=false;this._stopTypeSource();}
 _startTypeSource(){
  if(this.typing||!this.enabled||this.hidden||this.effectsMuted||!this.ctx||!this.buffers.typewriter||!this.typeActive)return;
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=this.buffers.typewriter;source.loop=true;gain.gain.value=0;gain.gain.linearRampToValueAtTime(.22,this.ctx.currentTime+.025);source.connect(gain);gain.connect(this.fxGain);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();this.typing={source,gain};
 }
 _stopTypeSource(){
  if(!this.typing)return;const {source,gain}=this.typing;this.typing=null;const t=this.ctx.currentTime;
  gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(gain.gain.value,t);gain.gain.linearRampToValueAtTime(0,t+.025);source.stop(t+.03);
 }
}
