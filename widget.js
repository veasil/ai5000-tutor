// 小伍 help widget — orange / honeycomb. Injected on every page.
(function () {
  var AVA = 'assets/wu-13.png';

  var fab = document.createElement('div');
  fab.className = 'wu-fab';
  fab.innerHTML =
    '<div class="wu-tip">Hi～有什么问题都可以来问小伍！</div>' +
    '<button class="wu-btn" id="wuToggle" aria-label="问小伍"><img src="' + AVA + '" alt="小伍"></button>';

  var chat = document.createElement('div');
  chat.className = 'wu-chat';
  chat.id = 'wuChat';
  chat.innerHTML =
    '<div class="wu-head">' +
      '<span class="hexdeco" style="right:-6px;top:-8px"></span>' +
      '<span class="hexdeco" style="right:22px;top:14px;width:18px;height:21px"></span>' +
      '<span class="hexdeco" style="right:54px;top:-12px;width:16px;height:19px"></span>' +
      '<img class="ha" src="' + AVA + '" alt="小伍">' +
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
    '<div class="wu-input"><input id="wuText" placeholder="把你的问题告诉小伍…" /><button class="wu-send" id="wuSend">发送</button></div>';

  document.body.appendChild(chat);
  document.body.appendChild(fab);

  var body = chat.querySelector('#wuBody');
  function open(){ chat.classList.add('open'); }
  function close(){ chat.classList.remove('open'); }
  function toggle(){ chat.classList.toggle('open'); }
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

  document.getElementById('wuToggle').addEventListener('click', toggle);
  document.getElementById('wuClose').addEventListener('click', close);
  chat.querySelectorAll('.wu-chip').forEach(function(c){ c.addEventListener('click', function(){ ask(c.textContent); }); });
  var input = document.getElementById('wuText');
  function send(){ var v=input.value.trim(); if(!v) return; ask(v); input.value=''; }
  document.getElementById('wuSend').addEventListener('click', send);
  input.addEventListener('keydown', function(e){ if(e.key==='Enter') send(); });
})();
