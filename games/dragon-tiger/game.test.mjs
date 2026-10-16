import assert from 'node:assert/strict';
import {canDeal,drawPair,settle,totalBet} from './game.mjs';
import {ROUND_STATES} from './round-machine.mjs';

const empty={dragon:0,tie:0,tiger:0};
const dragonBet={dragon:25,tie:0,tiger:0};

assert.equal(totalBet(empty),0);
assert.equal(canDeal(empty,ROUND_STATES.BETTING_OPEN),false);
assert.equal(canDeal(dragonBet,ROUND_STATES.BETTING_OPEN),true);
for(const locked of [
  ROUND_STATES.READY,
  ROUND_STATES.BETTING_LOCKED,
  ROUND_STATES.DEAL_DRAGON,
  ROUND_STATES.DEAL_TIGER,
  ROUND_STATES.REVEAL,
  ROUND_STATES.SETTLEMENT,
  ROUND_STATES.ROUND_COMPLETE
])assert.equal(canDeal(dragonBet,locked),false);

const pair=drawPair(()=>0);
assert.notDeepEqual(pair.dragon,pair.tiger);
assert.equal(pair.winner,'tiger');
assert.deepEqual(settle(dragonBet,'dragon'),{placed:25,prize:50,refund:0,returned:50,net:25});
assert.deepEqual(settle(dragonBet,'tie'),{placed:25,prize:0,refund:12.5,returned:12.5,net:-12.5});

console.log('PASS Dragon Tiger draw, betting guard and settlement');
