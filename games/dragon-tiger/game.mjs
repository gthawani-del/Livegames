export const RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
export const SUITS=['♠','♥','♦','♣'];
export const SPOTS=['dragon','tie','tiger'];
export const INITIAL_BALANCE=1000;
export const CHIPS=[10,25,50,100,500];
export const totalBet=bets=>SPOTS.reduce((n,spot)=>n+(bets[spot]||0),0);
export const canDeal=(bets,roundState)=>roundState==='betting_open'&&totalBet(bets)>0;

export function secureIndex(length){
  if(!globalThis.crypto?.getRandomValues) throw new Error('Secure randomness unavailable');
  const limit=Math.floor(0x100000000/length)*length;
  const buffer=new Uint32Array(1);
  do{globalThis.crypto.getRandomValues(buffer)}while(buffer[0]>=limit);
  return buffer[0]%length;
}
export function drawPair(index=secureIndex){
  const deck=[];
  for(const suit of SUITS)for(let i=0;i<RANKS.length;i++)deck.push({rank:RANKS[i],suit,value:i+1});
  const dragon=deck.splice(index(deck.length),1)[0];
  const tiger=deck.splice(index(deck.length),1)[0];
  return {dragon,tiger,winner:dragon.value===tiger.value?'tie':dragon.value>tiger.value?'dragon':'tiger'};
}
export function settle(bets,winner){
  const placed=SPOTS.reduce((n,spot)=>n+(bets[spot]||0),0);
  let prize=0,refund=0;
  for(const spot of SPOTS){
    const stake=bets[spot]||0;
    if(spot===winner)prize+=stake*(spot==='tie'?12:2);
    else if(winner==='tie'&&spot!=='tie')refund+=stake/2;
  }
  const returned=prize+refund;
  return {placed,prize,refund,returned,net:returned-placed};
}
export function resultAnnouncement(winner,settlement,balance){
  const format=n=>n.toLocaleString('en-US',{maximumFractionDigits:1});
  const {prize,refund,net}=settlement;
  const outcome=winner==='tie'?'Tie.':winner==='dragon'?'Dragon wins.':'Tiger wins.';
  const prizeLine=prize>0?`Prize ${format(prize)} credits.`:'No prize this round.';
  const refundLine=refund>0?` ${format(refund)} credits returned from side bets.`:'';
  const netLine=net>0?`Net gain ${format(net)} credits.`:net<0?`Net loss ${format(-net)} credits.`:'No net change.';
  return `${outcome} ${prizeLine}${refundLine} ${netLine} Balance ${format(balance)} credits.`;
}
export function cardText(card){return card.rank+card.suit}
