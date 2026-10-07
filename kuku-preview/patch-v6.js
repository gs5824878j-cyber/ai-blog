// v6: 今日の課題（正答数ベース）と 10/30/50 件設定
(function(){
  let taskCurrent=null;

  function ensureDailyTask(){
    if(!S.settings) S.settings={};
    if(![10,30,50].includes(Number(S.settings.dailyGoal))) S.settings.dailyGoal=10;
    const t=day();
    if(!S.dailyTask || S.dailyTask.date!==t){
      S.dailyTask={date:t,correct:0,attempts:0,wrong:0};
    }
    if(typeof S.dailyTask.correct!=='number') S.dailyTask.correct=0;
    if(typeof S.dailyTask.attempts!=='number') S.dailyTask.attempts=0;
    if(typeof S.dailyTask.wrong!=='number') S.dailyTask.wrong=0;
    save();
    return S.dailyTask;
  }

  function dailyGoal(){ ensureDailyTask(); return Number(S.settings.dailyGoal)||10; }
  function dailyCorrect(){ return ensureDailyTask().correct||0; }

  function taskPool(){
    return Object.values(S.f).filter(f=>f.l>=0 || f.at>0 || f.ca>0);
  }

  function pickTaskFact(){
    const pool=taskPool();
    if(!pool.length) return null;
    const now=Date.now(), weighted=[];
    pool.forEach(f=>{
      let n=1;
      if(f.d && f.d<=now) n+=4;
      if(f.at && f.ok/f.at<0.75) n+=3;
      if((f.ms||0)>5000) n+=1;
      for(let i=0;i<n;i++) weighted.push(f);
    });
    return weighted[Math.floor(Math.random()*weighted.length)] || pool[0];
  }

  function setupLabels(){
    const dueEl=$('due');
    if(dueEl){
      const card=dueEl.closest('.card');
      const label=card && card.querySelector('.label');
      if(label) label.textContent='今日の課題';
      const big=dueEl.parentElement;
      if(big && !big.dataset.taskFormat){
        big.dataset.taskFormat='1';
        big.innerHTML='<span id="due">0／10</span>';
      }
    }
    const home=$('home');
    if(home){
      const buttons=[...home.querySelectorAll('button')];
      const taskBtn=buttons.find(b=>(b.getAttribute('onclick')||'').includes('openReview'));
      if(taskBtn) taskBtn.textContent='🧠 今日の課題をする';
      const rewardCards=[...home.querySelectorAll('.card')];
      const reward=rewardCards.find(c=>c.textContent.includes('今日の復習'));
      if(reward) reward.textContent='🎁 今日の課題を全部クリアすると育成アイテムGET';
    }
    const review=$('review');
    if(review){
      const title=review.querySelector('.section');
      if(title && title.firstChild) title.firstChild.textContent='今日の課題 ';
    }
  }

  function ensureGoalSettingUI(){
    const settingsScreen=$('settings');
    if(!settingsScreen || $('dailyGoalSetting')) return;
    const firstCard=settingsScreen.querySelector('.card.setting-card');
    if(!firstCard) return;
    const title=document.createElement('div');
    title.className='section';
    title.textContent='今日の課題';
    const card=document.createElement('div');
    card.id='dailyGoalSetting';
    card.className='card setting-card';
    card.innerHTML=`<b>1日の正答目標</b>
      <div class="sub">10・30・50から選べます。間違えた問題はカウントされません。</div>
      <div class="seg">
        <button data-goal="10" onclick="setDailyGoal(10)">10問</button>
        <button data-goal="30" onclick="setDailyGoal(30)">30問</button>
        <button data-goal="50" onclick="setDailyGoal(50)">50問</button>
      </div>
      <div id="dailyGoalSettingText" class="tiny"></div>`;
    firstCard.after(title,card);
  }

  window.setDailyGoal=function(n){
    n=Number(n);
    if(![10,30,50].includes(n)) return;
    ensureDailyTask();
    S.settings.dailyGoal=n;
    save();
    renderGoalSetting();
    home();
  };

  function renderGoalSetting(){
    ensureGoalSettingUI();
    const goal=dailyGoal();
    document.querySelectorAll('[data-goal]').forEach(b=>b.classList.toggle('active',Number(b.dataset.goal)===goal));
    const t=$('dailyGoalSettingText');
    if(t) t.textContent=`現在：${goal}問（正解した問題だけカウント）`;
  }

  const originalHome=home;
  home=function(){
    originalHome();
    setupLabels();
    const task=ensureDailyTask(), goal=dailyGoal();
    const dueNow=$('due');
    if(dueNow) dueNow.textContent=`${Math.min(task.correct,goal)}／${goal}`;
    const sub=$('nextdue');
    if(sub) sub.textContent=task.correct>=goal?'今日の課題クリア！':'正解した数だけカウント';
  };

  const originalSettings=settings;
  settings=function(){
    originalSettings();
    ensureGoalSettingUI();
    renderGoalSetting();
  };

  openReview=function(){
    const task=ensureDailyTask(), goal=dailyGoal();
    if(task.correct>=goal){
      modal('🎉','今日の課題はクリア済み！',`${task.correct}／${goal} 正解できています。`);
      show('home');
      return;
    }
    if(!taskPool().length){
      modal('📘','まず1つの段をおぼえよう','「新しい段をおぼえる」で学習した九九が、今日の課題に出題されます。');
      show('learn');
      return;
    }
    show('review');
    nextReview();
  };

  nextReview=function(){
    const task=ensureDailyTask(), goal=dailyGoal();
    if(task.correct>=goal){ finishReview(); return; }
    taskCurrent=pickTaskFact();
    if(!taskCurrent){ show('home'); return; }
    $('reviewprog').textContent=`${task.correct}／${goal} 正解`;
    $('reviewlevel').textContent='正解した問題だけ今日の課題にカウント';
    $('reviewq').textContent=`${taskCurrent.a} × ${taskCurrent.b}`;
    $('reviewa').value='';
    $('reviewfb').textContent='';
    $('reviewsched').textContent=`あと ${Math.max(0,goal-task.correct)} 問正解でクリア`;
    rs=performance.now();
    setTimeout(()=>$('reviewa').focus(),80);
  };

  submitReview=function(){
    if($('reviewa').value==='' || !taskCurrent) return;
    const task=ensureDailyTask(), goal=dailyGoal();
    const correctAnswer=taskCurrent.a*taskCurrent.b;
    const ok=Number($('reviewa').value)===correctAnswer;
    task.attempts++;
    rec(taskCurrent,ok,performance.now()-rs,'review');
    if(ok){
      task.correct++;
      S.coins+=2;
      S.pet.xp+=2;
      S.pet.care.study+=2;
      $('reviewfb').className='feedback ok';
      $('reviewfb').textContent='○ 正解！ 1問カウント';
      $('reviewsched').textContent=`${Math.min(task.correct,goal)}／${goal} 正解`;
    }else{
      task.wrong++;
      $('reviewfb').className='feedback ng';
      $('reviewfb').innerHTML=`✕ ちがうよ <div class="wrong-answer">正解は ${correctAnswer}</div>`;
      $('reviewsched').textContent='不正解は今日の課題にカウントされません';
    }
    S.dailyTask=task;
    save();
    setTimeout(nextReview,ok?430:1050);
  };

  finishReview=function(){
    const task=ensureDailyTask(), goal=dailyGoal();
    if(task.correct<goal){ nextReview(); return; }
    let text=`${goal}問正解！ 今日の課題クリア！`;
    if(S.reward!==day()){
      const ks=['food','toy','book','gem'];
      const k=ks[Math.floor(Math.random()*ks.length)];
      S.pet.inv[k]=(S.pet.inv[k]||0)+1;
      S.reward=day();
      S.coins+=10;
      S.pet.xp+=8;
      S.pet.log.unshift(`今日の課題クリア！ ${ITEMS[k].n}をGET`);
      text+=` ${ITEMS[k].e} ${ITEMS[k].n} と10コインをGET！`;
    }
    save();
    modal('🎁','今日の課題クリア！',text);
    show('home');
  };

  setupLabels();
  ensureGoalSettingUI();
  ensureDailyTask();
  renderGoalSetting();
  home();
})();