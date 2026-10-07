// v10: プレビュー用ポイント付与 + 育成進化確認 + キャラクターを立体的/セミリアルに
(function(){
  function injectV10Styles(){
    if(document.getElementById('v10style')) return;
    const s=document.createElement('style');
    s.id='v10style';
    s.textContent=`
      .pet-anim.v10pet{filter:drop-shadow(0 10px 12px rgba(74,52,34,.16));overflow:visible}
      .pet-anim.v10pet .blink{transform-origin:center;animation:v10blink 4.6s infinite}
      .pet-anim.v10pet .breath{transform-origin:center;animation:v10breath 3.2s ease-in-out infinite}
      .pet-anim.v10pet .tail-real{transform-origin:145px 120px;animation:v10tail 2.8s ease-in-out infinite}
      @keyframes v10blink{0%,45%,48%,100%{transform:scaleY(1)}46%,47%{transform:scaleY(.12)}}
      @keyframes v10breath{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.025)}}
      @keyframes v10tail{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(7deg)}}
      #petroom .v10-evo-guide{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin:10px 0}
      #petroom .v10-evo-step{background:#fffaf1;border:1px solid #eadfce;border-radius:12px;padding:7px 3px;text-align:center;font-size:10px}
      #petroom .v10-evo-step.now{background:#ffe7b5;border-color:#e2bd72;font-weight:900}
      #parent .v10-debug-note{font-size:12px;line-height:1.5;color:#776b60;margin-top:8px}
    `;
    document.head.appendChild(s);
  }

  function petCfg(){
    const b=branch();
    return b && RO[b] ? RO[b] : {c1:'#d5a56b',c2:'#8e5f39',mark:''};
  }

  function stageInfo(){
    const n=stage().n;
    const order=['たまご','あかちゃん','こども','せいちょう','おとな'];
    return {name:n,index:Math.max(0,order.indexOf(n))};
  }

  function eggSvg(species){
    const accent=species==='dino'?'#7fa879':species==='human'?'#d49a78':'#b77a4a';
    return `
      <svg class="pet-anim v10pet" viewBox="0 0 220 210" aria-label="たまご">
        <defs>
          <radialGradient id="v10egg" cx="32%" cy="24%">
            <stop offset="0" stop-color="#fffef6"/>
            <stop offset=".45" stop-color="#f7e7bd"/>
            <stop offset="1" stop-color="#d9b56d"/>
          </radialGradient>
          <linearGradient id="v10ground" x1="0" y1="0" x2="0" y2="1">
            <stop stop-color="#6a5133" stop-opacity=".22"/><stop offset="1" stop-color="#6a5133" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <ellipse cx="110" cy="184" rx="63" ry="12" fill="url(#v10ground)"/>
        <path d="M110 28 C76 28 53 69 53 118 C53 162 76 184 110 184 C144 184 167 162 167 118 C167 69 144 28 110 28Z"
          fill="url(#v10egg)" stroke="#7a6549" stroke-width="4"/>
        <path d="M76 80 C88 67 92 84 104 70 C116 57 123 78 138 66" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity=".65"/>
        <ellipse cx="87" cy="68" rx="15" ry="27" fill="#fff" opacity=".36" transform="rotate(20 87 68)"/>
        <path d="M94 132 l11-9 9 10 12-8" fill="none" stroke="#9a7b54" stroke-width="4" stroke-linecap="round" opacity=".45"/>
      </svg>`;
  }

  function animalSvg(idx,cfg){
    const grow=[.70,.80,.90,1.00][Math.max(0,idx-1)]||1;
    const ear=idx>=3?24:21, leg=idx>=3?31:25, muzzle=idx>=4?29:26;
    return `
      <svg class="pet-anim v10pet" viewBox="0 0 240 220" aria-label="動物キャラクター">
        <defs>
          <radialGradient id="v10fur" cx="34%" cy="22%">
            <stop offset="0" stop-color="#fff" stop-opacity=".42"/>
            <stop offset=".22" stop-color="${cfg.c1}"/>
            <stop offset="1" stop-color="${cfg.c2}"/>
          </radialGradient>
          <radialGradient id="v10muzzle" cx="42%" cy="30%"><stop stop-color="#fff7ea"/><stop offset="1" stop-color="#dcc6a8"/></radialGradient>
          <linearGradient id="v10shade" x1="0" x2="1"><stop stop-color="#5f432f" stop-opacity=".24"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient>
        </defs>
        <ellipse cx="120" cy="199" rx="69" ry="11" fill="#5b4939" opacity=".14"/>
        <g transform="translate(120 114) scale(${grow}) translate(-120 -114)" class="breath">
          <path class="tail-real" d="M166 139 C211 126 224 153 201 170 C188 180 173 169 171 156"
            fill="none" stroke="${cfg.c2}" stroke-width="22" stroke-linecap="round"/>
          <ellipse cx="120" cy="143" rx="53" ry="48" fill="url(#v10fur)"/>
          <path d="M87 153 C93 176 92 ${176+leg/5} 88 ${185+leg/6}" stroke="${cfg.c2}" stroke-width="${leg}" stroke-linecap="round"/>
          <path d="M151 153 C147 176 148 ${176+leg/5} 152 ${185+leg/6}" stroke="${cfg.c2}" stroke-width="${leg}" stroke-linecap="round"/>
          <ellipse cx="120" cy="89" rx="49" ry="44" fill="url(#v10fur)"/>
          <path d="M82 68 L74 ${35-ear/4} L104 52 Z" fill="${cfg.c1}" stroke="#674b36" stroke-width="3"/>
          <path d="M158 68 L166 ${35-ear/4} L136 52 Z" fill="${cfg.c1}" stroke="#674b36" stroke-width="3"/>
          <path d="M84 58 L80 43 L97 54 Z" fill="#d7a88e" opacity=".72"/>
          <path d="M156 58 L160 43 L143 54 Z" fill="#d7a88e" opacity=".72"/>
          <g class="blink">
            <ellipse cx="101" cy="88" rx="8" ry="10" fill="#1d1b19"/>
            <ellipse cx="139" cy="88" rx="8" ry="10" fill="#1d1b19"/>
            <circle cx="98" cy="84" r="2.4" fill="#fff"/><circle cx="136" cy="84" r="2.4" fill="#fff"/>
          </g>
          <ellipse cx="120" cy="111" rx="${muzzle}" ry="22" fill="url(#v10muzzle)"/>
          <path d="M114 105 Q120 100 126 105 Q120 112 114 105" fill="#49372f"/>
          <path d="M120 111 Q111 120 103 117 M120 111 Q129 120 137 117" fill="none" stroke="#60483b" stroke-width="3" stroke-linecap="round"/>
          <path d="M91 71 Q120 58 149 71" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/>
          <path d="M72 143 C89 150 91 164 84 176" fill="none" stroke="url(#v10shade)" stroke-width="8" stroke-linecap="round"/>
        </g>
      </svg>`;
  }

  function dinoSvg(idx,cfg){
    const grow=[.72,.82,.91,1.00][Math.max(0,idx-1)]||1;
    const snout=idx>=3?46:38, thigh=idx>=4?22:19;
    return `
      <svg class="pet-anim v10pet" viewBox="0 0 250 220" aria-label="恐竜キャラクター">
        <defs>
          <radialGradient id="v10dino" cx="34%" cy="20%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".18" stop-color="${cfg.c1}"/><stop offset="1" stop-color="${cfg.c2}"/></radialGradient>
          <linearGradient id="v10belly" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#efe0bd"/><stop offset="1" stop-color="#cbb48e"/></linearGradient>
        </defs>
        <ellipse cx="126" cy="198" rx="75" ry="10" fill="#4d4439" opacity=".15"/>
        <g transform="translate(124 112) scale(${grow}) translate(-124 -112)" class="breath">
          <path class="tail-real" d="M160 139 C208 129 238 122 242 105 C224 140 206 165 165 166Z" fill="url(#v10dino)" stroke="#4e473b" stroke-width="3"/>
          <ellipse cx="132" cy="145" rx="48" ry="42" fill="url(#v10dino)"/>
          <path d="M104 157 C96 172 95 185 87 195" fill="none" stroke="${cfg.c2}" stroke-width="${thigh}" stroke-linecap="round"/>
          <path d="M150 158 C153 174 158 186 166 195" fill="none" stroke="${cfg.c2}" stroke-width="${thigh}" stroke-linecap="round"/>
          <path d="M77 194 h29 M151 194 h31" stroke="#4b4339" stroke-width="5" stroke-linecap="round"/>
          <ellipse cx="115" cy="82" rx="46" ry="38" fill="url(#v10dino)"/>
          <path d="M118 70 C145 62 ${151+snout/2} 68 ${160+snout/2} 80 C147 87 132 91 112 91Z" fill="${cfg.c1}" stroke="#4e473b" stroke-width="3"/>
          <g class="blink"><ellipse cx="98" cy="76" rx="7" ry="9" fill="#191817"/><circle cx="96" cy="73" r="2" fill="#fff"/></g>
          <path d="M145 79 q8 4 16 0" fill="none" stroke="#51483d" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M105 108 C101 122 94 127 84 129 M119 110 C118 124 125 128 133 130" fill="none" stroke="${cfg.c2}" stroke-width="8" stroke-linecap="round"/>
          <path d="M93 121 l-10 8 10 1" fill="none" stroke="#493f35" stroke-width="2"/>
          <path d="M132 128 l9 5-8 3" fill="none" stroke="#493f35" stroke-width="2"/>
          <ellipse cx="126" cy="150" rx="26" ry="28" fill="url(#v10belly)" opacity=".72"/>
          <path d="M84 54 l8-16 9 17 9-20 10 19 9-14 8 18" fill="${idx>=3?'#d8b85d':'#b9a96d'}" opacity=".9"/>
          <circle cx="153" cy="95" r="2.7" fill="#66594a" opacity=".7"/><circle cx="165" cy="89" r="2.1" fill="#66594a" opacity=".7"/>
        </g>
      </svg>`;
  }

  function humanSvg(idx,cfg){
    const grow=[.73,.82,.91,1.00][Math.max(0,idx-1)]||1;
    const hair=idx>=3?'#34271f':'#49342a';
    return `
      <svg class="pet-anim v10pet" viewBox="0 0 230 225" aria-label="人間キャラクター">
        <defs>
          <radialGradient id="v10skin" cx="36%" cy="22%"><stop offset="0" stop-color="#fff7ed"/><stop offset=".68" stop-color="#efc09a"/><stop offset="1" stop-color="#d79e75"/></radialGradient>
          <linearGradient id="v10shirt" x1="0" x2="1"><stop stop-color="${cfg.c1}"/><stop offset="1" stop-color="${cfg.c2}"/></linearGradient>
        </defs>
        <ellipse cx="115" cy="205" rx="59" ry="9" fill="#453b34" opacity=".14"/>
        <g transform="translate(115 114) scale(${grow}) translate(-115 -114)" class="breath">
          <path d="M95 139 C83 160 81 180 80 199" fill="none" stroke="#514941" stroke-width="19" stroke-linecap="round"/>
          <path d="M136 139 C148 160 150 180 151 199" fill="none" stroke="#514941" stroke-width="19" stroke-linecap="round"/>
          <path d="M70 201 h25 M138 201 h27" stroke="#332e2a" stroke-width="8" stroke-linecap="round"/>
          <rect x="76" y="112" width="78" height="61" rx="25" fill="url(#v10shirt)"/>
          <path d="M78 126 C58 138 55 153 52 166" fill="none" stroke="#e9b68f" stroke-width="15" stroke-linecap="round"/>
          <path d="M152 126 C171 138 176 151 179 164" fill="none" stroke="#e9b68f" stroke-width="15" stroke-linecap="round"/>
          <rect x="108" y="101" width="16" height="20" rx="7" fill="#e6ae86"/>
          <ellipse cx="116" cy="72" rx="45" ry="47" fill="url(#v10skin)"/>
          <path d="M73 69 C73 31 97 22 117 23 C148 24 160 46 157 72 C143 53 126 48 107 51 C94 54 84 61 73 69Z" fill="${hair}"/>
          <path d="M82 48 C101 32 128 31 149 45" fill="none" stroke="#6d4d38" stroke-width="6" stroke-linecap="round" opacity=".34"/>
          <g class="blink">
            <ellipse cx="98" cy="76" rx="5.7" ry="7.5" fill="#2c261f"/>
            <ellipse cx="134" cy="76" rx="5.7" ry="7.5" fill="#2c261f"/>
            <circle cx="96.5" cy="73.5" r="1.6" fill="#fff"/><circle cx="132.5" cy="73.5" r="1.6" fill="#fff"/>
          </g>
          <path d="M115 78 q-2 8 2 12" fill="none" stroke="#bd8764" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M102 96 Q116 105 130 96" fill="none" stroke="#9c654d" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M84 68 Q98 60 110 66 M122 66 Q136 60 149 69" fill="none" stroke="${hair}" stroke-width="3" stroke-linecap="round" opacity=".75"/>
        </g>
      </svg>`;
  }

  petSvg=function(){
    injectV10Styles();
    const sp=S.settings.species, st=stageInfo(), cfg=petCfg();
    if(st.index===0) return eggSvg(sp);
    if(sp==='dino') return dinoSvg(st.index,cfg);
    if(sp==='human') return humanSvg(st.index,cfg);
    return animalSvg(st.index,cfg);
  };

  function addEvolutionGuide(){
    const room=$('petroom');
    if(!room || document.getElementById('v10EvoGuide')) return;
    const route=room.querySelector('.route');
    if(!route) return;
    const box=document.createElement('div');
    box.id='v10EvoGuide';
    box.className='card';
    box.style.marginTop='12px';
    box.innerHTML='<b>成長の目安</b><div class="tiny">アイテムをあげた回数で少しずつ成長します。</div><div class="v10-evo-guide"></div>';
    route.before(box);
  }

  function renderEvolutionGuide(){
    addEvolutionGuide();
    const g=document.querySelector('#v10EvoGuide .v10-evo-guide');
    if(!g) return;
    const steps=[
      ['たまご','0回'],['あかちゃん','1回'],['こども','5回'],['せいちょう','12回'],['おとな','25回']
    ];
    const now=stage().n;
    g.innerHTML=steps.map(([n,c])=>`<div class="v10-evo-step ${n===now?'now':''}"><b>${n}</b><br>${c}</div>`).join('');
  }

  window.previewAddPointsV10=function(){
    S.coins=(S.coins||0)+300;
    S.pet.log.unshift('プレビュー用 +300P');
    save();
    home(); petroom();
    modal('⭐','プレビュー用 +300P','育成画面のショップでアイテムを購入し、実際にあげて進化を確認できます。');
  };

  window.previewResetGrowthV10=function(){
    S.pet.xp=0;
    S.pet.branch=null;
    S.pet.care={study:0,play:0,food:0};
    S.pet.inv={food:0,toy:0,book:0,gem:0};
    S.pet.log.unshift('育成状態だけ初期化しました');
    save();
    home(); petroom();
    modal('🥚','育成を初期化','ポイントと学習記録は残したまま、キャラクターをたまごに戻しました。');
  };

  function addDebugButtons(){
    const parent=$('parent');
    if(!parent) return;
    const debug=parent.querySelector('.debuggrid');
    if(!debug || document.getElementById('previewPointsV10')) return;
    const p=document.createElement('button');
    p.id='previewPointsV10';
    p.textContent='⭐ +300P';
    p.onclick=previewAddPointsV10;
    const r=document.createElement('button');
    r.id='previewResetGrowthV10';
    r.textContent='🥚 育成だけ初期化';
    r.onclick=previewResetGrowthV10;
    debug.append(p,r);
    const note=document.createElement('div');
    note.className='v10-debug-note';
    note.innerHTML='確認手順：<b>+300P</b> → 育成 → ショップで購入 → 「もちもの」からあげる。<br>1回 / 5回 / 12回 / 25回で見た目が成長します。';
    debug.parentElement.appendChild(note);
  }

  const oldPetroom=petroom;
  petroom=function(){
    oldPetroom();
    if($('petvis2')) $('petvis2').innerHTML=petSvg();
    renderEvolutionGuide();
  };

  const oldHome=home;
  home=function(){
    oldHome();
    if($('petvis')) $('petvis').innerHTML=petSvg();
  };

  const oldParent=parent;
  parent=function(){
    oldParent();
    addDebugButtons();
  };

  injectV10Styles();
  addDebugButtons();
  renderEvolutionGuide();
  if($('petvis')) $('petvis').innerHTML=petSvg();
  if($('petvis2')) $('petvis2').innerHTML=petSvg();
})();