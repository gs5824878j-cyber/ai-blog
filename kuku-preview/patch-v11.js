// v11: 成長差を大きく・育成中キャラを常時表示・アイテムアクション・進化演出
(function(){
  const ITEM_META={
    food:{name:'ごはん',emoji:'🍙',care:'food',say:'もぐもぐ…おいしい！'},
    toy:{name:'おもちゃ',emoji:'🟢',care:'play',say:'わーい！あそぼう！'},
    book:{name:'えほん',emoji:'📖',care:'study',say:'ふむふむ…おもしろい！'}
  };
  const STAGES=['たまご','あかちゃん','こども','せいちょう','おとな'];
  const THRESHOLDS={たまご:0,あかちゃん:1,こども:5,せいちょう:12,おとな:25};

  function injectV11Styles(){
    if(document.getElementById('v11style'))return;
    const s=document.createElement('style');
    s.id='v11style';
    s.textContent=`
      #petroom{position:relative}
      #careDockV11{
        position:sticky;top:8px;z-index:18;margin:8px 0 14px;
        background:rgba(255,252,245,.96);backdrop-filter:blur(10px);
        border:1px solid #eadbc8;border-radius:20px;padding:10px 12px;
        box-shadow:0 8px 25px rgba(72,52,34,.13);
        display:grid;grid-template-columns:112px 1fr;align-items:center;gap:10px;
      }
      #careDockPetV11{height:108px;display:flex;align-items:center;justify-content:center;position:relative}
      #careDockPetV11 svg{width:112px;height:108px;overflow:visible}
      #careDockV11 .care-title{font-size:17px;font-weight:900}
      #careDockV11 .care-stage{font-size:12px;color:#806f61;margin-top:2px}
      #careDockV11 .care-speech{margin-top:7px;background:#fff;border:1px solid #eadfce;border-radius:14px;padding:7px 9px;font-size:12px;font-weight:700;min-height:18px}
      #careDockV11.care-food #careDockPetV11{animation:v11nom .36s ease-in-out 4}
      #careDockV11.care-book #careDockPetV11{animation:v11read .7s ease-in-out 2}
      #careDockV11.care-toy #careDockPetV11{animation:v11jump .42s ease-in-out 4}
      #careItemFxV11{position:absolute;left:50%;top:50%;font-size:42px;z-index:5;pointer-events:none;opacity:0}
      #careDockV11.care-food #careItemFxV11{opacity:1;animation:v11food 1.8s ease-in-out forwards}
      #careDockV11.care-book #careItemFxV11{opacity:1;font-size:48px;animation:v11book 1.8s ease-in-out forwards}
      #careDockV11.care-toy #careItemFxV11{opacity:1;animation:v11toy 1.8s ease-in-out forwards}
      @keyframes v11nom{0%,100%{transform:scale(1)}50%{transform:scale(.97) translateY(2px)}}
      @keyframes v11read{0%,100%{transform:rotate(0)}50%{transform:rotate(-2deg)}}
      @keyframes v11jump{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
      @keyframes v11food{0%{transform:translate(55px,35px) scale(.8);opacity:0}20%{opacity:1}70%{transform:translate(7px,-2px) scale(.72);opacity:1}100%{transform:translate(4px,-6px) scale(.25);opacity:0}}
      @keyframes v11book{0%{transform:translate(-50%,60px) scale(.45);opacity:0}25%{opacity:1}55%,85%{transform:translate(-50%,26px) scale(1);opacity:1}100%{transform:translate(-50%,26px) scale(.9);opacity:0}}
      @keyframes v11toy{0%{transform:translate(-70px,45px) scale(.7);opacity:0}18%{opacity:1}40%{transform:translate(-15px,-25px) scale(1)}65%{transform:translate(30px,40px) scale(.85)}88%{transform:translate(50px,-5px) scale(.75);opacity:1}100%{opacity:0}}
      .v11-pet{filter:drop-shadow(0 10px 13px rgba(52,39,29,.18))}
      .v11-pet .blink{transform-origin:center;animation:v11blink 4.8s infinite}
      .v11-pet .breathe{transform-origin:center;animation:v11breathe 3.2s ease-in-out infinite}
      .v11-pet .tail{transform-origin:165px 145px;animation:v11tail 2.4s ease-in-out infinite}
      @keyframes v11blink{0%,47%,50%,100%{transform:scaleY(1)}48%,49%{transform:scaleY(.08)}}
      @keyframes v11breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.018)}}
      @keyframes v11tail{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(9deg)}}
      #evoOverlayV11{position:fixed;inset:0;z-index:999;background:rgba(34,27,22,.82);display:none;align-items:center;justify-content:center;padding:22px}
      #evoOverlayV11.show{display:flex}
      #evoOverlayV11 .evo-box{width:min(420px,94vw);background:linear-gradient(180deg,#fffdf7,#fff4d9);border-radius:28px;padding:20px;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.35);animation:v11evo .5s cubic-bezier(.2,.9,.25,1.25)}
      #evoOverlayV11 .evo-stars{font-size:28px;letter-spacing:8px;animation:v11spark .8s ease-in-out infinite alternate}
      #evoOverlayV11 .evo-pet{height:250px;display:flex;align-items:center;justify-content:center}
      #evoOverlayV11 .evo-pet svg{width:260px;height:245px}
      #evoOverlayV11 .evo-title{font-size:28px;font-weight:1000;margin-top:-4px}
      #evoOverlayV11 .evo-fromto{font-size:15px;color:#795d3d;margin:6px 0 12px;font-weight:800}
      @keyframes v11evo{from{transform:scale(.65);opacity:0}to{transform:scale(1);opacity:1}}
      @keyframes v11spark{from{transform:scale(.92)}to{transform:scale(1.08)}}
      #parent .v11-debug-btn{font-weight:800}
      @media(max-width:520px){
        #careDockV11{grid-template-columns:94px 1fr;padding:8px 10px;top:6px}
        #careDockPetV11,#careDockPetV11 svg{width:94px;height:92px}
      }
    `;
    document.head.appendChild(s);
  }

  function cfg(){
    const b=branch();
    if(b && typeof RO!=='undefined' && RO[b])return RO[b];
    return {c1:'#d9ad72',c2:'#8b6040',mark:''};
  }
  function stageIndex(){return Math.max(0,STAGES.indexOf(stage().n));}
  function typeMark(){
    const b=branch();
    if(b==='study')return '📘';
    if(b==='play')return '⚡';
    if(b==='food')return '🌱';
    if(b==='balance')return '🌟';
    return '';
  }

  function egg(sp){
    const crack=sp==='dino'?'#6e9561':sp==='human'?'#c88767':'#98683d';
    return `<svg class="pet-anim v11-pet" viewBox="0 0 260 240">
      <defs><radialGradient id="e11" cx="34%" cy="25%"><stop offset="0" stop-color="#fffef8"/><stop offset=".48" stop-color="#f4e2b5"/><stop offset="1" stop-color="#d6ad62"/></radialGradient></defs>
      <ellipse cx="130" cy="216" rx="70" ry="12" fill="#604b37" opacity=".13"/>
      <path d="M130 25 C85 25 58 78 61 140 C63 191 89 211 130 211 C171 211 197 191 199 140 C202 78 175 25 130 25Z" fill="url(#e11)" stroke="#806745" stroke-width="4"/>
      <path d="M84 92 l19-12 14 14 19-15 17 14 20-10" fill="none" stroke="${crack}" stroke-width="5" stroke-linecap="round" opacity=".7"/>
      <ellipse cx="101" cy="73" rx="16" ry="31" fill="#fff" opacity=".34" transform="rotate(18 101 73)"/>
      <path d="M111 159 l13-11 12 12 15-9" fill="none" stroke="#9a7d56" stroke-width="4" opacity=".55"/>
    </svg>`;
  }

  function animal(idx,c){
    const mark=typeMark();
    if(idx===1) return `<svg class="pet-anim v11-pet" viewBox="0 0 260 240">
      <defs><radialGradient id="a11b" cx="35%" cy="20%"><stop stop-color="#fff" stop-opacity=".45"/><stop offset=".22" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></radialGradient></defs>
      <ellipse cx="130" cy="213" rx="54" ry="10" fill="#493d34" opacity=".13"/>
      <g class="breathe"><ellipse cx="130" cy="150" rx="50" ry="48" fill="url(#a11b)"/>
      <circle cx="130" cy="91" r="50" fill="url(#a11b)"/>
      <path d="M92 66 L83 28 L115 52Z M168 66 L177 28 L145 52Z" fill="${c.c1}" stroke="#66503d" stroke-width="4"/>
      <path d="M92 56 L88 39 L107 53Z M168 56 L172 39 L153 53Z" fill="#d99f95" opacity=".7"/>
      <g class="blink"><circle cx="111" cy="92" r="7" fill="#201c19"/><circle cx="149" cy="92" r="7" fill="#201c19"/><circle cx="109" cy="89" r="2" fill="#fff"/><circle cx="147" cy="89" r="2" fill="#fff"/></g>
      <ellipse cx="130" cy="115" rx="25" ry="20" fill="#eedbc4"/><path d="M125 110 Q130 105 135 110 Q130 116 125 110" fill="#4a3830"/>
      <path d="M112 164 q-25 23-8 39 M148 164 q25 23 8 39" fill="none" stroke="${c.c2}" stroke-width="22" stroke-linecap="round"/>
      </g></svg>`;

    if(idx===2) return `<svg class="pet-anim v11-pet" viewBox="0 0 280 245">
      <defs><radialGradient id="a11c" cx="34%" cy="18%"><stop stop-color="#fff" stop-opacity=".35"/><stop offset=".2" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></radialGradient></defs>
      <ellipse cx="140" cy="220" rx="72" ry="10" fill="#44382f" opacity=".14"/>
      <path class="tail" d="M184 154 Q245 125 249 165 Q239 198 188 184" fill="none" stroke="${c.c2}" stroke-width="21" stroke-linecap="round"/>
      <g class="breathe"><ellipse cx="139" cy="155" rx="61" ry="48" fill="url(#a11c)"/>
      <ellipse cx="130" cy="86" rx="52" ry="48" fill="url(#a11c)"/>
      <path d="M91 63 L79 19 L118 49Z M169 63 L181 19 L142 49Z" fill="${c.c1}" stroke="#5b4738" stroke-width="4"/>
      <g class="blink"><ellipse cx="110" cy="86" rx="7" ry="9" fill="#1f1c19"/><ellipse cx="150" cy="86" rx="7" ry="9" fill="#1f1c19"/></g>
      <ellipse cx="130" cy="111" rx="27" ry="21" fill="#ead5bb"/><path d="M124 106 Q130 101 136 106 Q130 114 124 106" fill="#49372f"/>
      <path d="M100 175 L84 210 M174 174 L191 210" stroke="${c.c2}" stroke-width="18" stroke-linecap="round"/>
      <path d="M76 211 h26 M180 211 h26" stroke="#4e4037" stroke-width="6" stroke-linecap="round"/>
      <text x="140" y="155" text-anchor="middle" font-size="25">${mark}</text></g></svg>`;

    if(idx===3) return `<svg class="pet-anim v11-pet" viewBox="0 0 300 250">
      <defs><linearGradient id="a11t" x1="0" x2="1"><stop stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></linearGradient></defs>
      <ellipse cx="150" cy="226" rx="82" ry="10" fill="#44372f" opacity=".14"/>
      <path class="tail" d="M205 145 Q276 113 280 159 Q269 197 214 183" fill="none" stroke="${c.c2}" stroke-width="19" stroke-linecap="round"/>
      <g class="breathe"><ellipse cx="155" cy="153" rx="66" ry="48" fill="url(#a11t)"/>
      <ellipse cx="133" cy="80" rx="51" ry="45" fill="url(#a11t)"/>
      <path d="M96 59 L91 17 L121 50Z M169 58 L180 16 L147 48Z" fill="${c.c1}" stroke="#594436" stroke-width="4"/>
      <path d="M107 67 Q132 51 157 66" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="6"/>
      <g class="blink"><ellipse cx="115" cy="82" rx="7" ry="9" fill="#191817"/><ellipse cx="151" cy="82" rx="7" ry="9" fill="#191817"/></g>
      <ellipse cx="133" cy="105" rx="26" ry="19" fill="#ead5bc"/><path d="M127 101 Q133 96 139 101 Q133 109 127 101" fill="#44332d"/>
      <path d="M111 174 L90 218 M183 173 L206 218" stroke="${c.c2}" stroke-width="16" stroke-linecap="round"/>
      <path d="M80 220 h28 M195 220 h29" stroke="#413730" stroke-width="6" stroke-linecap="round"/>
      <path d="M111 132 Q153 147 190 126" fill="none" stroke="#fff" stroke-opacity=".15" stroke-width="8"/>
      <text x="158" y="153" text-anchor="middle" font-size="28">${mark}</text></g></svg>`;

    return `<svg class="pet-anim v11-pet" viewBox="0 0 320 260">
      <defs><linearGradient id="a11a" x1="0" x2="1"><stop stop-color="${c.c1}"/><stop offset=".62" stop-color="${c.c2}"/><stop offset="1" stop-color="#554132"/></linearGradient></defs>
      <ellipse cx="160" cy="238" rx="90" ry="11" fill="#3e332d" opacity=".16"/>
      <path class="tail" d="M218 151 Q302 104 304 157 Q291 205 226 187" fill="none" stroke="${c.c2}" stroke-width="20" stroke-linecap="round"/>
      <g class="breathe"><ellipse cx="165" cy="157" rx="72" ry="52" fill="url(#a11a)"/>
      <ellipse cx="139" cy="77" rx="54" ry="46" fill="url(#a11a)"/>
      <path d="M99 56 L91 8 L128 47Z M177 55 L190 8 L153 46Z" fill="${c.c1}" stroke="#4d3d33" stroke-width="4"/>
      <path d="M105 60 Q140 40 174 61" fill="none" stroke="#3e3029" stroke-opacity=".25" stroke-width="10"/>
      <g class="blink"><ellipse cx="120" cy="78" rx="7" ry="9" fill="#151412"/><ellipse cx="159" cy="78" rx="7" ry="9" fill="#151412"/><circle cx="118" cy="75" r="2" fill="#fff"/><circle cx="157" cy="75" r="2" fill="#fff"/></g>
      <ellipse cx="140" cy="104" rx="27" ry="20" fill="#e8d2b5"/><path d="M134 99 Q140 94 146 99 Q140 108 134 99" fill="#42322b"/>
      <path d="M116 181 L91 229 M194 180 L221 229" stroke="${c.c2}" stroke-width="17" stroke-linecap="round"/>
      <path d="M79 231 h31 M209 231 h32" stroke="#372f2a" stroke-width="7" stroke-linecap="round"/>
      <path d="M108 127 Q166 151 209 122" fill="none" stroke="#f2d791" stroke-width="7" stroke-linecap="round" opacity=".65"/>
      <text x="169" y="158" text-anchor="middle" font-size="31">${mark}</text></g></svg>`;
  }

  function dino(idx,c){
    const mark=typeMark();
    if(idx===1) return `<svg class="pet-anim v11-pet" viewBox="0 0 270 245">
      <defs><radialGradient id="d11b" cx="34%" cy="20%"><stop stop-color="#fff" stop-opacity=".35"/><stop offset=".2" stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></radialGradient></defs>
      <ellipse cx="135" cy="220" rx="58" ry="10" fill="#403a33" opacity=".14"/>
      <g class="breathe"><ellipse cx="137" cy="154" rx="48" ry="52" fill="url(#d11b)"/><ellipse cx="119" cy="91" rx="48" ry="43" fill="url(#d11b)"/>
      <path d="M124 81 Q164 73 183 88 Q165 100 124 101" fill="${c.c1}" stroke="#51483d" stroke-width="3"/>
      <g class="blink"><circle cx="104" cy="86" r="7" fill="#191817"/><circle cx="102" cy="83" r="2" fill="#fff"/></g>
      <path d="M86 134 q-22 14-25 28 M113 133 q-10 19-2 30" fill="none" stroke="${c.c2}" stroke-width="8" stroke-linecap="round"/>
      <path d="M117 178 l-14 34 M151 177 l16 34" stroke="${c.c2}" stroke-width="19" stroke-linecap="round"/>
      <path d="M94 213 h26 M154 213 h28" stroke="#453d35" stroke-width="5" stroke-linecap="round"/>
      <path class="tail" d="M172 151 Q225 142 238 119 Q230 166 178 181" fill="${c.c2}" stroke="#51483d" stroke-width="3"/>
      <path d="M83 64 l10-18 9 18 10-20 10 20" fill="#c6b36a"/></g></svg>`;

    if(idx===2) return `<svg class="pet-anim v11-pet" viewBox="0 0 300 250">
      <defs><linearGradient id="d11c" x1="0" x2="1"><stop stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></linearGradient></defs>
      <ellipse cx="150" cy="228" rx="78" ry="10" fill="#3e382f" opacity=".14"/>
      <path class="tail" d="M188 159 Q261 143 285 113 Q274 172 197 191" fill="${c.c2}" stroke="#4d463c" stroke-width="3"/>
      <g class="breathe"><ellipse cx="153" cy="160" rx="59" ry="46" fill="url(#d11c)"/>
      <ellipse cx="122" cy="89" rx="47" ry="40" fill="url(#d11c)"/><path d="M124 76 Q172 66 205 84 Q172 104 122 102" fill="${c.c1}" stroke="#4d463c" stroke-width="3"/>
      <g class="blink"><ellipse cx="108" cy="83" rx="7" ry="9" fill="#171614"/></g><path d="M173 85 q10 5 19 0" fill="none" stroke="#51483e" stroke-width="3"/>
      <path d="M104 131 q-28 10-34 27 M126 132 q-17 18-8 31" fill="none" stroke="${c.c2}" stroke-width="8" stroke-linecap="round"/>
      <path d="M128 181 L111 220 M171 180 L190 220" stroke="${c.c2}" stroke-width="20" stroke-linecap="round"/>
      <path d="M98 221 h31 M177 221 h34" stroke="#413b34" stroke-width="6" stroke-linecap="round"/>
      <path d="M82 66 l10-22 10 20 11-24 11 22 10-19 10 24" fill="#d2bb66"/>
      <text x="157" y="163" text-anchor="middle" font-size="27">${mark}</text></g></svg>`;

    if(idx===3) return `<svg class="pet-anim v11-pet" viewBox="0 0 330 260">
      <defs><linearGradient id="d11t" x1="0" x2="1"><stop stop-color="${c.c1}"/><stop offset=".72" stop-color="${c.c2}"/><stop offset="1" stop-color="#46503f"/></linearGradient></defs>
      <ellipse cx="164" cy="237" rx="91" ry="11" fill="#39342f" opacity=".15"/>
      <path class="tail" d="M201 164 Q286 137 323 91 Q307 172 213 200" fill="url(#d11t)" stroke="#443e37" stroke-width="3"/>
      <g class="breathe"><ellipse cx="164" cy="166" rx="65" ry="47" fill="url(#d11t)"/>
      <ellipse cx="124" cy="86" rx="50" ry="42" fill="url(#d11t)"/><path d="M128 72 Q184 56 225 81 Q190 105 124 103" fill="${c.c1}" stroke="#443e37" stroke-width="3"/>
      <g class="blink"><ellipse cx="109" cy="81" rx="7" ry="9" fill="#151412"/></g><path d="M190 82 q11 5 20 0" fill="none" stroke="#4c443b" stroke-width="3"/>
      <path d="M104 132 q-34 8-43 25 M132 133 q-25 16-17 32" fill="none" stroke="${c.c2}" stroke-width="9" stroke-linecap="round"/>
      <path d="M136 188 L113 229 M183 187 L208 229" stroke="${c.c2}" stroke-width="22" stroke-linecap="round"/>
      <path d="M98 231 h36 M193 231 h38" stroke="#3d3731" stroke-width="7" stroke-linecap="round"/>
      <path d="M75 63 l11-24 11 22 12-26 12 25 11-23 12 25 12-19 9 23" fill="#d6b958"/>
      <text x="168" y="170" text-anchor="middle" font-size="30">${mark}</text></g></svg>`;

    return `<svg class="pet-anim v11-pet" viewBox="0 0 360 275">
      <defs><linearGradient id="d11a" x1="0" x2="1"><stop stop-color="${c.c1}"/><stop offset=".68" stop-color="${c.c2}"/><stop offset="1" stop-color="#344235"/></linearGradient></defs>
      <ellipse cx="180" cy="251" rx="105" ry="12" fill="#342f2b" opacity=".17"/>
      <path class="tail" d="M221 176 Q313 137 354 69 Q339 180 235 219" fill="url(#d11a)" stroke="#3f3a34" stroke-width="4"/>
      <g class="breathe"><ellipse cx="181" cy="176" rx="73" ry="52" fill="url(#d11a)"/>
      <ellipse cx="129" cy="84" rx="54" ry="45" fill="url(#d11a)"/><path d="M134 68 Q201 49 251 80 Q208 111 129 104" fill="${c.c1}" stroke="#3f3a34" stroke-width="4"/>
      <g class="blink"><ellipse cx="112" cy="78" rx="8" ry="10" fill="#111"/><circle cx="110" cy="75" r="2" fill="#fff"/></g><path d="M211 81 q14 6 26 0" fill="none" stroke="#453f38" stroke-width="3"/>
      <path d="M107 136 q-42 5-56 28 M140 137 q-29 14-25 35" fill="none" stroke="${c.c2}" stroke-width="10" stroke-linecap="round"/>
      <path d="M150 201 L120 243 M202 200 L232 243" stroke="${c.c2}" stroke-width="24" stroke-linecap="round"/>
      <path d="M102 245 h42 M214 245 h43" stroke="#342f2b" stroke-width="8" stroke-linecap="round"/>
      <path d="M74 59 l13-28 13 25 14-31 14 29 13-27 14 28 13-24 13 27" fill="#d8b552"/>
      <path d="M146 121 Q195 135 232 111" fill="none" stroke="#f0d180" stroke-width="8" opacity=".45"/>
      <text x="184" y="181" text-anchor="middle" font-size="34">${mark}</text></g></svg>`;
  }

  function human(idx,c){
    const mark=typeMark();
    if(idx===1) return `<svg class="pet-anim v11-pet" viewBox="0 0 260 245">
      <defs><radialGradient id="h11b" cx="35%" cy="22%"><stop stop-color="#fff7ef"/><stop offset=".7" stop-color="#efbf99"/><stop offset="1" stop-color="#d99770"/></radialGradient></defs>
      <ellipse cx="130" cy="220" rx="54" ry="9" fill="#403832" opacity=".12"/>
      <g class="breathe"><ellipse cx="130" cy="88" rx="48" ry="51" fill="url(#h11b)"/>
      <path d="M83 82 Q84 38 130 33 Q174 34 178 84 Q152 59 126 60 Q102 59 83 82" fill="#49332a"/>
      <g class="blink"><circle cx="112" cy="91" r="6" fill="#27211d"/><circle cx="148" cy="91" r="6" fill="#27211d"/></g>
      <path d="M118 113 Q130 120 142 113" fill="none" stroke="#9d684f" stroke-width="3" stroke-linecap="round"/>
      <rect x="89" y="136" width="82" height="54" rx="28" fill="${c.c1}"/>
      <path d="M101 183 Q86 201 81 214 M159 183 Q174 201 179 214" stroke="#dfaa83" stroke-width="17" stroke-linecap="round"/>
      </g></svg>`;

    if(idx===2) return `<svg class="pet-anim v11-pet" viewBox="0 0 270 250">
      <defs><radialGradient id="h11c" cx="35%" cy="22%"><stop stop-color="#fff7ef"/><stop offset=".7" stop-color="#efbf99"/><stop offset="1" stop-color="#d99770"/></radialGradient><linearGradient id="h11cs" x1="0" x2="1"><stop stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></linearGradient></defs>
      <ellipse cx="135" cy="228" rx="62" ry="9" fill="#3f3833" opacity=".13"/>
      <g class="breathe"><ellipse cx="135" cy="78" rx="44" ry="47" fill="url(#h11c)"/>
      <path d="M92 72 Q95 31 136 29 Q176 31 179 74 Q157 54 134 54 Q111 53 92 72" fill="#453128"/>
      <g class="blink"><ellipse cx="119" cy="80" rx="5.5" ry="7" fill="#28211c"/><ellipse cx="151" cy="80" rx="5.5" ry="7" fill="#28211c"/></g>
      <path d="M123 100 Q135 108 147 100" fill="none" stroke="#9d674f" stroke-width="3"/>
      <rect x="94" y="121" width="82" height="66" rx="24" fill="url(#h11cs)"/>
      <path d="M96 138 Q71 150 65 173 M174 138 Q198 150 205 173" stroke="#e4ad85" stroke-width="14" stroke-linecap="round"/>
      <path d="M114 181 L101 222 M155 181 L169 222" stroke="#4a4541" stroke-width="18" stroke-linecap="round"/>
      <text x="135" y="151" text-anchor="middle" font-size="24">${mark}</text></g></svg>`;

    if(idx===3) return `<svg class="pet-anim v11-pet" viewBox="0 0 285 260">
      <defs><radialGradient id="h11t" cx="35%" cy="20%"><stop stop-color="#fff7ef"/><stop offset=".72" stop-color="#edb991"/><stop offset="1" stop-color="#cf8f68"/></radialGradient><linearGradient id="h11ts" x1="0" x2="1"><stop stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></linearGradient></defs>
      <ellipse cx="142" cy="239" rx="67" ry="10" fill="#3b3430" opacity=".14"/>
      <g class="breathe"><ellipse cx="142" cy="70" rx="42" ry="45" fill="url(#h11t)"/>
      <path d="M101 66 Q105 24 143 22 Q182 24 185 68 Q162 47 140 48 Q119 46 101 66" fill="#382921"/>
      <path d="M108 44 Q139 27 174 44" fill="none" stroke="#654735" stroke-width="6" opacity=".45"/>
      <g class="blink"><ellipse cx="127" cy="72" rx="5" ry="7" fill="#231e1a"/><ellipse cx="158" cy="72" rx="5" ry="7" fill="#231e1a"/></g>
      <path d="M130 92 Q142 100 154 92" fill="none" stroke="#98624b" stroke-width="3"/>
      <path d="M105 115 Q142 101 179 115 L174 184 Q142 195 110 184Z" fill="url(#h11ts)"/>
      <path d="M109 129 Q78 143 70 173 M176 129 Q207 143 215 173" stroke="#dfaa83" stroke-width="13" stroke-linecap="round"/>
      <path d="M122 183 L105 232 M163 183 L180 232" stroke="#3f3c3a" stroke-width="17" stroke-linecap="round"/>
      <text x="142" y="145" text-anchor="middle" font-size="26">${mark}</text></g></svg>`;

    return `<svg class="pet-anim v11-pet" viewBox="0 0 300 270">
      <defs><radialGradient id="h11a" cx="35%" cy="20%"><stop stop-color="#fff7ef"/><stop offset=".72" stop-color="#ebb58d"/><stop offset="1" stop-color="#ca8963"/></radialGradient><linearGradient id="h11as" x1="0" x2="1"><stop stop-color="${c.c1}"/><stop offset="1" stop-color="${c.c2}"/></linearGradient></defs>
      <ellipse cx="150" cy="250" rx="72" ry="10" fill="#36302c" opacity=".15"/>
      <g class="breathe"><ellipse cx="150" cy="66" rx="41" ry="44" fill="url(#h11a)"/>
      <path d="M111 62 Q117 19 151 18 Q188 19 191 64 Q170 42 149 43 Q129 41 111 62" fill="#30231e"/>
      <path d="M121 38 Q151 21 180 39" fill="none" stroke="#654735" stroke-width="7" opacity=".38"/>
      <g class="blink"><ellipse cx="136" cy="68" rx="5" ry="7" fill="#201b18"/><ellipse cx="165" cy="68" rx="5" ry="7" fill="#201b18"/></g>
      <path d="M138 88 Q150 95 162 88" fill="none" stroke="#925f49" stroke-width="3"/>
      <path d="M111 109 Q150 94 189 109 L183 191 Q150 204 117 191Z" fill="url(#h11as)"/>
      <path d="M115 126 Q80 143 70 178 M185 126 Q220 143 230 178" stroke="#dba47d" stroke-width="13" stroke-linecap="round"/>
      <path d="M131 189 L108 242 M169 189 L192 242" stroke="#363432" stroke-width="18" stroke-linecap="round"/>
      <path d="M99 244 h30 M180 244 h31" stroke="#242321" stroke-width="7" stroke-linecap="round"/>
      <text x="150" y="146" text-anchor="middle" font-size="29">${mark}</text></g></svg>`;
  }

  petSvg=function(){
    injectV11Styles();
    const sp=S.settings.species,idx=stageIndex(),c=cfg();
    if(idx===0)return egg(sp);
    if(sp==='dino')return dino(idx,c);
    if(sp==='human')return human(idx,c);
    return animal(idx,c);
  };

  function ensureCareDock(){
    const room=$('petroom');
    if(!room)return;
    let dock=document.getElementById('careDockV11');
    if(!dock){
      dock=document.createElement('div');
      dock.id='careDockV11';
      dock.innerHTML=`
        <div id="careDockPetV11"><div id="careItemFxV11"></div></div>
        <div>
          <div class="care-title" id="careDockNameV11"></div>
          <div class="care-stage" id="careDockStageV11"></div>
          <div class="care-speech" id="careDockSpeechV11">アイテムをあげると、ここで反応するよ。</div>
        </div>`;
      const point=document.getElementById('pointRule');
      const shop=document.getElementById('shop');
      if(point)point.before(dock);
      else if(shop)shop.before(dock);
      else room.prepend(dock);
    }
    renderCareDock();
  }

  function renderCareDock(message){
    const pet=document.getElementById('careDockPetV11');
    if(pet){
      let fx=document.getElementById('careItemFxV11');
      pet.innerHTML=petSvg()+'<div id="careItemFxV11"></div>';
      fx=document.getElementById('careItemFxV11');
    }
    const n=document.getElementById('careDockNameV11');
    const st=document.getElementById('careDockStageV11');
    const sp=document.getElementById('careDockSpeechV11');
    if(n)n.textContent=petName();
    if(st){
      const b=branch();
      const type=b&&typeof RO!=='undefined'&&RO[b]?('・'+RO[b].n):'';
      st.textContent=`${stage().n}${type} ／ おせわ ${S.pet.xp||0}回`;
    }
    if(sp && message)sp.textContent=message;
  }

  function ensureEvolutionOverlay(){
    if(document.getElementById('evoOverlayV11'))return;
    const o=document.createElement('div');
    o.id='evoOverlayV11';
    o.innerHTML=`<div class="evo-box">
      <div class="evo-stars">✨ ⭐ ✨</div>
      <div class="evo-pet" id="evoPetV11"></div>
      <div class="evo-title">しんかした！</div>
      <div class="evo-fromto" id="evoTextV11"></div>
      <button class="cta" onclick="closeEvolutionV11()">やった！</button>
    </div>`;
    document.body.appendChild(o);
  }
  window.closeEvolutionV11=function(){document.getElementById('evoOverlayV11')?.classList.remove('show');};

  function showEvolution(beforeStage,afterStage,beforeBranch,afterBranch){
    ensureEvolutionOverlay();
    const o=document.getElementById('evoOverlayV11');
    const p=document.getElementById('evoPetV11');
    const t=document.getElementById('evoTextV11');
    if(p)p.innerHTML=petSvg();
    const branchChanged=beforeBranch!==afterBranch&&afterBranch&&typeof RO!=='undefined'&&RO[afterBranch];
    let msg=beforeStage!==afterStage?`${beforeStage} → ${afterStage}`:`${afterStage}`;
    if(branchChanged)msg+=`　${RO[afterBranch].n}になった！`;
    if(t)t.textContent=msg;
    if(o)o.classList.add('show');
  }

  function playAction(k,then){
    ensureCareDock();
    const dock=document.getElementById('careDockV11');
    const fx=document.getElementById('careItemFxV11');
    const meta=ITEM_META[k];
    if(!dock||!fx||!meta){if(then)then();return;}
    dock.classList.remove('care-food','care-book','care-toy');
    void dock.offsetWidth;
    dock.classList.add('care-'+k);
    fx.textContent=k==='book'?'📖':meta.emoji;
    const speech=document.getElementById('careDockSpeechV11');
    if(speech)speech.textContent=k==='food'?'もぐもぐ…':k==='book'?'えほんを読んでるよ…':'あそんでるよ！';
    setTimeout(()=>{if(speech)speech.textContent=meta.say;},900);
    setTimeout(()=>{
      dock.classList.remove('care-food','care-book','care-toy');
      fx.textContent='';
      if(then)then();
    },1900);
  }

  useItem=function(k){
    const meta=ITEM_META[k];
    if(!meta||!S.pet.inv[k])return;
    const beforeStage=stage().n;
    const beforeBranch=branch();
    S.pet.inv[k]--;
    S.pet.xp=(S.pet.xp||0)+1;
    S.pet.care[meta.care]=(S.pet.care[meta.care]||0)+1;
    S.pet.branch=null;
    const afterBranch=branch();
    const afterStage=stage().n;
    S.pet.log.unshift(`${meta.name}をあげた`);
    save();

    // 先に新しい状態を画面に反映し、アクションを見せる
    petroom();
    home();
    renderCareDock();
    playAction(k,()=>{
      if(beforeStage!==afterStage || beforeBranch!==afterBranch){
        showEvolution(beforeStage,afterStage,beforeBranch,afterBranch);
      }
    });
  };

  function ensureDebug(){
    const parent=$('parent');
    if(!parent)return;
    const grid=parent.querySelector('.debuggrid');
    if(!grid)return;
    if(!document.getElementById('previewPointsV11')){
      const p=document.createElement('button');
      p.id='previewPointsV11';p.className='v11-debug-btn';p.textContent='⭐ +300P';
      p.onclick=()=>{
        S.coins=(S.coins||0)+300;S.pet.log.unshift('プレビュー用 +300P');save();home();petroom();
        modal('⭐','+300P','育成画面でアイテムを買って、アクションと進化を確認できます。');
      };
      grid.appendChild(p);
    }
    if(!document.getElementById('previewNextStageV11')){
      const b=document.createElement('button');
      b.id='previewNextStageV11';b.className='v11-debug-btn';b.textContent='⏩ 次の進化直前';
      b.onclick=()=>{
        const cur=stage().n;
        const i=STAGES.indexOf(cur);
        if(i<0||i>=STAGES.length-1){modal('🏆','すでにおとなです','「育成だけ初期化」で、たまごからもう一度確認できます。');return;}
        const next=STAGES[i+1];
        S.pet.xp=Math.max(0,THRESHOLDS[next]-1);
        if(S.pet.xp<5)S.pet.branch=null;
        save();petroom();home();
        modal('⏩','次の進化まであと1回',`次にアイテムを1つあげると「${next}」になります。`);
      };
      grid.appendChild(b);
    }
  }

  // v10/v7の描画後に、常時見える育成ドックと新キャラを再描画
  const prevPetroom=petroom;
  petroom=function(){
    prevPetroom();
    if($('petvis2'))$('petvis2').innerHTML=petSvg();
    ensureCareDock();
    renderCareDock();
  };

  const prevHome=home;
  home=function(){
    prevHome();
    if($('petvis'))$('petvis').innerHTML=petSvg();
  };

  const prevParent=parent;
  parent=function(){prevParent();ensureDebug();};

  injectV11Styles();
  ensureEvolutionOverlay();
  ensureDebug();
  if($('petvis'))$('petvis').innerHTML=petSvg();
  if($('petvis2'))$('petvis2').innerHTML=petSvg();
  ensureCareDock();
})();