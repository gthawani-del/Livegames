export const ROUND_STATES=Object.freeze({
  READY:'ready',
  BETTING_OPEN:'betting_open',
  BETTING_LOCKED:'betting_locked',
  DEAL_DRAGON:'deal_dragon',
  DEAL_TIGER:'deal_tiger',
  REVEAL:'reveal',
  SETTLEMENT:'settlement',
  ROUND_COMPLETE:'round_complete'
});

const T=ROUND_STATES;
const transitions=Object.freeze({
  [T.READY]:{OPEN_BETS:T.BETTING_OPEN,RESET:T.BETTING_OPEN},
  [T.BETTING_OPEN]:{LOCK_BETS:T.BETTING_LOCKED,RESET:T.BETTING_OPEN},
  [T.BETTING_LOCKED]:{START_DRAGON:T.DEAL_DRAGON,RECOVER:T.BETTING_OPEN},
  [T.DEAL_DRAGON]:{DRAGON_REVEALED:T.DEAL_TIGER,RECOVER:T.BETTING_OPEN},
  [T.DEAL_TIGER]:{TIGER_REVEALED:T.REVEAL,RECOVER:T.BETTING_OPEN},
  [T.REVEAL]:{SETTLE:T.SETTLEMENT,RECOVER:T.BETTING_OPEN},
  [T.SETTLEMENT]:{COMPLETE:T.ROUND_COMPLETE,RECOVER:T.BETTING_OPEN},
  [T.ROUND_COMPLETE]:{OPEN_BETS:T.BETTING_OPEN,RESET:T.BETTING_OPEN}
});

export const isRoundActive=state=>[
  T.BETTING_LOCKED,T.DEAL_DRAGON,T.DEAL_TIGER,T.REVEAL,T.SETTLEMENT
].includes(state);

export function createRoundMachine(onTransition=()=>{}){
  let state=T.READY;
  let sequence=0;
  return {
    get state(){return state},
    can(event){return Boolean(transitions[state]?.[event])},
    transition(event,payload={}){
      const next=transitions[state]?.[event];
      if(!next)throw new Error(`Invalid round transition: ${state} -> ${event}`);
      const previous=state;
      state=next;
      const change=Object.freeze({sequence:++sequence,previous,event,state,payload});
      onTransition(change);
      return change;
    },
    snapshot(){return Object.freeze({state,sequence})}
  };
}
