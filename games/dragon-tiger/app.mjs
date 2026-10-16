import {CHIPS,SPOTS,INITIAL_BALANCE,drawPair,settle,resultAnnouncement,cardText,totalBet,canDeal} from './game.mjs';
import {createVoice,parseVoiceCommand} from './voice.mjs';
import {DRAGON_TRACK,TIGER_TRACK,DRAGON_SIZE,TIGER_SIZE,poseAt} from './card-motion.mjs';
import {createRoundMachine,ROUND_STATES,isRoundActive} from './round-machine.mjs';
const $=id=>document.getElementById(id);
const video=$('dealer'),videoFrame=video.parentElement,face=$('dragon-mark'),dragonInk=$('dragon-ink');
const tigerMark=$('tiger-mark'),tigerInk=$('tiger-ink'),chipTray=$('chips');
const voice=createVoice({onLine:text=>{$('voice-line').textContent=text},onCommand:handleCommand});
if(voice.inputAvailable)$('voice-mic').hidden=false;
const rankName={A:'Ace',J:'Jack',Q:'Queen',K:'King'};
const suitName={'♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs'};
const spokenCard=c=>`${rankName[c.rank]||c.rank} of ${suitName[c.suit]}`;
let balance=INITIAL_BALANCE,bets={dragon:0,tie:0,tiger:0},stack=[],chip=25,pair=null,round=1,history=[],raf=0,watchdog=0,dragonShown=false,tigerShown=false;
const format=n=>n.toLocaleString('en-US',{maximumFractionDigits:1});
const rankIndex=Object.fromEntries(['A','2','3','4','5','6','7','8','9','10','J','Q','K'].map((rank,index)=>[rank,index]));
const suitIndex={'♠':0,'♥':1,'♦':2,'♣':3};
function setCardSprite(node,card,sheet='base'){
  node.style.backgroundImage=`url(assets/cards-${sheet}.webp)`;
  node.style.backgroundSize='1300% 400%';
  node.style.backgroundPosition=`${rankIndex[card.rank]/12*100}% ${suitIndex[card.suit]/3*100}%`;
}
const roundLabels={
  [ROUND_STATES.READY]:'READY',
  [ROUND_STATES.BETTING_OPEN]:'BETS OPEN',
  [ROUND_STATES.BETTING_LOCKED]:'NO MORE BETS',
  [ROUND_STATES.DEAL_DRAGON]:'DEALING DRAGON',
  [ROUND_STATES.DEAL_TIGER]:'DEALING TIGER',
  [ROUND_STATES.REVEAL]:'CARDS REVEALED',
  [ROUND_STATES.SETTLEMENT]:'SETTLING',
  [ROUND_STATES.ROUND_COMPLETE]:'ROUND COMPLETE'
};
const machine=createRoundMachine(({state,payload})=>syncRoundState(state,payload?.label));
function setInk(image,card,moving){
  setCardSprite(image,card,moving?'moving-ink':'ink');
}
function setResultCard(id,card){
  const node=$(id);node.replaceChildren();
  setCardSprite(node,card);node.setAttribute('aria-label',spokenCard(card));node.classList.remove('covered');
}
function coverResultCard(id){
  const node=$(id);node.replaceChildren();node.style.backgroundImage='url(assets/card-back.svg)';
  node.style.backgroundSize='cover';node.style.backgroundPosition='center';
  node.setAttribute('aria-label','Card face down');node.classList.add('covered');
}
function clearResultCard(id){
  const node=$(id);node.replaceChildren('—');node.classList.remove('covered');
  node.style.removeProperty('background-image');node.style.removeProperty('background-size');node.style.removeProperty('background-position');
}
// Ink follows the actual filmed white cards. Coordinates are measured from
// this exact 910×512 source clip; no synthetic white card covers its lighting.
const DRAGON_REVEAL=3.65,TIGER_REVEAL=7.25;
function drawInk(t){
  for(const [mark,card,track,sizes] of [[face,pair?.dragon,DRAGON_TRACK,DRAGON_SIZE],[tigerMark,pair?.tiger,TIGER_TRACK,TIGER_SIZE]]){
    if(!card||t<track[0][0]){mark.style.visibility='hidden';continue}
    const [x,y,angle]=poseAt(track,t),[rawWidth,rawHeight]=poseAt(sizes,t);
    const width=rawWidth*.89,height=rawHeight*.84;
    mark.style.left=`${x/9.1}%`;mark.style.top=`${y/5.12}%`;
    mark.style.width=`${width/9.1}%`;mark.style.height=`${height/5.12}%`;
    mark.style.transform=`translate(-50%,-50%) rotate(${angle.toFixed(2)}deg)`;
    mark.style.visibility='visible';
  }
}
function showDragon(){
  if(dragonShown)return;
  dragonShown=true;
  if(machine.state===ROUND_STATES.DEAL_DRAGON)machine.transition('DRAGON_REVEALED');
  const c=pair.dragon;
  setResultCard('dragon-card',c);
  $('result').textContent='Tiger card next';
  voice.cueCard('dragon',c,'Dragon, '+spokenCard(c)+'.');
}
function showTiger(){
  if(tigerShown)return;
  tigerShown=true;
  if(machine.state===ROUND_STATES.DEAL_TIGER)machine.transition('TIGER_REVEALED');
  const c=pair.tiger;
  setResultCard('tiger-card',c);
  voice.cueCard('tiger',c,'Tiger, '+spokenCard(c)+'.');
}
function render(){
  const total=totalBet(bets);
  const locked=isRoundActive(machine.state);
  $('balance').textContent=format(balance);$('round').textContent=String(round).padStart(3,'0');
  $('total').textContent=format(total);
  for(const spot of SPOTS){$('stake-'+spot).textContent=format(bets[spot]);document.querySelector(`[data-spot="${spot}"]`).disabled=locked}
  for(const button of chipTray.children){button.classList.toggle('selected',Number(button.dataset.value)===chip);button.setAttribute('aria-pressed',Number(button.dataset.value)===chip?'true':'false');button.disabled=locked}
  $('undo').disabled=locked||!stack.length;$('clear').disabled=locked||!stack.length;
  $('deal').disabled=!canDeal(bets,machine.state);
  $('deal').innerHTML=locked?'Dealing…':total===0?'Place a bet first':'Deal cards <span>→</span>';
  $('bet-guidance').classList.toggle('ready',total>0);
  document.querySelector('.spots').classList.toggle('coach-focus',total===0&&!locked);
  $('guidance-text').textContent=locked?'Bets are locked. Watch the dealer reveal both cards.':total>0?`${format(total)} credits in play. Deal cards when you are ready.`:`${format(chip)} chip selected. Tap Dragon, Tiger, or Tie to place a bet.`;
  document.querySelector('.guidance-number').textContent=locked?'03':total>0?'02':'01';
  $('reset').disabled=locked;
}
function syncRoundState(state,label){
  const locked=isRoundActive(state);
  document.body.dataset.roundState=state;
  document.body.dataset.phase=locked?'dealing':state===ROUND_STATES.ROUND_COMPLETE?'result':'betting';
  $('phase').className='phase '+(locked?'dealing':state===ROUND_STATES.ROUND_COMPLETE?'result':'');
  $('phase').textContent=label||roundLabels[state];
  render();
}
function place(spot){
  if(isRoundActive(machine.state))return;
  if(machine.state===ROUND_STATES.ROUND_COMPLETE)machine.transition('OPEN_BETS');
  if(chip>balance){$('message').textContent='Not enough demo credits for that chip.';return}
  bets[spot]+=chip;balance-=chip;stack.push({spot,amount:chip});
  $('message').textContent=`${format(chip)} added to ${spot.toUpperCase()}. ${format(bets[spot])} on ${spot.toUpperCase()}; total bet ${format(totalBet(bets))}.`;
  voice.speak(`${format(chip)} added to ${spot}. ${format(bets[spot])} on ${spot}. Total bet ${format(totalBet(bets))} credits.`);
  render();
}
function undo(){if(isRoundActive(machine.state)||!stack.length)return;const item=stack.pop();bets[item.spot]-=item.amount;balance+=item.amount;$('message').textContent=`Removed ${format(item.amount)} from ${item.spot.toUpperCase()}. Total bet ${format(totalBet(bets))}.`;voice.speak(`Last bet removed. Total bet ${format(totalBet(bets))} credits.`);render()}
function clear(){if(isRoundActive(machine.state))return;for(const s of SPOTS)balance+=bets[s];bets={dragon:0,tie:0,tiger:0};stack=[];$('message').textContent='Bets cleared.';voice.speak('Bets cleared.');render()}
function frame(){
  if(!isRoundActive(machine.state))return;
  const t=video.currentTime;
  drawInk(t);
  if(t>=DRAGON_REVEAL)showDragon();
  if(t>=4.2&&dragonShown)setInk(dragonInk,pair.dragon,false);
  if(t>=TIGER_REVEAL)showTiger();
  if(t>=7.83&&tigerShown)setInk(tigerInk,pair.tiger,false);
  if(t>=8.0){complete();return}
  raf=requestAnimationFrame(frame);
}
function playbackProblem(){
  if(!isRoundActive(machine.state))return;
  cancelAnimationFrame(raf);clearTimeout(watchdog);video.pause();
  face.style.visibility='hidden';tigerMark.style.visibility='hidden';
  clearResultCard('dragon-card');clearResultCard('tiger-card');
  $('result').textContent='Round paused';$('message').textContent='Video did not finish. Your bets are held; tap Deal cards to retry.';
  videoFrame.classList.remove('result-zoom');
  voice.speak('Round paused. Your bets are held. Tap deal cards to retry.');
  pair=null;machine.transition('RECOVER',{label:'BETS OPEN'});
}
function complete(){
  if(!isRoundActive(machine.state))return;
  cancelAnimationFrame(raf);clearTimeout(watchdog);video.pause();
  showDragon();showTiger();drawInk(8.0);setInk(dragonInk,pair.dragon,false);setInk(tigerInk,pair.tiger,false);
  if(machine.state!==ROUND_STATES.REVEAL)return playbackProblem();
  machine.transition('SETTLE');
  const {placed,returned,net,prize,refund}=settle(bets,pair.winner);balance+=returned;
  const winner=pair.winner.toUpperCase();
  $('result').textContent=winner==='TIE'?'TIE · Same rank':winner+' WINS';
  $('message').textContent=`Dragon ${cardText(pair.dragon)} · Tiger ${cardText(pair.tiger)}`;
  // The result is the priority cue. iOS can drop a queued utterance after
  // the Tiger call, so start one self-contained result utterance here.
  voice.cueResult(resultAnnouncement(pair.winner,{prize,refund,net},balance),{winner:pair.winner,prize});
  $('payout').textContent=net>0?`+${format(net)} credits`:net<0?`−${format(-net)} credits`:'No change';
  $('payout').className='payout '+(net>0?'positive':net<0?'negative':'');
  $('result-payout').textContent=prize>0?`PRIZE ${format(prize)} · NET ${net>=0?'+':'−'}${format(Math.abs(net))} CREDITS`:net<0?`NO PRIZE · ROUND LOSS −${format(-net)} CREDITS`:placed?'NO NET CHANGE':'NO BET PLACED';
  $('result-payout').className='result-payout '+(net>0?'positive':net<0?'negative':'');
  history.unshift(pair.winner);history=history.slice(0,12);
  $('history').replaceChildren(...history.map(w=>{const node=document.createElement('span');node.className='history-pill '+w;node.textContent=w==='tie'?'=':w[0].toUpperCase();node.setAttribute('aria-label',w);return node}));
  bets={dragon:0,tie:0,tiger:0};stack=[];round++;
  videoFrame.classList.add('result-zoom');
  machine.transition('COMPLETE',{label:winner+' WINS'});
}
async function deal(){
  if(isRoundActive(machine.state))return;
  if(!canDeal(bets,machine.state)){$('message').textContent='Place a bet on Dragon, Tiger, or Tie before dealing.';render();return}
  try{pair=drawPair()}catch{$('message').textContent='Random card draw unavailable on this device.';return}
  videoFrame.classList.remove('result-zoom');
  dragonShown=false;tigerShown=false;face.style.visibility='hidden';tigerMark.style.visibility='hidden';
  setInk(dragonInk,pair.dragon,true);setInk(tigerInk,pair.tiger,true);
  coverResultCard('dragon-card');coverResultCard('tiger-card');
  $('result').textContent='Cards in play';$('result-payout').textContent='';$('result-payout').className='result-payout';$('payout').textContent='';$('message').textContent='Bets closed. Dealer drawing Dragon…';
  voice.cue('no-more-bets','No more bets.');
  video.pause();video.currentTime=0;video.muted=true;
  machine.transition('LOCK_BETS');
  try{await video.play();machine.transition('START_DRAGON');raf=requestAnimationFrame(frame);watchdog=setTimeout(()=>{if(video.currentTime>=8.0)complete();else playbackProblem()},14000)}
  catch{playbackProblem()}
}
for(const value of CHIPS){const button=document.createElement('button');button.type='button';button.className='chip';button.textContent=format(value);button.dataset.value=value;button.setAttribute('aria-label',`${value} credit chip`);button.addEventListener('click',()=>{chip=value;render()});chipTray.append(button)}
for(const button of document.querySelectorAll('[data-spot]'))button.addEventListener('click',()=>place(button.dataset.spot));
$('undo').addEventListener('click',undo);$('clear').addEventListener('click',clear);$('deal').addEventListener('click',deal);
function resetDemo(){if(isRoundActive(machine.state))return;balance=INITIAL_BALANCE;bets={dragon:0,tie:0,tiger:0};stack=[];round=1;history=[];pair=null;video.pause();video.currentTime=0;videoFrame.classList.remove('result-zoom');face.style.visibility='hidden';tigerMark.style.visibility='hidden';clearResultCard('dragon-card');clearResultCard('tiger-card');$('result').textContent='Place your bets';$('result-payout').textContent='';$('result-payout').className='result-payout';$('payout').textContent='';$('history').textContent='No rounds yet';$('message').textContent='Demo balance reset.';voice.speak('Demo balance reset. Place your bets.');machine.transition('RESET',{label:'BETS OPEN'})}
$('reset').addEventListener('click',resetDemo);
function setSoundButton(on){const button=$('voice-toggle');button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Turn sound off':'Turn sound on');button.title=on?'Sound on':'Sound off'}
$('voice-toggle').addEventListener('click',()=>setSoundButton(voice.toggle()));
$('voice-repeat').addEventListener('click',()=>voice.repeat());
$('voice-mic').addEventListener('click',()=>voice.listen());
function handleCommand(transcript){
  const command=parseVoiceCommand(transcript);
  switch(command.type){
    case 'chip':chip=command.value;render();voice.speak(`${chip} credit chip selected.`);break;
    case 'bet':place(command.spot);break;
    case 'deal':deal();break;
    case 'undo':undo();break;
    case 'clear':clear();break;
    case 'reset':resetDemo();break;
    case 'help':document.querySelector('.how-to').open=true;voice.speak('Select a chip, bet on Dragon, Tiger, or Tie, then deal cards.');break;
    case 'repeat':voice.repeat();break;
    case 'voice-on':if(!voice.enabled)setSoundButton(voice.toggle());break;
    case 'voice-off':if(voice.enabled)setSoundButton(voice.toggle());break;
    default:voice.speak('Command not understood. Say help to hear the options.');
  }
}
video.addEventListener('ended',complete);video.addEventListener('error',playbackProblem);
machine.transition('OPEN_BETS');
setSoundButton(false);
const ftue=$('ftue');
const guideSeen=()=>{try{return localStorage.getItem('spartan-ftue-complete')==='1'}catch{return false}};
document.addEventListener('spartan:table-ready',()=>{
  if(guideSeen()||ftue.open)return;
  setTimeout(()=>{if(!guideSeen()&&!document.body.classList.contains('entry-active'))ftue.showModal()},550);
});
$('ftue-start').addEventListener('click',()=>{
  try{localStorage.setItem('spartan-ftue-complete','1')}catch{}
  ftue.close();document.querySelector('.bet-panel').scrollIntoView({behavior:'smooth',block:'center'});
  document.querySelector('.spot.dragon').focus({preventScroll:true});
});
