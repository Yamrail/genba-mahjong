/* Deterministic four-player round transitions; browser/Node, no runtime dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.YRRound=factory(root.YRCore);})(typeof globalThis==='object'?globalThis:this,function(C){
  'use strict';
  function player(seat,score){return {seat,score,hand:[],openMelds:[],river:[],riichi:false,doubleRiichi:false,ippatsu:false,temporaryFuriten:false,riichiFuriten:false,riverHistoryUnknown:false,drawCount:0};}
  const seatWind=(g,s)=>(s-g.dealer+4)%4;
  function base(mode,seed,scores,pool,honba,roundWind,roundNumber,dealer){return {mode,seed:Number(seed)>>>0,players:scores.map((n,i)=>player(i,n)),initialScores:scores.slice(),pool,initialPool:pool,honba,roundWind,roundNumber,dealer,turn:1,phase:'DRAW',terminal:false,result:null,liveWall:[],deadWall:[],omittedHistory:[],riichiSeat:null,activeSeat:dealer,pendingRon:null,humanTsumo:null,events:[],eventSequence:0,profile:C.PROFILE.id,scopeHolds:[],lastDrawSeat:null,firstTurnUnbroken:true};}
  function context(g,s,winType){const p=g.players[s];return {seat:seatWind(g,s),roundWind:g.roundWind,honba:g.honba,doraIndicators:[g.doraIndicator],uraIndicators:[g.deadWall[1].type],riichi:p.riichi,doubleRiichi:p.doubleRiichi,ippatsu:p.ippatsu,haitei:winType==='tsumo'&&g.liveWall.length===0,houtei:winType==='ron'&&g.liveWall.length===0,tenhou:g.mode==='normal'&&winType==='tsumo'&&seatWind(g,s)===0&&p.drawCount===1&&p.river.length===0&&g.firstTurnUnbroken,chiihou:g.mode==='normal'&&winType==='tsumo'&&seatWind(g,s)!==0&&p.drawCount===1&&g.firstTurnUnbroken,renhou:g.mode==='normal'&&winType==='ron'&&seatWind(g,s)!==0&&p.drawCount===0&&g.firstTurnUnbroken};}
  function log(g,type,details={}){g.events.push({seq:++g.eventSequence,type,...details});}
  function initialSnapshot(g){return JSON.stringify({profile:g.profile,mode:g.mode,seed:g.seed,dealer:g.dealer,roundWind:g.roundWind,roundNumber:g.roundNumber,honba:g.honba,scores:g.initialScores,pool:g.pool,players:g.players.map(p=>({seat:p.seat,hand:p.hand.map(t=>t.id),river:p.river.map(t=>t.id),melds:p.openMelds.map(m=>m.tiles.map(t=>t.id)),riichi:p.riichi,historyUnknown:p.riverHistoryUnknown})),liveWall:g.liveWall.map(t=>t.id),deadWall:g.deadWall.map(t=>t.id),omittedHistory:g.omittedHistory.map(t=>t.id)});}
  function normal(seed,{scores=[25000,25000,25000,25000],pool=0,honba=0,roundWind=0,roundNumber=1,dealer=0}={}){
    const g=base('normal',seed,scores,pool,honba,roundWind,roundNumber,dealer),wall=C.wall(seed);g.initialWallIds=wall.map(t=>t.id);g.deadWall=wall.splice(-14);g.liveWall=wall;g.doraIndicator=g.deadWall[0].type;g.doraType=C.TYPES[C.doraIndex(g.doraIndicator)];
    for(let n=0;n<13;n++)for(let off=0;off<4;off++)g.players[(dealer+off)%4].hand.push(g.liveWall.shift());
    draw(g,dealer);g.provenance='LOCAL_SEEDED_PHYSICAL_136';g.initialStateJSON=initialSnapshot(g);return g;
  }
  function tutorial(){
    const g=base('tutorial',20260731,[25000,25000,24000,25000],1000,0,0,1,0),pool=C.physicalSet();
    function take(type,red=false){const i=pool.findIndex(t=>t.type===type&&t.red===red);if(i<0)throw Error('FIXTURE_COPY_EXHAUSTED:'+type);return pool.splice(i,1)[0];}
    const list=s=>s.split(' ').map(t=>take(t));
    g.players[0].hand=list('m5 m6 m7 p1 p2 p3 s6 s7 s8 west west m1 m2 s5');g.players[0].hand.at(-1).drawn=true;
    g.players[1].hand=list('m3 p4 s7 north');g.players[1].openMelds=[{kind:'triplet',index:28,open:true,tiles:list('south south south')},{kind:'sequence',index:18,open:true,tiles:list('s1 s2 s3')},{kind:'sequence',index:21,open:true,tiles:[take('s4'),take('s5',true),take('s6')]}];
    g.players[2].hand=list('m2 m3 m4 m5 m6 m7 p4 p5 p6 p7 p8 p9 east');g.players[3].hand=list('m8 m8 m9 p1 p1 p2 p2 s1 s2 s3 north north red');g.players[2].river=list('m1 white');g.players[3].river=list('m1');g.players[1].river=list('m1');
    g.players[2].riichi=true;g.riichiSeat=2;
    // Exact observed tiles remain unchanged. The missing 36 identities form a synthetic
    // hidden capacity reservoir, never a public river or evidence for safety/furiten.
    g.deadWall=[take('s9')];g.liveWall=[take('m9')];
    while(g.liveWall.length<29)g.liveWall.push(pool.shift());while(g.deadWall.length<14)g.deadWall.push(pool.pop());g.omittedHistory=pool.splice(0);
    for(const p of g.players)p.riverHistoryUnknown=true;
    g.scopeHolds=['TUTORIAL_OMITTED_HISTORY_36_UNKNOWN_RON_DISABLED','TUTORIAL_PAST_EVENT_ORDER_UNKNOWN'];g.doraIndicator='s9';g.doraType='s1';g.turn=11;g.phase='JUDGMENT';g.lastDrawSeat=0;g.activeSeat=0;g.provenance='LEGACY_OBSERVED_PLUS_DOCUMENTED_SYNTHETIC_INVENTORY_COMPLETION';g.initialWallIds=[...g.liveWall,...g.deadWall,...g.omittedHistory,...g.players.flatMap(p=>[...p.hand,...p.river,...p.openMelds.flatMap(m=>m.tiles)])].map(t=>t.id);g.initialStateJSON=initialSnapshot(g);g.humanTsumo=tsumo(g,0);log(g,'TUTORIAL_START',{holds:g.scopeHolds});assert(g);return g;
  }
  function assert(g){const v=C.conservation(g);if(!v.pass)throw Error('IMPOSSIBLE_STATE:'+v.errors.join(','));const total=g.players.reduce((n,p)=>n+p.score,0)+g.pool,initial=g.initialScores.reduce((a,b)=>a+b,0)+g.initialPool;if(total!==initial)throw Error('SCORE_CONSERVATION');return v;}
  function draw(g,s){if(g.terminal||g.pendingRon||g.liveWall.length===0||g.lastDrawSeat!==null||g.activeSeat!==s)return null;assert(g);const p=g.players[s];if(p.hand.length!==13-3*p.openMelds.length)return null;if(g.lastDiscard&&((g.lastDiscard.seat+1)%4)!==s)return null;p.temporaryFuriten=false;p.hand.forEach(t=>t.drawn=false);const t=g.liveWall.shift();t.drawn=true;p.hand.push(t);p.drawCount++;g.lastDrawSeat=s;g.activeSeat=s;g.lastDiscard=null;g.phase=s===0?'JUDGMENT':'OPPONENT_ACTIONS';log(g,'DRAW',{seat:s,id:t.id,remaining:g.liveWall.length});if(s===0)g.humanTsumo=tsumo(g,0);assert(g);return t;}
  function tsumo(g,s){if(g.terminal||g.lastDrawSeat!==s)return null;const p=g.players[s];if(p.hand.length!==14-3*p.openMelds.length)return null;return C.evaluate({...context(g,s,'tsumo'),preWinTiles:p.hand.slice(0,-1),winTile:p.hand.at(-1),winType:'tsumo',openMelds:p.openMelds});}
  function ron(g,s,discarded){const p=g.players[s];if(C.furiten(p).blocked)return null;return C.evaluate({...context(g,s,'ron'),preWinTiles:p.hand,winTile:discarded,winType:'ron',openMelds:p.openMelds});}
  function canRiichi(g,s,tile){if(g.terminal||g.pendingRon||g.activeSeat!==s||g.lastDrawSeat!==s||!tile)return false;const p=g.players[s];return !p.riichi&&!p.openMelds.some(m=>m.open!==false)&&g.liveWall.length>=C.PROFILE.riichiMinWall&&p.hand.some(t=>t.id===tile.id)&&C.waits(p.hand.filter(t=>t.id!==tile.id),p.openMelds).length>0;}
  function discard(g,s,id,{riichi=false}={}){
    if(g.terminal||g.pendingRon||g.activeSeat!==s||g.lastDrawSeat!==s)return {ok:false,reason:'NOT_DISCARD_TURN'};const p=g.players[s],i=p.hand.findIndex(t=>t.id===id);if(i<0||p.hand.length!==14-3*p.openMelds.length)return {ok:false,reason:'NO_TILE'};
    if(p.riichi&&!p.hand[i].drawn)return {ok:false,reason:'RIICHI_TSUMOGIRI_REQUIRED'};if(riichi&&!canRiichi(g,s,p.hand[i]))return {ok:false,reason:'ILLEGAL_RIICHI'};
    const declaration=riichi,wasRiichi=p.riichi;if(wasRiichi)p.ippatsu=false;
    assert(g);const [t]=p.hand.splice(i,1);t.drawn=false;t.riichiDeclaration=declaration;p.river.push(t);g.lastDrawSeat=null;g.humanTsumo=null;g.lastDiscard={seat:s,id:t.id};g.phase='OPPONENT_ACTIONS';g.activeSeat=(s+1)%4;
    // Riichi deposit/yaku is only established after the declaration discard survives ron.
    const candidates=[];for(let off=1;off<4;off++){const target=(s+off)%4,e=ron(g,target,t);if(e)candidates.push({seat:target,evaluation:e});}
    const first=candidates[0];log(g,'DISCARD',{seat:s,id:t.id,riichi:declaration});
    if(first){if(first.seat===0){g.pendingRon={discarder:s,tile:t,candidates,declaration};g.phase='RON_CHOICE';return {ok:true,ronChoice:true};}finishWin(g,first.evaluation,first.seat,s);return {ok:true,terminal:true};}
    for(let target=0;target<4;target++)if(target!==s)C.passRon(g.players[target],t);
    if(declaration){p.riichi=true;p.doubleRiichi=g.mode==='normal'&&p.river.length===1&&g.firstTurnUnbroken;p.ippatsu=true;p.score-=1000;g.pool+=1000;g.riichiSeat=s;log(g,'RIICHI_ESTABLISHED',{seat:s,double:p.doubleRiichi});}
    assert(g);return {ok:true,next:(s+1)%4};
  }
  function claimRon(g){if(g.terminal||!g.pendingRon)return false;const pending=g.pendingRon,first=pending.candidates[0];if(first.seat!==0)return false;const e=ron(g,0,pending.tile);if(!e)return false;g.pendingRon=null;finishWin(g,e,0,pending.discarder);return true;}
  function pass(g){if(g.terminal||!g.pendingRon)return null;const p=g.pendingRon;C.passRon(g.players[0],p.tile);log(g,'PASS_RON',{seat:0,id:p.tile.id,riichiFuriten:g.players[0].riichiFuriten});g.pendingRon=null;
    const nextClaim=p.candidates.find(c=>c.seat!==0);if(nextClaim){finishWin(g,nextClaim.evaluation,nextClaim.seat,p.discarder);return {terminal:true};}
    for(let target=1;target<4;target++)if(target!==p.discarder)C.passRon(g.players[target],p.tile);
    if(p.declaration){const declarer=g.players[p.discarder];declarer.riichi=true;declarer.doubleRiichi=g.mode==='normal'&&declarer.river.length===1&&g.firstTurnUnbroken;declarer.ippatsu=true;declarer.score-=1000;g.pool+=1000;g.riichiSeat=p.discarder;log(g,'RIICHI_ESTABLISHED',{seat:p.discarder,double:declarer.doubleRiichi});}
    g.phase='OPPONENT_ACTIONS';assert(g);return {next:(p.discarder+1)%4};
  }
  function finishWin(g,e,winner,loser){
    if(g.terminal||!e)return false;if(e.winType==='tsumo'&&g.lastDrawSeat!==winner)return false;
    const fresh=e.winType==='tsumo'?tsumo(g,winner):g.lastDiscard&&g.lastDiscard.seat===loser?ron(g,winner,e.winTile):null;
    if(!fresh||fresh.winTile.id!==e.winTile.id)return false;e=fresh;
    const before=g.players.map(p=>p.score),poolBefore=g.pool,delta=[0,0,0,0];let payment;
    if(e.winType==='ron'){if(loser===winner||loser===null||!g.lastDiscard||g.lastDiscard.seat!==loser||g.lastDiscard.id!==e.winTile.id)return false;delta[loser]-=e.points.ron;delta[winner]+=e.points.ron;payment='ロン '+e.points.ron+'点';}
    else if(winner===g.dealer){for(let s=0;s<4;s++)if(s!==winner){delta[s]-=e.points.tsumoEach;delta[winner]+=e.points.tsumoEach;}payment='ツモ 各'+e.points.tsumoEach+'点';}
    else{for(let s=0;s<4;s++)if(s!==winner){const n=s===g.dealer?e.points.tsumoDealer:e.points.tsumoChild;delta[s]-=n;delta[winner]+=n;}payment='ツモ 親'+e.points.tsumoDealer+' / 子'+e.points.tsumoChild+'点';}
    delta[winner]+=poolBefore;g.pool=0;g.players.forEach((p,s)=>p.score+=delta[s]);const after=g.players.map(p=>p.score),ledgerPass=delta.reduce((a,b)=>a+b,0)-poolBefore===0;
    g.result={type:e.winType==='tsumo'?'ツモ和了':loser===0?'放銃':'ロン和了',winner,loser:e.winType==='ron'?loser:null,tile:e.winTile,yaku:e.yaku,han:e.han,fu:e.fu,limit:e.points.limit,honba:g.honba,poolBefore,payment:payment+' / 供託'+poolBefore,before,delta,after,ledgerPass,provenance:g.provenance+' / '+C.PROFILE.id};g.terminal=true;g.phase='RESULT';g.pendingRon=null;g.humanTsumo=null;log(g,'WIN',{winner,loser,han:e.han,fu:e.fu,delta,poolBefore});assert(g);return true;
  }
  function exhaustive(g){if(g.terminal||g.liveWall.length||g.pendingRon||g.lastDrawSeat!==null)return false;const before=g.players.map(p=>p.score),tenpai=g.players.map(p=>C.waits(p.hand,p.openMelds).length>0),n=tenpai.filter(Boolean).length,delta=tenpai.map(t=>n>0&&n<4?t?3000/n:-3000/(4-n):0);g.players.forEach((p,s)=>p.score+=delta[s]);g.result={type:'流局',winner:null,loser:null,tile:null,yaku:[],han:null,fu:null,limit:null,honba:g.honba,poolBefore:g.pool,payment:'形式テンパイ '+n+'家 / 供託持越し',before,delta,after:g.players.map(p=>p.score),ledgerPass:delta.reduce((a,b)=>a+b,0)===0,tenpai,provenance:g.provenance+' / EXHAUSTIVE_STRUCTURAL_TENPAI'};g.terminal=true;g.phase='RESULT';g.humanTsumo=null;log(g,'EXHAUSTIVE',{tenpai,delta});assert(g);return true;}
  function aiDiscard(g,s){const p=g.players[s];if(p.riichi)return p.hand.at(-1).id;
    // Local hand-only policy. It never reads other concealed hands or future wall tiles.
    let best=Infinity,choices=[];for(const t of p.hand){const v=C.efficiency(p.hand.filter(x=>x.id!==t.id),p.openMelds).physicalShanten??8;if(v<best){best=v;choices=[t.id];}else if(v===best)choices.push(t.id);}const rng=C.seeded(g.seed+g.eventSequence*2654435761+s);return choices[Math.floor(rng()*choices.length)];}
  function next(g,seed){if(!g.terminal)return null;const r=g.result,repeat=r.type==='流局'?r.tenpai[g.dealer]:r.winner===g.dealer;let dealer=g.dealer,roundNumber=g.roundNumber,roundWind=g.roundWind;if(!repeat){dealer=(dealer+1)%4;roundNumber++;if(roundNumber>4){roundNumber=1;roundWind=(roundWind+1)%4;}}return normal(seed,{scores:g.players.map(p=>p.score),pool:g.pool,honba:r.type==='流局'||repeat?g.honba+1:0,roundWind,roundNumber,dealer});}
  return {normal,tutorial,context,seatWind,draw,tsumo,ron,discard,canRiichi,claimRon,pass,finishWin,exhaustive,aiDiscard,next,assert,initialSnapshot};
});
