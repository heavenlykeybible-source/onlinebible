/* Direct picture gestures: drag the approved pair and pinch to resize it. */
(()=>{'use strict';
window.HKApprovedPictureGestures=function(root,handle){
if(!root||!handle||handle.dataset.hkPictureGesture)return;
handle.dataset.hkPictureGesture='true';handle.style.touchAction='none';handle.style.userSelect='none';
handle.querySelectorAll('img').forEach(img=>img.draggable=false);handle.addEventListener('dragstart',e=>e.preventDefault());
const points=new Map();let gesture,suppress=false;
const distance=()=>{const p=[...points.values()];return Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)};
function begin(){const b=root.getBoundingClientRect(),p=[...points.values()];gesture={left:b.left,top:b.top,width:b.width,height:b.height,x:p[0].x,y:p[0].y,moved:suppress};if(p.length>1){gesture.distance=Math.max(1,distance());gesture.focusX=((p[0].x+p[1].x)/2-b.left)/b.width;gesture.focusY=((p[0].y+p[1].y)/2-b.top)/b.height;gesture.moved=true;suppress=true}}
function position(left,top){root.style.setProperty('left',Math.max(0,Math.min(innerWidth-root.offsetWidth,left))+'px','important');root.style.setProperty('top',Math.max(0,Math.min(innerHeight-root.offsetHeight,top))+'px','important');root.style.setProperty('right','auto','important');root.style.setProperty('bottom','auto','important')}
handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;if(!points.size)suppress=false;points.set(e.pointerId,{x:e.clientX,y:e.clientY});handle.setPointerCapture?.(e.pointerId);begin()});
handle.addEventListener('pointermove',e=>{if(!points.has(e.pointerId)||!gesture)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size>1&&gesture.distance){const width=Math.max(130,Math.min(innerWidth-24,360,gesture.width*distance()/gesture.distance));root.style.setProperty('width',width+'px','important');position(gesture.left+(gesture.width-width)*gesture.focusX,gesture.top+(gesture.height-root.offsetHeight)*gesture.focusY);suppress=true;e.preventDefault();return}const p=[...points.values()][0],dx=p.x-gesture.x,dy=p.y-gesture.y;if(!gesture.moved&&Math.hypot(dx,dy)<6)return;gesture.moved=true;suppress=true;position(gesture.left+dx,gesture.top+dy);e.preventDefault()});
function finish(e){points.delete(e.pointerId);if(points.size)begin();else gesture=null}
handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
handle.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();suppress=false}},true);
window.addEventListener('resize',()=>{if(innerWidth<100||innerHeight<100||(!root.style.left&&!root.style.top))return;const b=root.getBoundingClientRect();if(b.right>innerWidth||b.bottom>innerHeight||b.left<0||b.top<0)position(b.left,b.top)});
};
})();
