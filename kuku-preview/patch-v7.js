// v7: 育成ポイント、ショップ、課題クリア連続日数
(function(){
  const ECON_VERSION=2;
  const DAILY_CLEAR_POINTS=10;
  const SHOP={
    food:{name:'ごはん',emoji:'🍙',price:10,care:'food'},
    toy:{name:'おもちゃ',emoji:'🪀',price:10,care:'play'},
    book:{name:'えほん',emoji:'📕',price:10,care:'study'}
  };
  const GROW_ST=[
    {m:0,n:'たまご'},
    {m:1,n:'あかちゃん'},
    {m:5,n:'こども'},
    {m:12,n:'せいちょう'},
    {m:25,n:'おとな'}
  ];
  let currentTaskFact=null;

  // 日本時間を含む端末のローカル日付で日替わり判定
  day=function(){
    const d=new Date();
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  };

  RO.balance={n:'バランス型',c1:'#c6ace8',c2:'#8a68b2',mark:'🌟'};

  function migrateEconomy(){
    if(S.economyVersion===ECON_VERSION) return;
    S.economyVersion=ECON_VERSION;
    S.coins=0;
    S.taskStreak=0;
    S.lastTaskClear=null;
    S.pet.xp=0;
    S.pet.branch=null;
    S.pet.care={study:0,play:0,food:0};
    S.pet.inv={food:0,toy:0,book:0,gem:0};
    S.pet.log=['新しい育成ポイント制がスタート！'];
    save();
  }

  function taskState(){
    if(!S.settings) S.settings={};
    if(![10,30,50].includes(Number(S.settings.dailyGoal))) S.settings.dailyGoal=10;
    const t=day();
    if(!S.dailyTask || S.dailyTask.date!==t){
      S.dailyTask={date:t,correct:0,attempts:0,wrong:0,cleared:false};
    }
    if(typeof S.dailyTask.correct!=='number') S.dailyTask.correct=0;
    if(typeof S.dailyTask.attempts!=='number') S.dailyTask.attempts=0;
    if(typeof S.dailyTask.wrong!=='number') S.dailyTask.wrong=0;
    if(typeof S.dailyTask.cleared!=='boolean') S.dailyTask.cleared=false;
    return S.dailyTask;
  }
  function goal(){return Number(S.settings.dailyGoal)||10;}

  // 成長は「アイテムをあげた回数」だけで進む
  stage=function(){
    let s=GROW_ST[0];
    for(const x of GROW_ST) if(S.pet.xp>=x.m) s=x;
    return s;
  };
  nextstage=function(){
    const s=stage(),i=GROW_ST.indexOf(s);
    return GROW_ST[Math.min(i+1,GROW_ST.length-1)];
  };
  branch=function(){
    if(S.pet.branch) return S.pet.branch;
    if(S.pet.xp<5) return null;
    const c=S.pet.care;
    const vals={study:c.study||0,play:c.play||0,food:c.food||0};
    const mx=Math.max(vals.study,vals.play,vals.food);
    const tops=Object.keys(vals).filter(k=>vals[k]===mx);
    const k=tops.length>=2?'balance':tops[0];
    S.pet.branch=k;
    S.pet.log.unshift(`${RO[k].n}に進化！`);
    save();
    return k;
  };

  // チャレンジはSRSを動かさない。通常学習/課題だけ復習予定を更新。
  rec=function(f,ok,ms,mode='study'){
    if(mode==='challenge'){
      f.ca=(f.ca||0)+1;
      if(ok) f.cok=(f.cok||0)+1;
      f.cms=f.cms?Math.round(f.cms*.7+ms*.3):Math.round(ms);
      save();
      return;
    }
    f.at=(f.at||0)+1;
    f.ms=f.ms?Math.round(f.ms*.7+ms*.3):Math.round(ms);
    if(ok){
      f.ok=(f.ok||0)+1;
      f.l=f.l<0?0:Math.min(f.l+(ms<6000?1:0),INT.length-1);
      let iv=INT[Math.max(0,f.l)];
      if(ms<2500&&f.l>=2)iv*=1.2;
      if(ms>6000)iv*=.7;
      f.d=Date.now()+iv;
    }else{
      f.w=(f.w||0)+1;
      f.l=f.l<0?0:Math.max(0,f.l-2);
      f.d=Date.now()+300000;
    }
    save();
  };

  function setupUi(){
    migrateEconomy();

    // ヘッダー通貨
    const pill=document.querySelector('header .pill');
    if(pill && !pill.dataset.pointsV7){
      pill.dataset.pointsV7='1';
      pill.innerHTML='⭐ <b id="coins">0</b>P';
    }

    // 連続日数カード
    const streak=$('streak');
    if(streak){
      const card=streak.closest('.card');
      const label=card&&card.querySelector('.label');
      const tiny=card&&card.querySelector('.tiny');
      if(label) label.textContent='連続クリア';
      if(tiny) tiny.textContent='今日の課題を達成した日';
    }

    // ごほうび説明
    const home=$('home');
    if(home){
      [...home.querySelectorAll('.card')].forEach(c=>{
        if(c.textContent.includes('今日の課題を全部クリア')) c.textContent=`🎁 今日の課題クリアで +${DAILY_CLEAR_POINTS}P`;
      });
    }

    // 育成画面のルート説明
    const route=document.querySelector('#petroom .route');
    if(route){
      const b=route.querySelector('b');
      const tiny=route.querySelector('.tiny');
      if(b) b.textContent='あげたアイテムで育ち方が変わる';
      if(tiny) tiny.textContent='えほん・おもちゃ・ごはん。どれを多くあげたかで進化が分岐します。';
      const evo=route.querySelector('.evolist');
      if(evo) evo.innerHTML='<div class="evo">📘<br><b>学習型</b></div><div class="evo">⚡<br><b>元気型</b></div><div class="evo">🌱<br><b>のんびり型</b></div><div class="evo">🌟<br><b>バランス型</b></div>';
    }

    const inv=$('inventory');
    if(inv && !$('shop')){
      const oldTitle=inv.previousElementSibling;
      if(oldTitle && oldTitle.classList.contains('section')) oldTitle.textContent='ショップ';
      const rule=document.createElement('div');
      rule.id='pointRule';
      rule.className='card';
      rule.style.marginBottom='10px';
      rule.innerHTML=`<b>⭐ 育成ポイント</b><div class="tiny">今日の課題クリア：+${DAILY_CLEAR_POINTS}P ／ チャレンジ：1正解=1P</div><div class="tiny">新しい段の学習や、課題1問ごとの正解ではポイントは増えません。</div>`;
      if(oldTitle) oldTitle.before(rule);
      const shop=document.createElement('div');
      shop.id='shop'; shop.className='inventory';
      inv.before(shop);
      const owned=document.createElement('div');
      owned.id='ownedTitle'; owned.className='section'; owned.textContent='もちもの';
      inv.before(owned);
    }
  }

  window.buyItem=function(k){
    const it=SHOP[k];
    if(!it) return;
    if(S.coins<it.price){
      modal('⭐','ポイントが足りません',`${it.name}は${it.price}Pです。`);
      return;
    }
    S.coins-=it.price;
    S.pet.inv[k]=(S.pet.inv[k]||0)+1;
    S.pet.log.unshift(`${it.name}を${it.price}Pで購入`);
    save();
    petroom(); home();
  };

  useItem=function(k){
    const it=SHOP[k];
    if(!it || !S.pet.inv[k]) return;
    const old=branch();
    S.pet.inv[k]--;
    S.pet.xp=(S.pet.xp||0)+1;
    S.pet.care[it.care]=(S.pet.care[it.care]||0)+1;
    const nb=branch();
    S.pet.log.unshift(`${it.name}をあげた`);
    save();
    petroom(); home();
    if(!old&&nb) modal('✨','進化した！',`${RO[nb].n}になったよ！`);
  };

  const v6Home=home;
  home=function(){
    setupUi();
    v6Home();
    const t=taskState();
    if($('streak')) $('streak').textContent=S.taskStreak||0;
    if($('coins')) $('coins').textContent=S.coins||0;
    const st=stage(),ns=nextstage();
    const xp=$('xptext');
    if(xp) xp.textContent=ns===st?`おせわ ${S.pet.xp}回`:`次の成長まで ${Math.max(0,ns.m-S.pet.xp)}回おせわ`;
    const msg=$('petmsg');
    if(msg) msg.textContent=`${SPECIES[S.settings.species].n}を育てています`;
    if(t.cleared && $('nextdue')) $('nextdue').textContent='今日の課題クリア！';
  };

  petroom=function(){
    setupUi();
    const st=stage(),ns=nextstage();
    $('petvis2').innerHTML=petSvg();
    $('petname2').textContent=petName();
    $('stage2').textContent=`${SPECIES[S.settings.species].n}・${st.n}`;
    const from=st.m,to=ns===st?st.m+1:ns.m;
    const p=ns===st?100:(S.pet.xp-from)/(to-from)*100;
    $('xpbar2').style.width=Math.max(0,Math.min(100,p))+'%';
    $('xptext2').textContent=ns===st?`おせわ ${S.pet.xp}回`:`次の成長まで ${Math.max(0,to-S.pet.xp)}回おせわ`;

    const mx=Math.max(1,S.pet.care.study||0,S.pet.care.play||0,S.pet.care.food||0);
    for(const k of ['study','play','food']){
      $(k+'bar').style.width=(S.pet.care[k]||0)/mx*100+'%';
      $(k+'v').textContent=S.pet.care[k]||0;
    }

    const shop=$('shop');
    if(shop){
      shop.innerHTML='';
      for(const [k,it] of Object.entries(SHOP)){
        const b=document.createElement('button');
        b.className='item';
        b.innerHTML=`<div class="e">${it.emoji}</div><b>${it.name}</b><div class="tiny">${it.price}Pで購入</div>`;
        b.onclick=()=>buyItem(k);
        shop.appendChild(b);
      }
    }

    $('inventory').innerHTML='';
    for(const [k,it] of Object.entries(SHOP)){
      const n=S.pet.inv[k]||0;
      const b=document.createElement('button');
      b.className='item';
      b.disabled=n<=0;
      b.innerHTML=`<div class="e">${it.emoji}</div><b>${it.name}</b><div class="tiny">×${n}　あげる</div>`;
      b.onclick=()=>useItem(k);
      $('inventory').appendChild(b);
    }

    $('log').innerHTML='';
    S.pet.log.slice(0,8).forEach(x=>{
      const r=document.createElement('div'); r.className='row'; r.textContent=x; $('log').appendChild(r);
    });
    if($('coins')) $('coins').textContent=S.coins||0;
  };

  // 新しい段をおぼえる：学習記録だけ。ポイントも育成も増えない。
  submitLearn=function(){
    if($('learna').value==='') return;
    const f=S.f[`${ld}x${lb}`],ans=ld*lb,ok=+$('learna').value===ans;
    rec(f,ok,performance.now()-ls,'learn');
    $('learnfb').className='feedback '+(ok?'ok':'ng');
    $('learnfb').textContent=ok?'正解！ 次は '+fmt(f.d):'答えは '+ans+'。5分後にもう一度';
    setTimeout(()=>{
      lb++;
      if(lb>9){lb=1;modal('🎉',ld+'の段クリア！','学習できました。今日の課題のポイントには加算されません。');home()}
      else nextLearn();
    },500);
  };

  function taskPool(){
    return Object.values(S.f).filter(f=>f.l>=0);
  }
  function pickTaskFact(){
    const pool=taskPool();
    if(!pool.length) return null;
    const now=Date.now(),weighted=[];
    for(const f of pool){
      let n=1;
      if(f.d&&f.d<=now)n+=4;
      if(f.at&&f.ok/f.at<.75)n+=3;
      if((f.ms||0)>5000)n+=1;
      for(let i=0;i<n;i++) weighted.push(f);
    }
    return weighted[Math.floor(Math.random()*weighted.length)]||pool[0];
  }

  openReview=function(){
    const t=taskState(),g=goal();
    if(t.correct>=g){
      if(!t.cleared) finishReview();
      else {modal('🎉','今日の課題はクリア済み！',`${t.correct}／${g} 正解できています。`);show('home');}
      return;
    }
    if(!taskPool().length){
      modal('📘','まず1つの段をおぼえよう','「新しい段をおぼえる」で学習した九九が、今日の課題に出題されます。');
      show('learn'); return;
    }
    show('review'); nextReview();
  };

  nextReview=function(){
    const t=taskState(),g=goal();
    if(t.correct>=g){finishReview();return;}
    currentTaskFact=pickTaskFact();
    if(!currentTaskFact){show('home');return;}
    $('reviewprog').textContent=`${t.correct}／${g} 正解`;
    $('reviewlevel').textContent='正解した問題だけ今日の課題にカウント';
    $('reviewq').textContent=`${currentTaskFact.a} × ${currentTaskFact.b}`;
    $('reviewa').value=''; $('reviewfb').textContent='';
    $('reviewsched').textContent=`あと ${g-t.correct} 問正解でクリア`;
    rs=performance.now();
    setTimeout(()=>$('reviewa').focus(),80);
  };

  submitReview=function(){
    if($('reviewa').value===''||!currentTaskFact)return;
    const t=taskState(),g=goal(),ans=currentTaskFact.a*currentTaskFact.b;
    const ok=+$('reviewa').value===ans;
    t.attempts++;
    rec(currentTaskFact,ok,performance.now()-rs,'review');
    if(ok){
      t.correct++;
      $('reviewfb').className='feedback ok';
      $('reviewfb').textContent='○ 正解！ 1問カウント';
      $('reviewsched').textContent=`${Math.min(t.correct,g)}／${g} 正解`;
    }else{
      t.wrong++;
      $('reviewfb').className='feedback ng';
      $('reviewfb').innerHTML=`✕ ちがうよ<div class="wrong-answer">正解は ${ans}</div>`;
      $('reviewsched').textContent='不正解はカウントされません';
    }
    S.dailyTask=t; save();
    setTimeout(nextReview,ok?430:1050);
  };

  function updateTaskStreak(){
    const today=day();
    if(S.lastTaskClear===today) return;
    let next=1;
    if(S.lastTaskClear){
      const a=new Date(S.lastTaskClear+'T00:00:00'),b=new Date(today+'T00:00:00');
      const diff=Math.round((b-a)/86400000);
      if(diff===1) next=(S.taskStreak||0)+1;
    }
    S.taskStreak=next;
    S.lastTaskClear=today;
  }

  finishReview=function(){
    const t=taskState(),g=goal();
    if(t.correct<g){nextReview();return;}
    if(!t.cleared){
      t.cleared=true;
      S.coins=(S.coins||0)+DAILY_CLEAR_POINTS;
      updateTaskStreak();
      S.pet.log.unshift(`今日の課題クリア！ +${DAILY_CLEAR_POINTS}P`);
      S.dailyTask=t;
      save();
      modal('⭐','今日の課題クリア！',`${g}問正解！ +${DAILY_CLEAR_POINTS}P ゲット！`);
    }else{
      modal('🎉','今日の課題はクリア済み！',`${t.correct}／${g} 正解できています。`);
    }
    show('home');
  };

  // チャレンジ：正解数 = 獲得ポイント。直接育成はしない。
  submitChallenge=function(){
    if(challengeLocked||$('challengea').value===''||!cf)return;
    challengeLocked=true;
    const ok=+$('challengea').value===cf.a*cf.b,ms=performance.now()-cs;
    rec(cf,ok,ms,'challenge');
    if(ok){
      sc++;co++;
      $('challengefb').className='feedback ok';
      $('challengefb').textContent='○ 正解！ +1P予定';
    }else{
      co=0;
      $('challengefb').className='feedback ng';
      $('challengefb').innerHTML=`✕ ちがうよ<div class="wrong-answer">正解は ${cf.a*cf.b}</div>`;
    }
    $('score').textContent=sc;$('combo').textContent=co;
    save();
    setTimeout(nextChallenge,ok?320:1050);
  };

  finishChallenge=function(){
    if(!ct)return;
    clearInterval(ct);ct=null;challengeLocked=true;
    S.coins=(S.coins||0)+sc;
    if(sc>0) S.pet.log.unshift(`チャレンジ ${sc}問正解で +${sc}P`);
    save();
    modal('⭐',`${S.settings.challengeMin}分チャレンジ終了！`,`${sc}問正解！ +${sc}P ゲット！`);
    show('home');
  };

  // 設定変更後の表示
  const v6Settings=settings;
  settings=function(){
    setupUi(); v6Settings();
  };

  // デモ/初期化も新ポイント制に合わせる
  demo=function(){
    const keepSettings={...(S.settings||{})};
    S=D(); S.settings={...S.settings,...keepSettings};
    S.economyVersion=ECON_VERSION; S.coins=42; S.taskStreak=5; S.lastTaskClear=day();
    S.pet.xp=8; S.pet.care={study:4,play:2,food:2}; S.pet.inv={food:2,toy:1,book:2,gem:0}; S.pet.branch='study';
    const n=Date.now();
    for(let a=1;a<=9;a++)for(let b=1;b<=9;b++){
      const f=S.f[`${a}x${b}`];
      if((a+b)%3){f.at=6;f.ok=5;f.l=(a*b)%4;f.ms=2200+(a*b*151)%2500;f.d=n+(((a+b)%4)-2)*86400000;f.ca=3+((a*b)%6);f.cok=Math.max(1,Math.round(f.ca*((a*b)%5===0?.5:.85)));f.cms=1800+(a*b*143)%2500}
    }
    S.dailyTask={date:day(),correct:4,attempts:5,wrong:1,cleared:false};
    S.pet.log.unshift('新ポイント制のデモデータ');
    save();home();petroom();modal('🧪','デモデータON','育成ポイント・ショップ・今日の課題を確認できます。');
  };
  resetAll=function(){
    S=D();
    S.economyVersion=ECON_VERSION; S.coins=0; S.taskStreak=0; S.lastTaskClear=null;
    S.pet.xp=0; S.pet.branch=null; S.pet.care={study:0,play:0,food:0}; S.pet.inv={food:0,toy:0,book:0,gem:0};
    save();location.reload();
  };

  // 既存のEnterキーイベントより先に新処理を実行
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    if(e.target&&e.target.id==='learna'){e.preventDefault();e.stopImmediatePropagation();submitLearn();}
    else if(e.target&&e.target.id==='reviewa'){e.preventDefault();e.stopImmediatePropagation();submitReview();}
    else if(e.target&&e.target.id==='challengea'){e.preventDefault();e.stopImmediatePropagation();submitChallenge();}
  },true);

  setupUi();
  home();
  petroom();
  settings();
})();