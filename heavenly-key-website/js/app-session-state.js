/* Pure session state: changing the foreground never closes an existing app. */
(()=>{'use strict';
class AppSessions{
 constructor(ids){this.ids=new Set(ids);this.opened=new Set();this.active=null;}
 open(id){if(!this.ids.has(id))throw Error('Unknown app');this.opened.add(id);this.active=id;return this.snapshot();}
 minimize(){this.active=null;return this.snapshot();}
 close(id){this.opened.delete(id);if(this.active===id)this.active=null;return this.snapshot();}
 snapshot(){return {active:this.active,opened:[...this.opened],minimized:[...this.opened].filter(id=>id!==this.active)};}
}
globalThis.HKAppSessions=AppSessions;
})();
