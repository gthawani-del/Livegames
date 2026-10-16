// Carry the room image into the exact dealer poster and land on the live table frame.
const overlay=document.getElementById('casino-entry');
const start=document.getElementById('entry-start');
const skip=document.getElementById('entry-skip');
const replay=document.getElementById('replay-entry');
const progress=document.getElementById('entry-progress-fill');
const art=document.getElementById('entry-art');
const handoff=document.getElementById('entry-handoff');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const duration=5350;
let running=false,frameId=0,startedAt=0,lastFocus=null,flight=null,transitioning=false;
const seen=()=>{try{return sessionStorage.getItem('spartan-entry-seen')==='1'}catch{return false}};
const remember=()=>{try{sessionStorage.setItem('spartan-entry-seen','1')}catch{}};
function close(){
  running=false;cancelAnimationFrame(frameId);flight?.cancel();flight=null;remember();
  overlay.classList.remove('playing','handoff');overlay.hidden=true;
  document.body.classList.remove('entry-active');progress.style.width='0%';
  if(lastFocus===replay)replay.focus({preventScroll:true});
  document.dispatchEvent(new Event('spartan:table-ready'));
}
function open(){
  lastFocus=document.activeElement;overlay.hidden=false;overlay.classList.remove('playing','handoff');
  handoff.removeAttribute('style');transitioning=false;
  document.body.classList.add('entry-active');progress.style.width='0%';start.focus({preventScroll:true});
}
function flyToTable(){
  if(transitioning)return;
  transitioning=true;
  const rect=document.querySelector('.video-frame').getBoundingClientRect();
  flight=handoff.animate([
    {left:'0px',top:'0px',width:`${innerWidth}px`,height:`${innerHeight}px`,borderRadius:'0px'},
    {left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,borderRadius:'1px'}
  ],{duration:980,easing:'cubic-bezier(.45,.02,.18,1)',fill:'forwards'});
}
function go(){
  if(running)return;
  if(reduced.matches){close();return}
  running=true;overlay.classList.add('playing');startedAt=performance.now();frameId=requestAnimationFrame(tick);
}
function tick(now){
  if(!running)return;
  const elapsed=now-startedAt;
  progress.style.width=`${Math.min(100,Math.round(elapsed/duration*100))}%`;
  if(elapsed>=3900)overlay.classList.add('handoff');
  if(elapsed>=4350)flyToTable();
  if(elapsed>=duration){close();return}
  frameId=requestAnimationFrame(tick);
}
start.addEventListener('click',go);skip.addEventListener('click',close);replay.addEventListener('click',open);
addEventListener('keydown',e=>{
  if(overlay.hidden)return;
  if(e.key==='Escape'){e.preventDefault();close()}
  else if(e.key==='Tab'){
    const available=running?[skip]:[start,skip];const pos=available.indexOf(document.activeElement);
    if(e.shiftKey&&pos===0){e.preventDefault();available.at(-1).focus()}
    else if(!e.shiftKey&&pos===available.length-1){e.preventDefault();available[0].focus()}
  }
});
art.addEventListener('error',()=>{if(!overlay.hidden)close()});
handoff.addEventListener('error',()=>{if(!overlay.hidden)close()});
if(seen()){overlay.hidden=true;queueMicrotask(()=>document.dispatchEvent(new Event('spartan:table-ready')))}else open();
