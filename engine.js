/* July Rev4 repair core. No runtime imports, network, or oracle dependency. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YRCore=api;})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const TYPES=['m1','m2','m3','m4','m5','m6','m7','m8','m9','p1','p2','p3','p4','p5','p6','p7','p8','p9','s1','s2','s3','s4','s5','s6','s7','s8','s9','east','south','west','north','white','green','red'];
  const NAMES=['一萬','二萬','三萬','四萬','五萬','六萬','七萬','八萬','九萬','一筒','二筒','三筒','四筒','五筒','六筒','七筒','八筒','九筒','一索','二索','三索','四索','五索','六索','七索','八索','九索','東','南','西','北','白','發','中'];
  const GLYPHS=['🀇','🀈','🀉','🀊','🀋','🀌','🀍','🀎','🀏','🀙','🀚','🀛','🀜','🀝','🀞','🀟','🀠','🀡','🀐','🀑','🀒','🀓','🀔','🀕','🀖','🀗','🀘','🀀','🀁','🀂','🀃','🀆','🀅','🀄'];
  const PROFILE=Object.freeze({id:'YR-JUL31-REV4-RIICHI-R001',players:4,redFives:3,openTanyao:true,kiriage:false,doubleWindPairFu:4,doubleYakuman:false,kazoeLimit:'single',headBump:true,newCalls:false,riichiMinWall:1,riichiMinScore:null});
  const ORPHANS=[0,8,9,17,18,26,27,28,29,30,31,32,33];
  const terminal=i=>i>=27||i%9===0||i%9===8;
  function counts(items){const c=Array(34).fill(0),ids=new Set(),redSeen=new Set();for(const t of items){if(!t||!Number.isInteger(t.index)||t.index<0||t.index>33)throw Error('INVALID_TILE');if(t.type!==undefined&&TYPES[t.index]!==t.type)throw Error('TILE_TYPE_MISMATCH');if(t.red&&(![4,13,22].includes(t.index)||redSeen.has(t.index)))throw Error('INVALID_RED');if(t.red)redSeen.add(t.index);if(t.id!==undefined){if(!Number.isInteger(t.id)||t.id<0||t.id>135||Math.floor(t.id/4)!==t.index||ids.has(t.id))throw Error('INVALID_PHYSICAL_ID');ids.add(t.id);if(t.red!==([4,13,22].includes(t.index)&&t.id%4===0))throw Error('RED_ID_MISMATCH');}if(++c[t.index]>4)throw Error('FIFTH_COPY');}return c;}
  function validCounts(c){return Array.isArray(c)&&c.length===34&&c.every(n=>Number.isInteger(n)&&n>=0&&n<=4);}
  function seven(c){return c.filter(x=>x===2).length===7&&c.every(x=>x===0||x===2);}
  function kokushi(c){return c.reduce((a,b)=>a+b,0)===14&&ORPHANS.every(i=>c[i]>=1)&&ORPHANS.some(i=>c[i]===2);}
  function arrangements(c,meldsNeeded=4){
    if(!validCounts(c)||!Number.isInteger(meldsNeeded)||meldsNeeded<0||meldsNeeded>4||c.reduce((a,b)=>a+b,0)!==meldsNeeded*3+2)return [];
    const out=[],work=c.slice();
    function visit(ms,pair){let i=work.findIndex(n=>n>0);if(i<0){if(ms.length===meldsNeeded)out.push({pair,melds:ms.map(m=>({...m}))});return;}if(ms.length>=meldsNeeded)return;
      if(work[i]>=3){work[i]-=3;ms.push({kind:'triplet',index:i,open:false});visit(ms,pair);ms.pop();work[i]+=3;}
      if(i<27&&i%9<=6&&work[i+1]&&work[i+2]){work[i]--;work[i+1]--;work[i+2]--;ms.push({kind:'sequence',index:i,open:false});visit(ms,pair);ms.pop();work[i]++;work[i+1]++;work[i+2]++;}
    }
    for(let p=0;p<34;p++)if(work[p]>=2){work[p]-=2;visit([],p);work[p]+=2;}return out;
  }
  function structural(items,openMeldCount=0){try{const c=counts(items);if(items.length!==14-3*openMeldCount)return false;return (!openMeldCount&&(seven(c)||kokushi(c)))||arrangements(c,4-openMeldCount).length>0;}catch{return false;}}
  function analysisTile(i){return {index:i,type:TYPES[i],red:false};}
  function waits(items,melds=[]){let c;try{c=counts([...items,...melds.flatMap(m=>m.tiles||[])]);}catch{return [];}if(items.length!==13-melds.length*3)return [];
    const out=[];for(let i=0;i<34;i++)if(c[i]<4&&structural([...items,analysisTile(i)],melds.length))out.push(i);return out;
  }
  // Exhaustive branch search over all complete sets, pair choices, and incomplete sets.
  // The tile-count validation and cap on usable taatsu prevent fifth-copy and overcount claims.
  const shantenCache=new Map();
  function shanten(items,openMeldCount=0){
    let c;try{c=counts(items);}catch{return null;}if(openMeldCount<0||openMeldCount>4||![13-3*openMeldCount,14-3*openMeldCount].includes(items.length))return null;
    const key=openMeldCount+':'+c.join('');if(shantenCache.has(key))return shantenCache.get(key);
    let best=8;const work=c.slice();
    function walk(start,m,t,p){
      if(m+openMeldCount>4)return;
      let i=start;while(i<34&&!work[i])i++;
      if(i===34){best=Math.min(best,8-2*(m+openMeldCount)-Math.min(t,4-m-openMeldCount)-p);return;}
      if(work[i]>=3){work[i]-=3;walk(i,m+1,t,p);work[i]+=3;}
      if(i<27&&i%9<=6&&work[i+1]&&work[i+2]){work[i]--;work[i+1]--;work[i+2]--;walk(i,m+1,t,p);work[i]++;work[i+1]++;work[i+2]++;}
      if(work[i]>=2){work[i]-=2;if(!p)walk(i,m,t,1);walk(i,m,t+1,p);work[i]+=2;}
      if(i<27&&i%9<=7&&work[i+1]){work[i]--;work[i+1]--;walk(i,m,t+1,p);work[i]++;work[i+1]++;}
      if(i<27&&i%9<=6&&work[i+2]){work[i]--;work[i+2]--;walk(i,m,t+1,p);work[i]++;work[i+2]++;}
      work[i]--;walk(i,m,t,p);work[i]++;
    }
    walk(0,0,0,0);
    if(!openMeldCount){const pairs=c.filter(n=>n>=2).length,unique=c.filter(Boolean).length;best=Math.min(best,6-pairs+Math.max(0,7-unique),13-ORPHANS.filter(i=>c[i]).length-(ORPHANS.some(i=>c[i]>=2)?1:0));}
    if(shantenCache.size>30000)shantenCache.clear();shantenCache.set(key,best);return best;
  }
  function efficiency(items,melds=[]){
    const abstractShanten=shanten(items,melds.length),structuralWaits=waits(items,melds);
    if(abstractShanten!==0||structuralWaits.length)return {abstractShanten,physicalShanten:abstractShanten,structuralWaits,hold:null};
    // Conventional shanten may use a fifth-copy taatsu. Prove a single replacement
    // reaches a physically valid tenpai before reporting one-shanten instead of zero.
    let own;try{own=counts([...items,...melds.flatMap(m=>m.tiles)]);}catch{return {abstractShanten,physicalShanten:null,structuralWaits,hold:'INVALID_STATE'};}
    for(let i=0;i<34;i++)if(own[i]<4){const drawn=[...items,analysisTile(i)];for(let d=0;d<drawn.length;d++)if(waits(drawn.filter((_,j)=>j!==d),melds).length)return {abstractShanten,physicalShanten:1,structuralWaits,hold:'FIFTH_COPY_ABSTRACT_ZERO_CORRECTED_BY_ONE_REPLACEMENT_PROOF'};}
    return {abstractShanten,physicalShanten:null,structuralWaits,hold:'PHYSICAL_SHANTEN_UNPROVEN'};
  }
  const ceil100=x=>Math.ceil(x/100)*100;
  function basePoints({han,fu,yakumanMultiplier=0}){if(yakumanMultiplier)return 8000*yakumanMultiplier;if(han>=13)return 8000;if(han>=11)return 6000;if(han>=8)return 4000;if(han>=6)return 3000;return Math.min(2000,fu*2**(han+2));}
  function limitName(o){if(o.yakumanMultiplier>1)return o.yakumanMultiplier+'倍役満';if(o.yakumanMultiplier)return '役満';if(o.han>=13)return '数え役満';if(o.han>=11)return '三倍満';if(o.han>=8)return '倍満';if(o.han>=6)return '跳満';if(basePoints(o)>=2000)return '満貫';return '通常';}
  function points(o){if(!Number.isInteger(o.han)||o.han<1||!Number.isFinite(o.fu)||o.fu<20||!['ron','tsumo'].includes(o.winType)||!Number.isInteger(o.honba||0)||(o.honba||0)<0)throw Error('INVALID_POINTS_INPUT');const base=basePoints(o),h=o.honba||0,out={basePoints:base,limit:limitName(o)};
    if(o.winType==='ron')out.ron=ceil100(base*(o.dealer?6:4))+h*300;else if(o.dealer)out.tsumoEach=ceil100(base*2)+h*100;else{out.tsumoDealer=ceil100(base*2)+h*100;out.tsumoChild=ceil100(base)+h*100;}return out;
  }
  function doraIndex(indicator){const i=typeof indicator==='string'?TYPES.indexOf(indicator):indicator;if(i<0||i>=34)throw Error('INVALID_INDICATOR');if(i<27)return Math.floor(i/9)*9+(i%9+1)%9;if(i<31)return 27+(i-27+1)%4;return 31+(i-31+1)%3;}
  function validateMelds(ms){
    if(!Array.isArray(ms)||ms.length>4)throw Error('INVALID_MELDS');
    for(const m of ms){if(m.kind==='quad')throw Error('HOLD_QUAD_SCORING_DISABLED');if(m.open!==undefined&&typeof m.open!=='boolean')throw Error('INVALID_MELD_OPEN');if(!['sequence','triplet'].includes(m.kind)||!Array.isArray(m.tiles)||m.tiles.length!==3)throw Error('INVALID_MELD');const ids=m.tiles.map(x=>x.index).sort((a,b)=>a-b);if(ids[0]!==m.index)throw Error('MELD_INDEX');if(m.kind==='triplet'&&!ids.every(i=>i===m.index))throw Error('MELD_TRIPLET');if(m.kind==='sequence'&&(m.index>=27||m.index%9>6||ids.join()!=[m.index,m.index+1,m.index+2].join()))throw Error('MELD_SEQUENCE');}
  }
  function assignments(a,winIndex){const out=[];if(a.pair===winIndex)out.push({kind:'pair',index:a.pair,wait:'tanki',fu:2});a.melds.forEach((m,j)=>{if(m.kind==='triplet'&&m.index===winIndex)out.push({kind:'triplet',meld:j,index:m.index,wait:'shanpon',fu:0});if(m.kind==='sequence'&&winIndex>=m.index&&winIndex<=m.index+2){const off=winIndex-m.index;const wait=off===1?'kanchan':(m.index%9===0&&off===2)||(m.index%9===6&&off===0)?'penchan':'ryanmen';out.push({kind:'sequence',meld:j,index:m.index,wait,fu:wait==='ryanmen'?0:2});}});return out;}
  function evaluate(input){
    const {preWinTiles,winTile,winType,seat,roundWind=0,openMelds:rawMelds=[],honba=0,riichi=false,doubleRiichi=false,ippatsu=false,haitei=false,houtei=false,tenhou=false,chiihou=false,renhou=false}=input;
    if(!Array.isArray(preWinTiles)||!winTile||!['ron','tsumo'].includes(winType)||!Number.isInteger(seat)||seat<0||seat>3||!Number.isInteger(roundWind)||roundWind<0||roundWind>3)return null;
    // Declared melds default to open. Normalize once so hand status, triplet fu
    // and concealed-triplet yaku share the same interpretation; preserve false.
    let openMelds;try{validateMelds(rawMelds);openMelds=rawMelds.map(m=>({...m,open:m.open!==false}));}catch(e){return null;}
    const complete=[...preWinTiles,winTile],all=[...complete,...openMelds.flatMap(m=>m.tiles)];let c,ac;
    try{c=counts(complete);ac=counts(all);}catch{return null;}
    if(complete.length!==14-openMelds.length*3)return null;
    if(all.filter(t=>t.red).some(t=>all.filter(x=>x.index===t.index&&x.red).length>1))return null;
    const closed=!openMelds.some(m=>m.open!==false);
    if((riichi||doubleRiichi||ippatsu)&&!closed||ippatsu&&!riichi&&!doubleRiichi||haitei&&winType!=='tsumo'||houtei&&winType!=='ron')return null;
    const indicators=input.doraIndicators||[],allUra=input.uraIndicators||[],uraIndicators=(riichi||doubleRiichi)?allUra:[];
    if(!Array.isArray(indicators)||!Array.isArray(allUra)||indicators.length>1||allUra.length>1)return null;
    // Kan is disabled in this profile: only the initial indicator/ura pair exists.
    // Even hidden ura occupies a physical tile and cannot create a fifth copy.
    try{const inventory=ac.slice();for(const v of [...indicators,...allUra]){const i=typeof v==='string'?TYPES.indexOf(v):v;if(!Number.isInteger(i)||i<0||i>33||++inventory[i]>4)return null;}}catch{return null;}
    let dora=0,ura=0;try{for(const i of indicators)dora+=ac[doraIndex(i)];for(const i of uraIndicators)ura+=ac[doraIndex(i)];}catch{return null;}
    if(!indicators.length&&input.doraType!==undefined){const i=TYPES.indexOf(input.doraType);if(i>=0)dora=ac[i];}
    const red=all.filter(t=>t.red).length;let best=null;
    function consider(a,assigned,special){
      const y=[],yak=[];const add=(id,name,han)=>y.push({id,name,han});const ym=(id,name)=>yak.push({id,name,han:13,yakuman:1});
      if(tenhou&&closed&&seat===0&&winType==='tsumo')ym('tenhou','天和');if(chiihou&&closed&&seat!==0&&winType==='tsumo')ym('chiihou','地和');
      if(special==='kokushi')ym('kokushi','国士無双');
      if(all.every(t=>t.index>=27))ym('tsuuiisou','字一色');
      if(all.every(t=>t.index<27&&terminal(t.index)))ym('chinroutou','清老頭');
      if(all.every(t=>[19,20,21,23,25,32].includes(t.index)))ym('ryuuiisou','緑一色');
      const suits=new Set(all.filter(t=>t.index<27).map(t=>Math.floor(t.index/9))),hasHonor=all.some(t=>t.index>=27);
      if(closed&&!openMelds.length&&suits.size===1&&!hasHonor){const start=[...suits][0]*9,base=[3,1,1,1,1,1,1,1,3];if(base.every((n,j)=>c[start+j]>=n))ym('chuuren','九蓮宝燈');}
      if(doubleRiichi)add('double_riichi','ダブル立直',2);else if(riichi)add('riichi','立直',1);
      if(ippatsu)add('ippatsu','一発',1);if(closed&&winType==='tsumo')add('menzen_tsumo','門前清自摸和',1);
      if(haitei)add('haitei','海底摸月',1);if(houtei)add('houtei','河底撈魚',1);
      if(all.every(t=>!terminal(t.index)))add('tanyao','断么九',1);
      if(suits.size===1)add(hasHonor?'honitsu':'chinitsu',hasHonor?'混一色':'清一色',hasHonor?(closed?3:2):(closed?6:5));
      if(all.every(t=>terminal(t.index))&&hasHonor&&suits.size)add('honroutou','混老頭',2);
      let fu=25,fuDetails=[];
      if(special==='seven')add('chiitoitsu','七対子',2);
      if(!special){
        const ms=[...openMelds,...a.melds.map((m,j)=>({...m,ronCompleted:winType==='ron'&&assigned.kind==='triplet'&&assigned.meld===j}))],triplets=ms.filter(m=>m.kind==='triplet'),seq=ms.filter(m=>m.kind==='sequence');
        const concealedTriplets=triplets.filter(m=>!m.open&&!m.ronCompleted).length;
        const dragons=triplets.filter(m=>m.index>=31).length,winds=triplets.filter(m=>m.index>=27&&m.index<31).length;
        if(dragons===3)ym('daisangen','大三元');if(winds===4)ym('daisuushii','大四喜');else if(winds===3&&a.pair>=27&&a.pair<31)ym('shousuushii','小四喜');
        if(concealedTriplets===4&&closed)ym('suuankou','四暗刻');
        for(const m of triplets){if(m.index>=31)add('dragon_'+m.index,'役牌 '+NAMES[m.index],1);if(m.index===27+seat)add('seat_wind','自風 '+NAMES[m.index],1);if(m.index===27+roundWind)add('round_wind','場風 '+NAMES[m.index],1);}
        if(triplets.length===4)add('toitoi','対々和',2);if(concealedTriplets>=3)add('sanankou','三暗刻',2);
        if(dragons===2&&a.pair>=31)add('shousangen','小三元',2);
        const seqCounts=new Map();for(const m of seq)seqCounts.set(m.index,(seqCounts.get(m.index)||0)+1);
        if(closed){const twinPairs=[...seqCounts.values()].reduce((n,k)=>n+Math.floor(k/2),0);if(twinPairs>=2)add('ryanpeikou','二盃口',3);else if(twinPairs===1)add('iipeikou','一盃口',1);}
        for(let rank=0;rank<7;rank++)if([0,9,18].every(s=>seq.some(m=>m.index===s+rank))){add('sanshoku_doujun','三色同順',closed?2:1);break;}
        for(let rank=0;rank<9;rank++)if([0,9,18].every(s=>triplets.some(m=>m.index===s+rank))){add('sanshoku_doukou','三色同刻',2);break;}
        for(const suit of [0,9,18])if([0,3,6].every(r=>seq.some(m=>m.index===suit+r))){add('ittsuu','一気通貫',closed?2:1);break;}
        if(seq.length&&terminal(a.pair)&&ms.every(m=>m.kind==='sequence'?[0,6].includes(m.index%9):terminal(m.index)))add(hasHonor?'chanta':'junchan',hasHonor?'混全帯么九':'純全帯么九',hasHonor?(closed?2:1):(closed?3:2));
        const pairFu=(a.pair>=31?2:0)+(a.pair===27+seat?2:0)+(a.pair===27+roundWind?2:0);
        const pinfu=closed&&seq.length===4&&pairFu===0&&assigned.wait==='ryanmen';if(pinfu)add('pinfu','平和',1);
        fu=20;fuDetails=[{reason:'base',fu:20}];const f=(reason,value)=>{if(value){fu+=value;fuDetails.push({reason,fu:value});}};
        if(closed&&winType==='ron')f('closed_ron',10);if(winType==='tsumo'&&!pinfu)f('tsumo',2);f('pair',pairFu);f(assigned.wait,assigned.fu);
        for(const m of triplets)f((m.open||m.ronCompleted?'open':'concealed')+'_triplet_'+TYPES[m.index],(m.open||m.ronCompleted?2:4)*(terminal(m.index)?2:1));
        if(fu===20&&winType==='ron')f('open_pinfu_floor',10);fu=Math.ceil(fu/10)*10;
      }
      if(yak.length){y.length=0;y.push(...yak);fu=fu||20;}
      const yakuHan=y.reduce((sum,v)=>sum+v.han,0),yakumanMultiplier=yak.length;
      // Renhou is scored as a separate five-han candidate, never combined with dora.
      const candidates=[];
      if(yakuHan){const extras=[];if(!yakumanMultiplier){if(dora)extras.push({id:'dora',name:'ドラ'+dora,han:dora});if(ura)extras.push({id:'ura',name:'裏ドラ'+ura,han:ura});if(red)extras.push({id:'aka',name:'赤ドラ'+red,han:red});}candidates.push({yaku:[...y,...extras],yakuHan,han:yakuHan+(yakumanMultiplier?0:dora+ura+red),yakumanMultiplier,dora:yakumanMultiplier?0:dora,ura:yakumanMultiplier?0:ura,red:yakumanMultiplier?0:red,fu});}
      if(renhou&&closed&&seat!==0&&winType==='ron'&&!yakumanMultiplier)candidates.push({yaku:[{id:'renhou',name:'人和',han:5}],yakuHan:5,han:5,yakumanMultiplier:0,dora:0,ura:0,red:0,fu});
      for(const candidate of candidates){const p=points({...candidate,winType,dealer:seat===0,honba}),value=p.ron||p.tsumoEach*3||p.tsumoDealer+2*p.tsumoChild,e={...candidate,arrangement:a,assignment:assigned,sevenPairs:special==='seven',special: special||null,fuDetails,points:p,value,winType,winTile,ruleProfile:PROFILE.id};if(!best||value>best.value||value===best.value&&(e.han>best.han||e.han===best.han&&e.fu>best.fu))best=e;}
    }
    if(!openMelds.length&&kokushi(c))consider(null,{wait:'kokushi'},'kokushi');
    if(!openMelds.length&&seven(c))consider(null,{wait:'chiitoitsu'},'seven');
    for(const a of arrangements(c,4-openMelds.length))for(const assigned of assignments(a,winTile.index))consider(a,assigned,null);
    return best;
  }
  function furiten(player){const w=waits(player.hand,player.openMelds||[]),own=w.some(i=>(player.river||[]).some(t=>t.index===i));return {ownRiver:own,temporary:!!player.temporaryFuriten,riichi:!!player.riichiFuriten,unknownHistory:!!player.riverHistoryUnknown,blocked:own||!!player.temporaryFuriten||!!player.riichiFuriten||!!player.riverHistoryUnknown,waits:w};}
  function legalRon(player,discarded,context){if(furiten(player).blocked)return null;return evaluate({...context,preWinTiles:player.hand,winTile:discarded,winType:'ron',seat:context.seat??player.seat,openMelds:player.openMelds||[],riichi:!!player.riichi,doubleRiichi:!!player.doubleRiichi,ippatsu:!!player.ippatsu});}
  function passRon(player,discarded){if(waits(player.hand,player.openMelds||[]).includes(discarded.index)){if(player.riichi)player.riichiFuriten=true;else player.temporaryFuriten=true;return true;}return false;}
  function seeded(seed){let s=(Number(seed)>>>0)||0x6d2b79f5;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;};}
  function physicalSet(){return Array.from({length:136},(_,id)=>{const i=Math.floor(id/4),red=[4,13,22].includes(i)&&id%4===0;return {id,uid:'physical-'+id,index:i,type:TYPES[i],red,drawn:false,name:(red?'赤':'')+NAMES[i],glyph:GLYPHS[i]};});}
  function wall(seed){const a=physicalSet(),rng=seeded(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function zones(game){return [...game.liveWall,...game.deadWall,...(game.omittedHistory||[]),...game.players.flatMap(p=>[...p.hand,...p.river,...p.openMelds.flatMap(m=>m.tiles)])];}
  function conservation(game){const errors=[],all=zones(game),seen=new Set();if(all.length!==136)errors.push('PHYSICAL_COUNT_'+all.length);for(const t of all){if(!Number.isInteger(t.id)||t.id<0||t.id>135||Math.floor(t.id/4)!==t.index)errors.push('BAD_ID');if(seen.has(t.id))errors.push('DUPLICATE_ID');seen.add(t.id);const red=[4,13,22].includes(t.index)&&t.id%4===0;if(t.red!==red)errors.push('RED_REPLACEMENT');}try{const c=counts(all);if(c.some(n=>n!==4))errors.push('MULTIPLICITY');}catch(e){errors.push(e.message);}if(game.deadWall.length!==14)errors.push('DEAD_WALL');if(game.doraIndicator!==game.deadWall[0]?.type)errors.push('INDICATOR');for(const p of game.players){try{validateMelds(p.openMelds);}catch(e){errors.push(e.message);}const expected=(game.lastDrawSeat===p.seat?14:13)-3*p.openMelds.length;if(p.hand.length!==expected)errors.push('HAND_SIZE_TURN');}return {pass:errors.length===0,errors:[...new Set(errors)],physicalCount:all.length,uniqueIds:seen.size,redCount:all.filter(t=>t.red).length};}
  function publicSafety(game,tile){
    const visible=[...game.players[0].hand,...game.players.flatMap(p=>[...p.river,...p.openMelds.flatMap(m=>m.tiles)]),game.deadWall[0]],vc=Array(34).fill(0);for(const t of visible)vc[t.index]++;
    const atoms=[],opponents=game.players.slice(1).map(p=>{
      const genbutsu=p.river.some(t=>t.index===tile.index),suji=[];
      if(tile.index<27){const r=tile.index%9;const anchors=[];
        // 1/2/3 are one-sided against 4/5/6. Central 4/5/6 need BOTH anchors.
        if(r<=2)anchors.push(tile.index+3);else if(r>=6)anchors.push(tile.index-3);else anchors.push(tile.index-3,tile.index+3);
        if(anchors.every(i=>p.river.some(t=>t.index===i)))suji.push({opponent:p.seat,anchors,scope:'RYANMEN_ONLY',certain:false});
      }
      for(const s of suji)atoms.push({id:'suji:'+p.seat+':'+s.anchors.join(','),kind:'suji',opponent:p.seat,sourceTiles:s.anchors});
      return {seat:p.seat,riichi:!!p.riichi,genbutsu,ronScope:genbutsu?'OWN_RIVER_FURITEN':'UNKNOWN',suji,hiddenWait:'UNKNOWN'};
    });
    const kabe=[],oneChance=[],ryanmenPaths=[];
    if(tile.index<27){const start=Math.floor(tile.index/9)*9;for(const a of [tile.index,tile.index-2]){
      if(a<start||a>start+6||a===tile.index&&a%9===6||a===tile.index-2&&a%9===0)continue;
      const others=[a,a+1,a+2].filter(i=>i!==tile.index);ryanmenPaths.push({sequenceStart:a,required:others,blocked:others.some(i=>vc[i]===4)});
      for(const i of others){if(vc[i]===4&&!kabe.includes(i))kabe.push(i);else if(vc[i]===3&&!oneChance.includes(i))oneChance.push(i);}
    }}
    for(const i of kabe)atoms.push({id:'kabe:'+i,kind:'kabe',sourceTiles:[i],scope:'SEQUENCE_PATH_ONLY'});for(const i of oneChance)atoms.push({id:'oneChance:'+i,kind:'oneChance',sourceTiles:[i],scope:'WEAK_SEQUENCE_PATH_ONLY'});
    const allObserved=opponents.every(p=>p.genbutsu),riichiOnly=!allObserved&&opponents.some(p=>p.riichi&&p.genbutsu),suji=opponents.some(p=>p.suji.length),weakEvidence=[];
    if(riichiOnly){weakEvidence.push('riichi_opponent_only_genbutsu');atoms.push({id:'limitedGenbutsu:'+tile.index,kind:'limited_genbutsu',sourceTiles:[tile.index],scope:'NAMED_RIICHI_OPPONENTS_ONLY'});}if(suji)weakEvidence.push('suji');if(kabe.length)weakEvidence.push('kabe');if(oneChance.length)weakEvidence.push('one_chance');
    // Same source tile count cannot be counted once as kabe and again as one-chance.
    // Independent atoms must be from distinct evidence kinds AND non-overlapping source sets.
    const independent=[];for(const a of atoms)if(!independent.some(b=>a.kind===b.kind||a.sourceTiles.some(i=>b.sourceTiles.includes(i))))independent.push(a);
    const dangerousLive=!allObserved&&!riichiOnly&&!suji&&!kabe.length&&!oneChance.length&&opponents.some(p=>p.riichi);
    return {opponents,allObserved,riichiOnly,suji,kabe:kabe.length>0,kabeTiles:kabe,oneChanceTiles:oneChance,ryanmenPaths,weakEvidence,evidenceAtoms:atoms,independentAtoms:independent,safetyUnknown:!allObserved,dangerousLive,safeConfirmed:allObserved};
  }
  return {TYPES,NAMES,GLYPHS,PROFILE,ORPHANS,counts,validCounts,seven,kokushi,arrangements,structural,waits,shanten,efficiency,analysisTile,terminal,assignments,evaluate,points,basePoints,limitName,ceil100,doraIndex,furiten,legalRon,passRon,seeded,physicalSet,wall,zones,conservation,publicSafety,validateMelds};
});
