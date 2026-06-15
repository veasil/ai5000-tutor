// 小伍 help widget — orange / honeycomb, draggable on desktop. Injected on every page.
(function () {
  var AVA = 'assets/wu-13.png';

  var root = document.createElement('div');
  root.className = 'wu-root';
  root.innerHTML =
    '<div class="wu-chat" id="wuChat">' +
      '<div class="wu-head">' +
        '<span class="hexdeco" style="right:-6px;top:-8px"></span>' +
        '<span class="hexdeco" style="right:22px;top:14px;width:18px;height:21px"></span>' +
        '<span class="hexdeco" style="right:54px;top:-12px;width:16px;height:19px"></span>' +
        '<span class="ha"></span>' +
        '<div class="htxt"><div class="ht">小伍</div><div class="hs">● 在线 · 随时帮你</div></div>' +
        '<button class="hx" id="wuClose" aria-label="关闭">×</button>' +
      '</div>' +
      '<div class="wu-body" id="wuBody">' +
        '<div class="wu-msg">嗨，我是小伍！闯关卡住、不知道写什么、或者想确认安全，都可以问我 🐝</div>' +
        '<div class="wu-chips">' +
          '<span class="wu-chip">这一关要做什么？</span>' +
          '<span class="wu-chip">灵感卡怎么写？</span>' +
          '<span class="wu-chip">我能填真名吗？</span>' +
        '</div>' +
      '</div>' +
      '<div class="wu-input"><input id="wuText" placeholder="把你的问题告诉小伍…" /><button class="wu-send" id="wuSend">发送</button></div>' +
    '</div>' +
    '<div class="wu-fab">' +
      '<div class="wu-tip">Hi～有什么问题都可以来问小伍！</div>' +
      '<button class="wu-btn" id="wuToggle" aria-label="问小伍"><span class="face"></span></button>' +
    '</div>';
  document.body.appendChild(root);

  var chat = root.querySelector('#wuChat');
  var btn = root.querySelector('#wuToggle');
  var body = root.querySelector('#wuBody');

  function toggle(){ chat.classList.toggle('open'); }
  function close(){ chat.classList.remove('open'); }
  function reply(t){
    var m = document.createElement('div'); m.className='wu-msg'; m.textContent=t;
    body.appendChild(m); body.scrollTop = body.scrollHeight;
  }
  function ask(q){
    var u = document.createElement('div');
    u.className='wu-msg'; u.style.alignSelf='flex-end';
    u.style.background='var(--ink)'; u.style.color='#fff'; u.style.borderTopLeftRadius='14px'; u.style.borderTopRightRadius='4px';
    u.textContent=q; body.appendChild(u); body.scrollTop=body.scrollHeight;
    var ans = {
      '这一关要做什么？':'第 4 关「灵感捕手」：先回顾你在脑洞发射台想到的点子，再从生活里补满 3 张灵感卡，最后挑 1 张凝练成你的作品点子～',
      '灵感卡怎么写？':'灵感卡 = 「我看到的」+「我希望」。比如：我看到奶奶看不清药盒上的字；我希望有个东西能念给她听。',
      '我能填真名吗？':'不用哦！为了保护大家，写成「一位同学」「我的家人」就好，别写真名、学校和地址 🛡️'
    };
    setTimeout(function(){ reply(ans[q] || '这个问题我记下啦，先试着自己写一点，卡住随时再叫我！'); }, 350);
  }

  root.querySelector('#wuClose').addEventListener('click', close);
  root.querySelectorAll('.wu-chip').forEach(function(c){ c.addEventListener('click', function(){ ask(c.textContent); }); });
  var input = root.querySelector('#wuText');
  function send(){ var v=input.value.trim(); if(!v) return; ask(v); input.value=''; }
  root.querySelector('#wuSend').addEventListener('click', send);
  input.addEventListener('keydown', function(e){ if(e.key==='Enter') send(); });

  // ----- 桌面端可拖拽 -----
  var dragging=false, moved=false, sx=0, sy=0, ox=0, oy=0;
  btn.addEventListener('mousedown', function(e){
    if (window.innerWidth <= 900) return;          // 仅桌面
    dragging=true; moved=false; sx=e.clientX; sy=e.clientY;
    var r=root.getBoundingClientRect(); ox=r.left; oy=r.top;
    root.style.left=ox+'px'; root.style.top=oy+'px'; root.style.right='auto'; root.style.bottom='auto';
    btn.classList.add('dragging'); document.body.style.userSelect='none';
    e.preventDefault();
  });
  window.addEventListener('mousemove', function(e){
    if(!dragging) return;
    var dx=e.clientX-sx, dy=e.clientY-sy;
    if(Math.abs(dx)>4 || Math.abs(dy)>4) moved=true;
    var w=btn.offsetWidth, h=btn.offsetHeight;
    var nx=Math.max(8, Math.min(window.innerWidth-w-8, ox+dx));
    var ny=Math.max(8, Math.min(window.innerHeight-h-8, oy+dy));
    root.style.left=nx+'px'; root.style.top=ny+'px';
  });
  window.addEventListener('mouseup', function(){
    if(!dragging) return;
    dragging=false; btn.classList.remove('dragging'); document.body.style.userSelect='';
  });
  btn.addEventListener('click', function(){ if(moved){ moved=false; return; } toggle(); });
})();
