// Deterministic local audio. Every spoken game cue is a checked-in MP3; the
// browser's variable speech-synthesis voices are not used.
const AUDIO_ROOT='assets/voice/';
const file=name=>AUDIO_ROOT+name+'.mp3';
const small=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const ranks={A:'ace','2':'two','3':'three','4':'four','5':'five','6':'six','7':'seven','8':'eight','9':'nine','10':'ten',J:'jack',Q:'queen',K:'king'};
const suits={'♠':'spades','♥':'hearts','♦':'diamonds','♣':'clubs'};

export function numberAudio(value){
  let n=Math.max(0,Math.round(Number(value)||0));
  const words=[];
  const under100=x=>{if(x<20)words.push(small[x]);else{words.push(tens[Math.floor(x/10)]);if(x%10)words.push(small[x%10])}};
  if(n>=1000){under100(Math.floor(n/1000));words.push('thousand');n%=1000}
  if(n>=100){words.push(small[Math.floor(n/100)],'hundred');n%=100}
  if(n||!words.length)under100(n);
  return words.map(file);
}

export function createVoice({onLine,onCommand}){
  const AudioCtor=globalThis.Audio;
  const Recognition=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
  let enabled=false,last='',lastPlaylist=[],listening=false,recognition=null,current=null,queue=[],serial=0;
  function caption(text){last=text;onLine(text)}
  function stop(){serial++;queue=[];if(current){current.onended=null;current.onerror=null;current.pause?.();current=null}}
  function drain(id=serial){
    if(id!==serial||!enabled||current||!queue.length||!AudioCtor)return;
    const audio=new AudioCtor(queue.shift());current=audio;audio.preload='auto';audio.volume=.9;
    const done=()=>{if(id!==serial||current!==audio)return;current=null;drain(id)};
    audio.onended=done;audio.onerror=()=>{onLine(last+' · Audio file unavailable.');done()};
    try{const playback=audio.play();if(playback?.catch)playback.catch(()=>{onLine(last+' · Tap Sound, then Repeat result.');done()})}catch{done()}
  }
  function play(files,{queue:append=false,remember=true}={}){
    const playlist=(files||[]).filter(Boolean);
    if(remember)lastPlaylist=[...playlist];
    if(!enabled||!playlist.length||!AudioCtor)return;
    if(!append)stop();
    const id=serial;queue.push(...playlist);drain(id);
  }
  function speak(text){caption(text)}
  function cueCard(side,card,text){caption(text);play([file(side),file(ranks[card.rank]),file('of'),file(suits[card.suit])])}
  function cueResult(text,{winner,prize}){
    caption(text);
    const outcome=file(winner==='tie'?'tie-game':winner+'-wins');
    play(prize>0?[outcome,file('prize'),...numberAudio(prize),file('credits')]:[outcome,file('no-prize')]);
  }
  function cue(name,text){caption(text);play([file(name)])}
  function toggle(){
    enabled=!enabled;
    if(enabled){caption('Sound on. Round results will be announced.');play([file('sound-on')],{remember:false})}
    else{stop();caption('Sound is off. Game results remain visible.')}
    return enabled;
  }
  function repeat(){
    if(!enabled){caption('Turn sound on to hear the latest result.');return}
    if(lastPlaylist.length)play(lastPlaylist,{remember:false});else caption('Play a round to hear a result.')
  }
  function listen(){
    if(!Recognition||listening)return;
    stop();recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onresult=e=>{const transcript=e.results?.[0]?.[0]?.transcript||'';recognition.stop();onLine('Heard: '+transcript);onCommand(transcript)};
    recognition.onerror=()=>onLine('Could not hear a command. Use the buttons or try again.');
    recognition.onend=()=>{listening=false;recognition=null};
    try{recognition.start();listening=true;onLine('Listening… Say a chip amount, bet Dragon, bet Tiger, bet Tie, or deal.')}catch{listening=false;recognition=null;onLine('Microphone unavailable. Use the buttons instead.')}
  }
  return {speak,caption,cueCard,cueResult,cue,toggle,repeat,listen,get enabled(){return enabled},get speechAvailable(){return Boolean(AudioCtor)},get inputAvailable(){return Boolean(Recognition)}};
}

export function parseVoiceCommand(raw){
  const s=raw.toLowerCase().trim().replace(/[.,!?]/g,'').replace(/\s+/g,' ');
  const amount=s.match(/^(?:select|choose|chip|use)(?: the)?(?: chip)? (10|25|50|100|500)(?: credits?)?$/);
  if(amount)return {type:'chip',value:Number(amount[1])};
  const bet=s.match(/^(?:bet|place(?: a)? bet on|put(?: a)? chip on) (dragon|tiger|tie)$/);
  if(bet)return {type:'bet',spot:bet[1]};
  if(/^(?:deal|deal cards|start|start round)$/.test(s))return {type:'deal'};
  if(/^(?:undo|undo bet)$/.test(s))return {type:'undo'};
  if(/^(?:clear|clear bets)$/.test(s))return {type:'clear'};
  if(/^(?:reset|reset demo|reset balance)$/.test(s))return {type:'reset'};
  if(/^(?:help|how to play)$/.test(s))return {type:'help'};
  if(/^(?:repeat|repeat that)$/.test(s))return {type:'repeat'};
  if(/^(?:voice on|sound on|unmute)$/.test(s))return {type:'voice-on'};
  if(/^(?:voice off|sound off|mute)$/.test(s))return {type:'voice-off'};
  return {type:'unknown'};
}
