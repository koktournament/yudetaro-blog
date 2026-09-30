/* One media element avoids overlapping tracks and supports mobile user gestures. */
(function(root){
class SceneMusic{
 constructor(media){this.media=media;media.loop=true;media.preload='metadata';media.volume=.38;this.scene='';this.enabled=true;this.unlocked=false;this.suspended=false;this.pending=false;this.revision=0;}
 setScene(scene){if(this.scene===scene)return;this.scene=scene;this.revision++;this.pending=false;this.media.pause();if(scene){this.media.src='assets/audio/'+scene+'.mp3';this.media.load();}this.sync();}
 unlock(){this.unlocked=true;this.sync();}
 enable(value){this.enabled=value;this.sync();}
 suspend(value){if(this.suspended===value)return;this.suspended=value;this.sync();}
 sync(){if(!this.scene||!this.enabled||!this.unlocked||this.suspended){this.media.pause();return;}if(!this.media.paused||this.pending)return;const version=this.revision;this.pending=true;Promise.resolve(this.media.play()).catch(()=>{}).finally(()=>{if(version===this.revision)this.pending=false;});}
}
root.SceneMusic=SceneMusic;if(typeof module!=='undefined')module.exports=SceneMusic;
})(typeof window!=='undefined'?window:globalThis);
