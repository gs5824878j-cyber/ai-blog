// v9: 学習フロー簡略化・読み方ON/OFF・ホーム導線整理
(function(){
  const READINGS={
    1:['いんいちがいち','いんにがに','いんさんがさん','いんしがし','いんごがご','いんろくがろく','いんしちがしち','いんはちがはち','いんくがく'],
    2:['にいちがに','ににんがし','にさんがろく','にしがはち','にごじゅう','にろくじゅうに','にしちじゅうし','にはちじゅうろく','にくじゅうはち'],
    3:['さんいちがさん','さんにがろく','さざんがく','さんしじゅうに','さんごじゅうご','さぶろくじゅうはち','さんしちにじゅういち','さんぱにじゅうし','さんくにじゅうしち'],
    4:['しいちがし','しにがはち','しさんじゅうに','ししじゅうろく','しごにじゅう','しろくにじゅうし','ししちにじゅうはち','しはさんじゅうに','しくさんじゅうろく'],
    5:['ごいちがご','ごにじゅう','ごさんじゅうご','ごしにじゅう','ごごにじゅうご','ごろくさんじゅう','ごしちさんじゅうご','ごはしじゅう','ごっくしじゅうご'],
    6:['ろくいちがろく','ろくにじゅうに','ろくさんじゅうはち','ろくしにじゅうし','ろくごさんじゅう','ろくろくさんじゅうろく','ろくしちしじゅうに','ろっぱしじゅうはち','ろっくごじゅうし'],
    7:['しちいちがしち','しちにじゅうし','しちさんにじゅういち','しちしにじゅうはち','しちごさんじゅうご','しちろくしじゅうに','しちしちしじゅうく','しちはごじゅうろく','しちくろくじゅうさん'],
    8:['はちいちがはち','はちにじゅうろく','はちさんにじゅうし','はちしさんじゅうに','はちごしじゅう','はちろくしじゅうはち','はちしちごじゅうろく','はっぱろくじゅうし','はっくしちじゅうに'],
    9:['くいちがく','くにじゅうはち','くさんにじゅうしち','くしさんじゅうろく','くごしじゅうご','くろくごじゅうし','くしちろくじゅうさん','くはしちじゅうに','くくはちじゅういち']
  };

  let dan=2, phase='choose', pos=0, hiddenQueue=[], hiddenMiss=[], testQueue=[], testPos=0, testCorrect=0, locked=false;

  function ensureV9Settings(){
    if(!S.settings) S.settings={};
    if(typeof S.settings.showReadings!=='boolean') S.settings.showReadings=true;
    save();
  }

  function injectStyles(){
    if(document.getElementById('v9style')) return;
    const s=document.createElement('style');
    s.id='v9style';
    s.textContent=`
      #learn .v9-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      #learn .v9-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0 14px}
      #learn .v9-step{font-size:11px;text-align:center;padding:8px 4px;border-radius:12px;background:#f0ede7;color:#82776c;font-weight:800}
      #learn .v9-step.on{background:#ffe2a8;color:#6b4d24}
      #learn .v9-step.done{background:#dff2d6;color:#4e7442}
      #learn .v9-list{display:grid;gap:7px}
      #learn .v9-row{display:grid;grid-template-columns:105px 1fr;align-items:center;gap:8px;padding:11px 12px;border-radius:14px;background:#fff;border:1px solid #eee3d6}
      #learn .v9-row.no-reading{grid-template-columns:1fr;text-align:center}
      #learn .v9-row b{font-size:19px}
      #learn .v9-reading{font-size:14px;color:#8c623b;font-weight:700}
      #learn .v9-card{background:linear-gradient(180deg,#fffaf1,#fff);border:1px solid #eadbc6;border-radius:22px;padding:18px;text-align:center;box-shadow:0 5px 18px rgba(80,55,30,.06)}
      #learn .v9-eq{font-size:38px;font-weight:900;letter-spacing:.5px;margin:8px 0}
      #learn .v9-note{font-size:12px;color:#8b8178;line-height:1.5;margin:10px 2px}
      #learn .v9-actions{display:grid;gap:8px;margin-top:13px}
      #learn .v9-result{font-size:48px;font-weight:900;margin:8px 0}
      #learn .v9-mini{font-size:12px;color:#877a6c;margin-bottom:6px}
      #settings .v9-setting{margin-top:0}
      #home .v9-challenge-card{display:grid;gap:9px}
      #home .v9-rewards{display:grid;gap:9px}
      #home .v9-reward-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:#fffaf1}
      #home .v9-reward-row b{white-space:nowrap}
    `;
    document.head.appendChild(s);
  }

  function reading(b){ return READINGS[dan][b-1]; }
  function eq(b,show=true){ return `${dan} × ${b}${show?' = '+dan*b:''}`; }
  function shuffle(a){ return a.slice().sort(()=>Math.random()-.5); }
  function rank(p){ return {look:1,hide:2,test:3,result:4}[p]||0; }

  function stepBar(active){
    const names=[['look','① 見る'],['hide','② かくす'],['test','③ テスト']];
    return `<div class="v9-steps">${names.map(([k,n])=>`<div class="v9-step ${k===active?'on':rank(k)<rank(active)?'done':''}">${n}</div>`).join('')}</div>`;
  }

  function learnScreen(){
    injectStyles();
    const el=$('learn');
    if(!el)return;
    el.innerHTML='<div id="learnV9"></div>';
    renderLearn();
  }

  function renderLearn(){
    const root=document.getElementById('learnV9');
    if(!root)return;
    if(phase==='choose') return renderChoose(root);
    if(phase==='look') return renderLook(root);
    if(phase==='hide') return renderHide(root);
    if(phase==='test') return renderTest(root);
    if(phase==='result') return renderResult(root);
  }

  function renderChoose(root){
    root.innerHTML=`
      <div class="section">新しい段をおぼえる</div>
      <div class="card">
        <b>見て覚える → 隠して思い出す</b>
        <div class="sub">最初に答えを見て覚え、そのあと答えを隠して確認します。</div>
      </div>
      <div class="section">段をえらぶ</div>
      <div class="dan" id="danV9"></div>
      <div class="v9-note">※ ここでの正解は「今日の課題」や育成ポイントには加算されません。</div>`;
    const g=document.getElementById('danV9');
    for(let a=1;a<=9;a++){
      const b=document.createElement('button');
      const learned=Object.values(S.f).filter(f=>f.a===a&&f.learnedOn).length===9;
      b.innerHTML=`${a}の段${learned?'<br><small>✓ 学習済み</small>':''}`;
      b.onclick=()=>startDan(a);
      g.appendChild(b);
    }
  }

  function startDan(a){
    dan=a;phase='look';pos=0;hiddenQueue=[];hiddenMiss=[];testQueue=[];testPos=0;testCorrect=0;locked=false;
    renderLearn();
  }

  function head(title){
    return `<div class="v9-head"><div><div class="section" style="margin:0">${dan}の段</div><div class="tiny">${title}</div></div><button class="listen-btn" onclick="learnBackV9()">← 段を選ぶ</button></div>`;
  }
  window.learnBackV9=function(){phase='choose';renderLearn();};

  function renderLook(root){
    const show=S.settings.showReadings!==false;
    root.innerHTML=head('まず答えを見て覚えよう')+stepBar('look')+`
      <div class="v9-list">${Array.from({length:9},(_,i)=>{
        const b=i+1;
        return `<div class="v9-row ${show?'':'no-reading'}"><b>${eq(b)}</b>${show?`<div class="v9-reading">${reading(b)}</div>`:''}</div>`;
      }).join('')}</div>
      <div class="v9-actions"><button class="cta" onclick="learnStartHideV9()">覚えた！ 答えをかくす</button></div>
      <div class="v9-note">${show?'「いんいちがいち」などの読み方も一緒に表示しています。':'九九の読み方は設定でOFFになっています。'}</div>`;
  }
  window.learnStartHideV9=function(){phase='hide';pos=0;hiddenQueue=Array.from({length:9},(_,i)=>i+1);hiddenMiss=[];renderLearn();};

  function renderHide(root){
    const b=hiddenQueue[pos],show=S.settings.showReadings!==false;
    root.innerHTML=head('答えを隠して思い出そう')+stepBar('hide')+`
      <div class="v9-mini">${pos+1} / ${hiddenQueue.length}</div>
      <div class="v9-card">
        <div class="v9-eq">${dan} × ${b} = ？</div>
        ${show?'<div class="tiny">読み方も頭の中で思い出してみよう</div>':''}
        <div class="ansrow" style="justify-content:center;margin-top:12px">
          <input id="learnAnswerV9" class="answer" inputmode="numeric" aria-label="答え">
          <button class="cta" style="width:auto" onclick="learnSubmitHideV9()">答える</button>
        </div>
        <div id="learnFeedbackV9" class="feedback"></div>
      </div>
      <div class="v9-note">間違えた問題は、正解を確認したあとでもう一度出ます。</div>`;
    setTimeout(()=>document.getElementById('learnAnswerV9')?.focus(),80);
  }

  window.learnSubmitHideV9=function(){
    if(locked)return;
    const input=document.getElementById('learnAnswerV9');
    if(!input||input.value==='')return;
    locked=true;
    const b=hiddenQueue[pos],ans=dan*b,ok=Number(input.value)===ans;
    const fb=document.getElementById('learnFeedbackV9');
    if(ok){fb.className='feedback ok';fb.textContent='○ できた！';}
    else{
      fb.className='feedback ng';
      fb.innerHTML=`✕ 正解は ${ans}${S.settings.showReadings!==false?`<br><span class="tiny">${reading(b)}</span>`:''}`;
      if(!hiddenMiss.includes(b))hiddenMiss.push(b);
    }
    setTimeout(()=>{
      pos++;
      if(pos>=hiddenQueue.length){
        if(hiddenMiss.length){hiddenQueue=hiddenMiss.slice();hiddenMiss=[];pos=0;}
        else{phase='test';testQueue=shuffle(Array.from({length:9},(_,i)=>i+1));testPos=0;testCorrect=0;}
      }
      locked=false;renderLearn();
    },ok?430:950);
  };

  function renderTest(root){
    const b=testQueue[testPos];
    root.innerHTML=head('最後に9問テスト')+stepBar('test')+`
      <div class="v9-mini">${testPos+1} / 9　正解 ${testCorrect}</div>
      <div class="v9-card">
        <div class="learn-badge">答えを見ずに挑戦</div>
        <div class="v9-eq">${dan} × ${b} = ？</div>
        <div class="ansrow" style="justify-content:center;margin-top:12px">
          <input id="learnTestAnswerV9" class="answer" inputmode="numeric" aria-label="答え">
          <button class="cta" style="width:auto" onclick="learnSubmitTestV9()">答える</button>
        </div>
        <div id="learnTestFeedbackV9" class="feedback"></div>
      </div>
      <div class="v9-note">7/9以上で「学習済み」。このテストの正解は今日の課題には加算されません。</div>`;
    setTimeout(()=>document.getElementById('learnTestAnswerV9')?.focus(),80);
  }

  window.learnSubmitTestV9=function(){
    if(locked)return;
    const input=document.getElementById('learnTestAnswerV9');
    if(!input||input.value==='')return;
    locked=true;
    const b=testQueue[testPos],ans=dan*b,ok=Number(input.value)===ans;
    const fb=document.getElementById('learnTestFeedbackV9');
    if(ok){testCorrect++;fb.className='feedback ok';fb.textContent='○ 正解！';}
    else{fb.className='feedback ng';fb.innerHTML=`✕ 正解は ${ans}${S.settings.showReadings!==false?`<br><span class="tiny">${reading(b)}</span>`:''}`;}
    setTimeout(()=>{
      testPos++;
      if(testPos>=9){
        const passed=testCorrect>=7;
        const learnedOn=(new Date()).toISOString().slice(0,10);
        for(let b2=1;b2<=9;b2++){
          const f=S.f[`${dan}x${b2}`];
          f.learnTestScore=testCorrect;
          if(passed){
            f.learnedOn=learnedOn;
            f.pendingLearn=false;
            if(f.l<0)f.l=0;
            if(!f.d)f.d=Date.now();
          }
        }
        if(!S.learnHistory)S.learnHistory={};
        S.learnHistory[dan]={date:learnedOn,score:testCorrect,passed};
        save();phase='result';
      }
      locked=false;renderLearn();
    },ok?400:900);
  };

  function renderResult(root){
    const pass=testCorrect>=7;
    root.innerHTML=head('学習おわり！')+`
      <div class="v9-card">
        <div style="font-size:52px">${pass?'🎉':'🌱'}</div>
        <div class="h1">${dan}の段</div>
        <div class="v9-result">${testCorrect} / 9</div>
        <div class="sub">${pass?'学習済みになりました！':'7/9以上でもう一度チャレンジ！'}</div>
      </div>
      <div class="v9-actions">
        <button class="cta green" onclick="learnAgainV9()">もう一度おぼえる</button>
        <button class="cta white" onclick="learnFinishV9()">段をえらぶ</button>
      </div>
      <div class="v9-note">${pass?'この段は「今日の課題」の出題対象になります。':'今回はまだ「今日の課題」の出題対象にはなりません。'}</div>`;
  }
  window.learnAgainV9=function(){phase='look';pos=0;testCorrect=0;renderLearn();};
  window.learnFinishV9=function(){phase='choose';renderLearn();};

  // 今日の課題は「新しい段をおぼえる」で学習済みになった九九だけ
  function learnedFacts(){
    return Object.values(S.f).filter(f=>!!f.learnedOn);
  }
  function pickLearnedFact(){
    const pool=learnedFacts();
    if(!pool.length)return null;
    const now=Date.now(),weighted=[];
    for(const f of pool){
      let n=1;
      if(f.d&&f.d<=now)n+=4;
      if(f.at&&f.ok/f.at<.75)n+=3;
      if((f.ms||0)>5000)n+=1;
      for(let i=0;i<n;i++)weighted.push(f);
    }
    return weighted[Math.floor(Math.random()*weighted.length)]||pool[0];
  }

  let taskFact=null;
  openReview=function(){
    const t=(function(){
      if(!S.dailyTask||S.dailyTask.date!==day())S.dailyTask={date:day(),correct:0,attempts:0,wrong:0,cleared:false};
      return S.dailyTask;
    })();
    const g=Number(S.settings.dailyGoal)||10;
    if(t.correct>=g){
      if(!t.cleared)finishReview();
      else{modal('🎉','今日の課題はクリア済み！',`${t.correct}／${g} 正解できています。`);show('home');}
      return;
    }
    if(!learnedFacts().length){
      modal('📘','まず新しい段をおぼえよう','「新しい段をおぼえる」で7/9以上になると、今日の課題に出題されます。');
      show('learn');return;
    }
    show('review');nextReview();
  };

  nextReview=function(){
    const t=S.dailyTask&&S.dailyTask.date===day()?S.dailyTask:(S.dailyTask={date:day(),correct:0,attempts:0,wrong:0,cleared:false});
    const g=Number(S.settings.dailyGoal)||10;
    if(t.correct>=g){finishReview();return;}
    taskFact=pickLearnedFact();
    if(!taskFact){show('home');return;}
    $('reviewprog').textContent=`${t.correct}／${g} 正解`;
    $('reviewlevel').textContent='学習済みの九九から出題';
    $('reviewq').textContent=`${taskFact.a} × ${taskFact.b}`;
    $('reviewa').value='';$('reviewfb').textContent='';
    $('reviewsched').textContent=`あと ${g-t.correct} 問正解でクリア`;
    rs=performance.now();
    setTimeout(()=>$('reviewa').focus(),80);
  };

  submitReview=function(){
    if($('reviewa').value===''||!taskFact)return;
    const t=S.dailyTask&&S.dailyTask.date===day()?S.dailyTask:(S.dailyTask={date:day(),correct:0,attempts:0,wrong:0,cleared:false});
    const g=Number(S.settings.dailyGoal)||10;
    const ans=taskFact.a*taskFact.b,ok=Number($('reviewa').value)===ans;
    t.attempts++;
    rec(taskFact,ok,performance.now()-rs,'review');
    if(ok){
      t.correct++;
      $('reviewfb').className='feedback ok';$('reviewfb').textContent='○ 正解！ 1問カウント';
      $('reviewsched').textContent=`${Math.min(t.correct,g)}／${g} 正解`;
    }else{
      t.wrong++;
      $('reviewfb').className='feedback ng';$('reviewfb').innerHTML=`✕ ちがうよ<div class="wrong-answer">正解は ${ans}</div>`;
      $('reviewsched').textContent='不正解はカウントされません';
    }
    S.dailyTask=t;save();
    setTimeout(nextReview,ok?430:950);
  };

  function settingsUi(){
    const s=$('settings');
    if(!s||document.getElementById('readingSettingV9'))return;
    const first=s.querySelector('.card.setting-card');
    if(!first)return;
    const title=document.createElement('div');title.className='section';title.textContent='九九の読み方';
    const card=document.createElement('div');card.className='card setting-card v9-setting';card.id='readingSettingV9';
    card.innerHTML=`
      <b>「いんいちがいち」などの表示</b>
      <div class="sub">新しい段をおぼえる画面で、九九の読み方を表示するか選べます。</div>
      <div class="seg">
        <button data-reading="on" onclick="setReadingV9(true)">ON</button>
        <button data-reading="off" onclick="setReadingV9(false)">OFF</button>
      </div>
      <div id="readingSettingTextV9" class="tiny"></div>`;
    first.after(title,card);
  }
  window.setReadingV9=function(v){S.settings.showReadings=!!v;save();renderSettingsV9();};
  function renderSettingsV9(){
    ensureV9Settings();settingsUi();
    document.querySelectorAll('[data-reading]').forEach(b=>b.classList.toggle('active',(b.dataset.reading==='on')===S.settings.showReadings));
    const t=document.getElementById('readingSettingTextV9');
    if(t)t.textContent=`現在：${S.settings.showReadings?'ON':'OFF'}`;
  }

  function homeUi(){
    const h=$('home');if(!h)return;
    const stack=h.querySelector('.stack');
    if(stack){
      const learn=[...stack.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes("show('learn')"));
      const task=[...stack.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('openReview'));
      const ch=document.getElementById('challengeHome');
      if(learn&&task){
        stack.innerHTML='';
        learn.textContent='📘 新しい段をおぼえる';
        task.textContent='🧠 今日の課題をする';
        stack.append(learn,task);
      }
      if(ch){
        let area=document.getElementById('challengeAreaV9');
        if(!area){
          area=document.createElement('div');area.id='challengeAreaV9';
          area.innerHTML='<div class="section">チャレンジ</div><div class="card v9-challenge-card"><div class="sub">時間内に何問正解できるか挑戦。正解1問ごとに1P。</div><div id="challengeBtnSlotV9"></div></div>';
          stack.after(area);
        }
        document.getElementById('challengeBtnSlotV9').appendChild(ch);
      }
    }

    const sections=[...h.querySelectorAll('.section')];
    const rewardSec=sections.find(x=>x.textContent.trim()==='今日のごほうび');
    if(rewardSec){
      let card=rewardSec.nextElementSibling;
      if(card&&card.classList.contains('card')){
        card.className='card v9-rewards';
        card.innerHTML=`
          <div class="v9-reward-row"><span>🧠 今日の課題をクリア</span><b>+10P</b></div>
          <div class="v9-reward-row"><span>⏱ チャレンジ</span><b>正解数 × 1P</b></div>
          <div class="tiny">ポイントをためて、育成画面のショップでアイテムを買えます。</div>`;
      }
    }
  }

  const prevShow=show;
  show=function(id){
    prevShow(id);
    if(id==='learn'){phase='choose';learnScreen();}
    if(id==='settings')renderSettingsV9();
  };

  const prevHome=home;
  home=function(){prevHome();homeUi();};

  const prevSettings=settings;
  settings=function(){prevSettings();renderSettingsV9();};

  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    if(e.target&&e.target.id==='learnAnswerV9'){e.preventDefault();e.stopImmediatePropagation();learnSubmitHideV9();}
    if(e.target&&e.target.id==='learnTestAnswerV9'){e.preventDefault();e.stopImmediatePropagation();learnSubmitTestV9();}
  },true);

  ensureV9Settings();injectStyles();settingsUi();renderSettingsV9();homeUi();
})();