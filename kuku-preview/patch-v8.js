// v8: 「新しい段をおぼえる」を見る→聞く・言う→答えをかくす→9問テストに刷新
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

  function todayLocal(){
    const d=new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function promoteYesterdayLearning(){
    let changed=false;
    Object.values(S.f).forEach(f=>{
      if(f.pendingLearn && f.learnedOn && f.learnedOn!==todayLocal()){
        f.pendingLearn=false;
        if(f.l<0) f.l=0;
        f.d=Date.now();
        changed=true;
      }
    });
    if(changed) save();
  }

  function injectStyles(){
    if(document.getElementById('learnV8Style')) return;
    const s=document.createElement('style');
    s.id='learnV8Style';
    s.textContent=`
      #learn .learn-v8-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      #learn .learn-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:10px 0 14px}
      #learn .learn-step{font-size:10px;text-align:center;padding:7px 3px;border-radius:12px;background:#f0ede7;color:#82776c;font-weight:700}
      #learn .learn-step.on{background:#ffe2a8;color:#6b4d24}
      #learn .learn-step.done{background:#dff2d6;color:#4e7442}
      #learn .chant-card{background:linear-gradient(180deg,#fffaf1,#fff);border:1px solid #eadbc6;border-radius:22px;padding:18px;text-align:center;box-shadow:0 5px 18px rgba(80,55,30,.06)}
      #learn .chant-eq{font-size:38px;font-weight:900;letter-spacing:.5px;margin:4px 0 8px}
      #learn .chant-reading{font-size:22px;font-weight:800;color:#9a5e27;margin:4px 0 14px;line-height:1.45}
      #learn .listen-btn{border:0;background:#fff0cf;border-radius:999px;padding:10px 16px;font-weight:800;color:#6c4f2f}
      #learn .learn-list{display:grid;gap:7px}
      #learn .learn-row{display:grid;grid-template-columns:92px 1fr 38px;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:#fff;border:1px solid #eee3d6}
      #learn .learn-row b{font-size:18px}
      #learn .learn-row .r{font-size:14px;color:#8c623b}
      #learn .round-audio{border:0;width:36px;height:36px;border-radius:50%;background:#fff0cf;font-size:18px}
      #learn .learn-note{font-size:12px;color:#8b8178;line-height:1.5;margin:10px 2px}
      #learn .learn-actions{display:grid;gap:8px;margin-top:13px}
      #learn .learn-feedback{min-height:30px;font-weight:800;margin-top:9px}
      #learn .learn-result{font-size:48px;font-weight:900;margin:8px 0}
      #learn .learn-badge{display:inline-block;background:#fff0cf;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:800;color:#70532f}
      #learn .mini-progress{font-size:12px;color:#877a6c;margin-bottom:6px}
    `;
    document.head.appendChild(s);
  }

  function speak(text){
    if(!('speechSynthesis' in window)){
      modal('🔊','音声を使えません','この端末では音声読み上げに対応していません。');
      return;
    }
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='ja-JP';
      u.rate=.82;
      u.pitch=1.04;
      const voices=speechSynthesis.getVoices();
      const jp=voices.find(v=>/^ja/i.test(v.lang));
      if(jp) u.voice=jp;
      speechSynthesis.speak(u);
    }catch(e){}
  }
  window.learnSpeakV8=speak;

  function reading(b){return READINGS[dan][b-1];}
  function eq(b,showAnswer=true){return `${dan} × ${b}${showAnswer?' = '+dan*b:''}`;}
  function shuffle(a){return a.slice().sort(()=>Math.random()-.5);}

  function screen(){
    injectStyles();
    const el=$('learn');
    if(!el) return;
    el.innerHTML='<div id="learnV8"></div>';
    render();
  }

  function stepBar(active){
    const names=[['look','① 見る'],['say','② 聞く・言う'],['hide','③ かくす'],['test','④ テスト']];
    return `<div class="learn-steps">${names.map(([k,n])=>`<div class="learn-step ${k===active?'on':phaseRank(k)<phaseRank(active)?'done':''}">${n}</div>`).join('')}</div>`;
  }
  function phaseRank(p){return {look:1,say:2,hide:3,test:4,result:5}[p]||0;}

  function render(){
    const root=document.getElementById('learnV8');
    if(!root) return;
    if(phase==='choose'){ renderChoose(root); return; }
    if(phase==='look'){ renderLook(root); return; }
    if(phase==='say'){ renderSay(root); return; }
    if(phase==='hide'){ renderHide(root); return; }
    if(phase==='test'){ renderTest(root); return; }
    if(phase==='result'){ renderResult(root); return; }
  }

  function renderChoose(root){
    root.innerHTML=`
      <div class="section">新しい段をおぼえる</div>
      <div class="card">
        <b>まず「答える」より「覚える」</b>
        <div class="sub">数字・九九の唱え方・音をセットで覚えてから、答えを隠して確認します。</div>
      </div>
      <div class="section">段をえらぶ</div>
      <div class="dan" id="danV8"></div>
      <div class="learn-note">※ ここでの練習やテストは「今日の課題」の正解数・育成ポイントには加算されません。</div>`;
    const g=document.getElementById('danV8');
    for(let a=1;a<=9;a++){
      const b=document.createElement('button');
      const learned=Object.values(S.f).filter(f=>f.a===a&&f.learnedOn).length===9;
      b.innerHTML=`${a}の段${learned?'<br><small>✓ 学習済み</small>':''}`;
      b.onclick=()=>startDan(a);
      g.appendChild(b);
    }
  }

  function startDan(a){
    dan=a; phase='look'; pos=0; hiddenQueue=[]; hiddenMiss=[]; testQueue=[]; testPos=0; testCorrect=0; locked=false;
    render();
  }

  function header(title){
    return `<div class="learn-v8-head"><div><div class="section" style="margin:0">${dan}の段</div><div class="tiny">${title}</div></div><button class="listen-btn" onclick="learnBackV8()">← 段を選ぶ</button></div>`;
  }
  window.learnBackV8=function(){phase='choose';try{speechSynthesis.cancel()}catch(e){}render();};

  function renderLook(root){
    root.innerHTML=header('まず全部を見て、読み方を知ろう')+stepBar('look')+`
      <div class="learn-list">${Array.from({length:9},(_,i)=>{
        const b=i+1;
        return `<div class="learn-row"><b>${eq(b)}</b><div class="r">${reading(b)}</div><button class="round-audio" onclick="learnSpeakV8('${reading(b)}')">🔊</button></div>`;
      }).join('')}</div>
      <div class="learn-actions"><button class="cta" onclick="learnStartSayV8()">全部見た！ 次へ</button></div>
      <div class="learn-note">🔊を押すと九九の唱え方を聞けます。学校や先生によって細かな読み方が異なる場合があります。</div>`;
  }
  window.learnStartSayV8=function(){phase='say';pos=0;render();setTimeout(()=>speak(reading(1)),180);};

  function renderSay(root){
    const b=pos+1;
    root.innerHTML=header('聞いて、声に出して言ってみよう')+stepBar('say')+`
      <div class="mini-progress">${b} / 9</div>
      <div class="chant-card">
        <div class="chant-eq">${eq(b)}</div>
        <div class="chant-reading">${reading(b)}</div>
        <button class="listen-btn" onclick="learnSpeakV8('${reading(b)}')">🔊 もう一度きく</button>
      </div>
      <div class="learn-actions"><button class="cta green" onclick="learnSaidV8()">声に出して言えた！</button></div>
      <div class="learn-note">音をまねして言うだけでOK。ここでは正解・不正解をつけません。</div>`;
  }
  window.learnSaidV8=function(){
    pos++;
    if(pos>=9){phase='hide';pos=0;hiddenQueue=Array.from({length:9},(_,i)=>i+1);hiddenMiss=[];render();}
    else {render();setTimeout(()=>speak(reading(pos+1)),140);}
  };

  function renderHide(root){
    const b=hiddenQueue[pos];
    root.innerHTML=header('今度は答えを隠して思い出そう')+stepBar('hide')+`
      <div class="mini-progress">${pos+1} / ${hiddenQueue.length}</div>
      <div class="chant-card">
        <div class="chant-eq">${dan} × ${b} = ？</div>
        <div class="chant-reading" style="font-size:15px;color:#8b8178">九九の唱え方も思い出してみよう</div>
        <div class="ansrow" style="justify-content:center;margin-top:12px">
          <input id="learnAnswerV8" class="answer" inputmode="numeric" aria-label="答え">
          <button class="cta" style="width:auto" onclick="learnSubmitHideV8()">答える</button>
        </div>
        <div id="learnFeedbackV8" class="learn-feedback"></div>
      </div>
      <div class="learn-note">間違えても大丈夫。正解を見てから、あとでもう一度出ます。</div>`;
    setTimeout(()=>document.getElementById('learnAnswerV8')?.focus(),80);
  }

  window.learnSubmitHideV8=function(){
    if(locked) return;
    const input=document.getElementById('learnAnswerV8');
    if(!input||input.value==='')return;
    locked=true;
    const b=hiddenQueue[pos],ans=dan*b,ok=Number(input.value)===ans;
    const fb=document.getElementById('learnFeedbackV8');
    if(ok){
      fb.className='learn-feedback feedback ok'; fb.textContent='○ できた！';
    }else{
      fb.className='learn-feedback feedback ng'; fb.innerHTML=`✕ 正解は ${ans}<br><span class="tiny">${reading(b)}</span>`;
      if(!hiddenMiss.includes(b))hiddenMiss.push(b);
    }
    setTimeout(()=>{
      pos++;
      if(pos>=hiddenQueue.length){
        if(hiddenMiss.length){
          hiddenQueue=hiddenMiss.slice();hiddenMiss=[];pos=0;
          modal('🔁','もう一度だけ','間違えた問題だけ、もう一度やってみよう！');
        }else{
          phase='test';testQueue=shuffle(Array.from({length:9},(_,i)=>i+1));testPos=0;testCorrect=0;
        }
      }
      locked=false;render();
    },ok?430:1050);
  };

  function renderTest(root){
    const b=testQueue[testPos];
    root.innerHTML=header('最後に9問テスト')+stepBar('test')+`
      <div class="mini-progress">${testPos+1} / 9　正解 ${testCorrect}</div>
      <div class="chant-card">
        <div class="learn-badge">答えも読み方も見ないで挑戦</div>
        <div class="chant-eq" style="margin-top:16px">${dan} × ${b} = ？</div>
        <div class="ansrow" style="justify-content:center;margin-top:12px">
          <input id="learnTestAnswerV8" class="answer" inputmode="numeric" aria-label="答え">
          <button class="cta" style="width:auto" onclick="learnSubmitTestV8()">答える</button>
        </div>
        <div id="learnTestFeedbackV8" class="learn-feedback"></div>
      </div>
      <div class="learn-note">このテストも「今日の課題」には加算されません。</div>`;
    setTimeout(()=>document.getElementById('learnTestAnswerV8')?.focus(),80);
  }

  window.learnSubmitTestV8=function(){
    if(locked)return;
    const input=document.getElementById('learnTestAnswerV8');
    if(!input||input.value==='')return;
    locked=true;
    const b=testQueue[testPos],ans=dan*b,ok=Number(input.value)===ans;
    const fb=document.getElementById('learnTestFeedbackV8');
    if(ok){testCorrect++;fb.className='learn-feedback feedback ok';fb.textContent='○ 正解！';}
    else{fb.className='learn-feedback feedback ng';fb.innerHTML=`✕ 正解は ${ans}<br><span class="tiny">${reading(b)}</span>`;}
    setTimeout(()=>{
      testPos++;
      if(testPos>=9){
        const learnedOn=todayLocal();
        const passed=testCorrect>=7;
        for(let b2=1;b2<=9;b2++){
          const f=S.f[`${dan}x${b2}`];
          f.learnTestScore=testCorrect;
          if(passed){
            f.learnedOn=learnedOn;
            f.pendingLearn=true;
            // 今日の課題に混ざらないよう、SRS開始は翌日
            if(f.l<0){f.l=-1;f.d=0;}
          }
        }
        if(!S.learnHistory)S.learnHistory={};
        S.learnHistory[dan]={date:learnedOn,score:testCorrect,passed};
        save();
        phase='result';
      }
      locked=false;render();
    },ok?400:950);
  };

  function renderResult(root){
    const pass=testCorrect>=7;
    root.innerHTML=header('学習おわり！')+`
      <div class="chant-card">
        <div style="font-size:52px">${pass?'🎉':'🌱'}</div>
        <div class="h1">${dan}の段</div>
        <div class="learn-result">${testCorrect} / 9</div>
        <div class="sub">${pass?'よく覚えられたね！':'もう一度やれば、もっと覚えられるよ！'}</div>
      </div>
      <div class="learn-actions">
        <button class="cta green" onclick="learnAgainV8()">もう一度おぼえる</button>
        <button class="cta white" onclick="learnFinishV8()">段をえらぶ</button>
      </div>
      <div class="learn-note">${pass?'合格した段は今日の課題には入りません。翌日以降、復習対象になります。':'7/9以上で「学習済み」になります。今回は今日の課題には追加されません。'}</div>`;
  }
  window.learnAgainV8=function(){phase='look';pos=0;testCorrect=0;render();};
  window.learnFinishV8=function(){phase='choose';render();};

  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter')return;
    if(e.target&&e.target.id==='learnAnswerV8'){e.preventDefault();learnSubmitHideV8();}
    if(e.target&&e.target.id==='learnTestAnswerV8'){e.preventDefault();learnSubmitTestV8();}
  });

  // show('learn') 時に新画面を初期化
  const prevShow=show;
  show=function(id){
    promoteYesterdayLearning();
    prevShow(id);
    if(id==='learn'){phase='choose';screen();}
  };

  // アプリを開いたまま翌日になった場合もホーム遷移時に復習対象へ
  const prevHome=home;
  home=function(){promoteYesterdayLearning();prevHome();};

  promoteYesterdayLearning();
  injectStyles();
})();