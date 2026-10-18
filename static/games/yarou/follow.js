// Keep the current line visible; never pull a reader back after scrolling up.
export class ReadingFollow{
 constructor(env){this.env=env;this.enabled=true;this.previousY=0;this.touchY=null;}
 reset(){this.enabled=true;this.previousY=0;this.touchY=null;this.env.changed(true);}
 pause(){if(!this.enabled)return;this.enabled=false;this.env.changed(false);}
 observe(y){if(y<this.previousY-4)this.pause();this.previousY=y;}
 wheel(delta){if(delta<0)this.pause();}
 touch(y){if(this.touchY!==null&&y>this.touchY+6)this.pause();this.touchY=y;}
 resume(){this.enabled=true;this.env.changed(true);}
 follow(bottom){if(!this.enabled||!Number.isFinite(bottom))return;const extra=bottom-(this.env.height()-140);if(extra>0)this.env.scroll(extra);}
}
