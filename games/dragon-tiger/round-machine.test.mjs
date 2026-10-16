import assert from 'node:assert/strict';
import {createRoundMachine,ROUND_STATES,isRoundActive} from './round-machine.mjs';
import {canDeal} from './game.mjs';

const machine=createRoundMachine();
assert.equal(machine.state,ROUND_STATES.READY);
assert.equal(canDeal({dragon:25,tie:0,tiger:0},machine.state),false);

for(const [event,state] of [
  ['OPEN_BETS',ROUND_STATES.BETTING_OPEN],
  ['LOCK_BETS',ROUND_STATES.BETTING_LOCKED],
  ['START_DRAGON',ROUND_STATES.DEAL_DRAGON],
  ['DRAGON_REVEALED',ROUND_STATES.DEAL_TIGER],
  ['TIGER_REVEALED',ROUND_STATES.REVEAL],
  ['SETTLE',ROUND_STATES.SETTLEMENT],
  ['COMPLETE',ROUND_STATES.ROUND_COMPLETE]
]){
  machine.transition(event);
  assert.equal(machine.state,state);
}

assert.equal(isRoundActive(ROUND_STATES.DEAL_TIGER),true);
assert.equal(isRoundActive(ROUND_STATES.ROUND_COMPLETE),false);
assert.equal(canDeal({dragon:25,tie:0,tiger:0},ROUND_STATES.ROUND_COMPLETE),false);
assert.throws(()=>machine.transition('COMPLETE'),/Invalid round transition/);
machine.transition('OPEN_BETS');
assert.equal(canDeal({dragon:25,tie:0,tiger:0},machine.state),true);

console.log('PASS guarded Dragon Tiger round state machine');
