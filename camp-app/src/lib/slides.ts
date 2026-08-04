// 创客营全天 5 板块内容定义
// 内容源：【0803更新】创客营全天流程.md
// 每板块 = 知识点 panel + 动手挑战 panel

export type FieldBase = {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
};

export type ChipField = FieldBase & {
  type: "chips";
  options: string[];
  max?: number; // 最多选几个
};

export type TextField = FieldBase & {
  type: "textarea" | "input" | "url";
  placeholder?: string;
  maxLength?: number;
};

export type CardField = FieldBase & {
  type: "cards";
  cards: { id: string; title: string; sub: string; color: "mint" | "violet" | "orange"; icon: string; placeholder: string; maxLength?: number }[];
};

export type FileField = FieldBase & {
  type: "file";
  accept?: string;
};

export type Field = ChipField | TextField | CardField | FileField;

export type FlowItem = { icon: string; title: string; desc: string; color: "mint" | "violet" | "orange" };

export type Slide = {
  id: string;
  module: string; // "模块 01"
  power: string; // 五力名
  title: string; // 板块标题
  subtitle: string; // 副标题
  knowledge: {
    intro: string;
    flow?: FlowItem[];
    bullets?: string[]; // 知识点要点列表
  };
  challenge: {
    title: string;
    desc: string;
    fields: Field[];
  };
};

// ========================================
// 32 议题池（用户确认分类）
// ========================================
export const ISSUES_POOL = {
  身体安全: ["明目与正姿", "睡眠剥夺", "脑健康", "危险行为习得"],
  心理安全: ["不良内容创作", "恐怖暴力内容", "网络成瘾", "自残自杀", "网络占卜", "软色情内容", "邪典内容"],
  社交安全: ["隐私泄露", "不良社群", "现实社交退化", "网络霸凌", "社交欺诈", "隔空猥亵"],
  经济安全: ["高额消费", "高风险消费", "网络赌博", "网络兼职", "广告陷阱", "网络诈骗"],
  数字权益: ["网络隐私泄露", "平台过度收集数据", "信息茧房", "算法偏见", "数据不透明", "物联网设备安全", "数据剥夺", "利用儿童的不良商业行为", "青少年漏洞"],
};

// 扁平化议题列表（供 chips 使用）
export const ALL_ISSUES = Object.values(ISSUES_POOL).flat();

export const slides: Slide[] = [
  // ============================================================
  // 板块 1 · 安全力
  // ============================================================
  {
    id: "safety",
    module: "模块 01",
    power: "安全力",
    title: "安全力觉醒：看见五大风险",
    subtitle: "认识身体、心理、社交、经济、数字权益五大风险域，覆盖 32 个数智安全议题。",
    knowledge: {
      intro:
        "安全力，就是我们用桌游认识到社会中的数智问题——安全力规定了整个工作坊要讨论的议题范围。上午先发现问题、锁定议题、找到切口，为下午开发做准备。",
      flow: [
        { icon: "", title: "身体安全", desc: "明目与正姿、睡眠剥夺、脑健康、危险行为习得", color: "mint" },
        { icon: "", title: "心理安全", desc: "不良内容创作、恐怖暴力内容、网络成瘾、自残自杀、网络占卜、软色情内容、邪典内容", color: "violet" },
        { icon: "🤝", title: "社交安全", desc: "隐私泄露、不良社群、现实社交退化、网络霸凌、社交欺诈、隔空猥亵", color: "orange" },
        { icon: "💰", title: "经济安全", desc: "高额消费、高风险消费、网络赌博、网络兼职、广告陷阱、网络诈骗", color: "mint" },
        { icon: "", title: "数字权益", desc: "网络隐私泄露、平台过度收集数据、信息茧房、算法偏见、数据不透明、物联网设备安全、数据剥夺、利用儿童的不良商业行为、青少年漏洞", color: "violet" },
      ],
      bullets: [
        "五大风险域覆盖 32 个具体议题，今天工作坊讨论的范围就限定在这 32 个议题内。",
        "桌游环节（数智免疫力桌游 + 复盘，约 55 分钟）配合线下进行。",
        "选完议题后，找到关注同一类方向的人，一桌拆为二组，全场约 8 组、每组 3–4 人——这就是下午开发的团队。",
      ],
    },
    challenge: {
      title: "数字免疫力桌游",
      desc: "线下桌游环节，配合实体桌游进行。请在桌面上完成桌游与复盘，由「守望」导师引导。",
      fields: [
        {
          id: "board_game_note",
          type: "textarea",
          label: "桌游进行中",
          hint: "线下环节，由「守望」导师引导",
          placeholder: "桌游进行中……请在实体桌面上完成本轮桌游与复盘。",
          maxLength: 100,
        },
      ],
    },
  },

  // ============================================================
  // 板块 2 · 实感力
  // ============================================================
  {
    id: "sense",
    module: "模块 02",
    power: "实感力",
    title: "实感力锻造：找到需要解决的具体案例",
    subtitle: "把抽象的议题，变成你亲身经历、见证或听说过的真实故事。从这里开始填 IDEATE 画布第一栏「开发灵感」。",
    knowledge: {
      intro:
        "实感力，就是找到我们需要去解决的具体案例——把抽象的议题，变成一个你亲身经历、见证或听说过的真实故事。从这里开始，接下来这一路我们都在填同一张 IDEATE 画布的第一栏「开发灵感」。这张画布会在上午反复出现，是接下来实感力、脑波力共用的视觉锚点。",
      flow: [
        { icon: "🎯", title: "选定议题", desc: "从32议题里凭第一印象挑出3个", color: "mint" },
        { icon: "👥", title: "一拆为二", desc: "找到同方向的人，组成3-4人开发小组", color: "violet" },
        { icon: "📖", title: "案例还原", desc: "用三问把议题变成真实故事", color: "orange" },
      ],
      bullets: [
        "三问固定措辞：你有没有经历过？你是否见证过？你有没有听说过？「经历」就是自己发生过，「见证」就是亲眼看过，「听说」就是听人讲述过。",
        "两人一组互相询问，把议题还原成具体故事。每个议题至少拿到三条真实证据。",
        "做完后可以继续在组内讨论，或者如果你更喜欢独处，也可以在网上做调研。",
      ],
    },
    challenge: {
      title: "确定今天的议题，并还原成真实故事",
      desc: "从你们小组共同关注的方向里，确定今天你们要做的唯一议题。然后用三问把它落回真实故事，每个议题至少拿到三条真实证据。",
      fields: [
        {
          id: "chosen_issue",
          type: "input",
          label: "你们组今天的唯一议题",
          placeholder: "用一句话说清楚你们关注什么问题……",
          maxLength: 100,
          required: true,
        },
        {
          id: "story_experienced",
          type: "textarea",
          label: "三问一：你有没有经历过？",
          placeholder: "写一个你自己亲身经历过的故事……",
          maxLength: 300,
          required: true,
        },
        {
          id: "story_witnessed",
          type: "textarea",
          label: "三问二：你是否见证过？",
          placeholder: "写一个你亲眼看到或听到的故事……",
          maxLength: 300,
          required: true,
        },
        {
          id: "story_heard",
          type: "textarea",
          label: "三问三：你有没有听说过？",
          placeholder: "写一个你从别人那里听说的故事……",
          maxLength: 300,
          required: true,
        },
      ],
    },
  },

  // ============================================================
  // 板块 3 · 脑波力
  // ============================================================
  {
    id: "brainwave",
    module: "模块 03",
    power: "脑波力",
    title: "脑波力启蒙：拆解问题结构，设计行动方案",
    subtitle: "用 IDEATE 画布第二栏「开发创想」四步走：Deep Sink → Envision → AI Action → Tech。",
    knowledge: {
      intro:
        "脑波力，就是通过机制拆解，让 AI 与人相互补充，设计出解决方案——不是马上给答案，而是先看清问题的结构，再想清楚怎么行动。我们进入 IDEATE 画布的第二栏「开发创想」，它包含四步：Deep Sink 深挖事件 → Envision 构建愿景 → AI Action AI 行动 → Tech 匹配技术。\n\n我们用上午玩的桌游本身当示范案例，完整走一遍这四步：\n\nDeep Sink 深挖事件：桌游的根节点是手机——它是数字生活的入口。从手机向外辐射，可以分出利益相关层（家长、孩子、平台、学校）、算法层（推荐算法、时长管理）、界面层（App 交互、游戏界面）、物理硬件层（设备、网络）。最后我们圈出一个切入点：「家庭里两代人认知不同频」。\n\nEnvision 愿景构建：现状是家长和孩子对数字风险的认知不同频——家长觉得危险，孩子觉得好玩，两边说不到一块儿。未来是家庭里有一个自然场合，让两代人一起面对同一组具体情境，共同讨论。Gap 是缺一个「第三方媒介」——不是家长说教，也不是孩子自说自话，而是一个两边都愿意参与的东西。\n\nAI Action：做一副实体桌游，把风险议题变成卡牌情境，让孩子和家长在玩耍中做出选择；再用 AI 把玩牌时的选择数据转成一份复盘报告，帮助两代人理解彼此的想法。\n\nTech 匹配技术：用技术搭建一座桥梁——让孩子和家长拥有一套数字素养的沟通工具。这包括：卡牌情境的数字化呈现、AI 对选择的分析、可视化的复盘报告。技术不是目的，而是让两代人能坐下来的那把椅子。",
      flow: [
        { icon: "🕳", title: "Deep Sink", desc: "深挖事件——画网络图：涉及谁、什么关系、入口在哪、切入点在哪", color: "mint" },
        { icon: "🌈", title: "Envision", desc: "构建愿景——现状和理想之间差的是什么（Gap）？", color: "violet" },
        { icon: "⚡", title: "AI Action", desc: "AI 行动——基于 Gap，采取什么行动来缩小它？", color: "orange" },
        { icon: "", title: "Tech", desc: "匹配技术——用 ABC 拆解行动：意识唤醒 / 行为干预 / 结果验证", color: "mint" },
      ],
      bullets: [
        "Deep Sink 不是回答四个问题，而是画一张图：网上有谁、节点关系、入口、圈出你能推动的切入点。第二个问题（节点关系 / 利益权力不平等）比较深——你就想：这件事里谁说了算？谁没得选？是什么机制把他们连起来的？用桌游举例：家长决定孩子能不能玩手机，孩子没有发言权——这就是权力不平等。",
        "避免「受害者叙事」——呈现的是结构和机制，不是「谁很惨」。",
        "在上午我们不一定要找到解决方法。我们要做的是对问题结构的理解，而不是答案。Gap 和 Action 产出的是「雏形」，不是最终方案。",
      ],
    },
    challenge: {
      title: "为你的议题画一张网络图，写下愿景、Gap、行动和 ABC 拆解",
      desc: "围绕你选的议题，按四步走拆解。建议时长：Deep Sink 8 分钟 / Envision 5 分钟 / Action 7 分钟 / Tech 10 分钟。这是 30 分钟小组共享画布作业。",
      fields: [
        {
          id: "net_people",
          type: "textarea",
          label: "① Deep Sink · 网上有谁？这个问题涉及到哪些人？",
          placeholder: "列出所有相关的人，比如用户、家长、平台、商家……",
          maxLength: 200,
          required: true,
        },
        {
          id: "net_relation",
          type: "textarea",
          label: "② Deep Sink · 节点之间的关系——存在利益与权力的不平等吗？有哪些机制在起作用？",
          placeholder: "谁有权力、谁被动、是什么机制把他们连起来的……（偏深，慢慢想：谁说了算？谁没得选？）",
          maxLength: 200,
        },
        {
          id: "net_entry",
          type: "textarea",
          label: "③ Deep Sink · 入口——这些人是怎么被卷进来的？",
          placeholder: "他们是怎么接触到这个问题的……",
          maxLength: 150,
        },
        {
          id: "net_cut",
          type: "textarea",
          label: "④ Deep Sink · 切入点——圈出网上哪一个节点，是我们真正能推动改变的地方？",
          placeholder: "今天你做得动的第一步是什么……",
          maxLength: 150,
          required: true,
        },
        {
          id: "vision",
          type: "textarea",
          label: "Envision · 愿景——如果这个问题被推动改变了，会是什么样？",
          placeholder: "想象问题被解决后的样子……",
          maxLength: 200,
          required: true,
        },
        {
          id: "gap",
          type: "textarea",
          label: "Envision · Gap——愿景和现状之间，差的是什么？",
          placeholder: "缺了什么关键的东西……",
          maxLength: 200,
          required: true,
        },
        {
          id: "action",
          type: "textarea",
          label: "AI Action——基于这个 Gap，我们要采取什么行动来缩小它？",
          placeholder: "你打算做什么来缩小这个 Gap……",
          maxLength: 200,
          required: true,
        },
        {
          id: "abc_cards",
          type: "cards",
          label: "Tech · ABC 三模块拆解",
          cards: [
            { id: "tech_a", title: "A 意识唤醒", sub: "把现实中的事物提炼成事件 / 卡牌", color: "mint", icon: "🔔", placeholder: "例如：让用户看到一个问题情境……", maxLength: 80 },
            { id: "tech_b", title: "B 行为干预", sub: "用户做出选择后，给出故事性反馈", color: "violet", icon: "✦", placeholder: "例如：用户做选择，系统给出反馈和分数……", maxLength: 80 },
            { id: "tech_c", title: "C 结果验证", sub: "记录行为数据，生成复盘报告", color: "orange", icon: "↗", placeholder: "例如：记录数据，生成一份复盘报告……", maxLength: 80 },
          ],
        },
      ],
    },
  },

  // ============================================================
  // 板块 4 · 创心力
  // ============================================================
  {
    id: "creation_dev",
    module: "模块 04",
    power: "创心力",
    title: "创心力迸发：和 AI 一起把你的想法变成产品",
    subtitle: "学会用 AI 从零做出一个能跑的东西，并且做得安全、做得靠谱。",
    knowledge: {
      intro:
        "创心力，就是你用 AI 开发一个产品、实现一个功能。上午你已经画好了画布、拆了 ABC 模块。现在，轮到你亲手把它们变成真的东西了。",
      bullets: [
        "今天我们要学会三件事：第一，用 AI 做出一个能跑的产品——不是靠猜，而是有一套方法。",
        "第二，学会驾驭 AI，而不是被 AI 牵着走。这叫 Harness Engineering——你是船长，AI 是水手。先想清楚你要什么，再告诉 AI 怎么做。",
        "第三，让 AI 发挥最大本事，同时避开那些坑。好工程师不是不用 AI，而是知道什么时候该信、什么时候该查。",
        "给指令要精确——「帮我做一个桌游 App」太模糊，「用户翻开卡牌、选应对方式、页面给反馈和分数」才够清楚。",
        "把画布里写好的愿景、Gap、Action、ABC 原样喂给 AI，不用重新编——你上午想的东西，就是最好的上下文。",
        "每做完一块，停下来自检：它能自己跑起来吗？它做的事和我想的一样吗？有没有一点就崩的地方？",
        "做得不够好？没关系，把目标再拆小一点，一块一块啃。",
        "三根红线：隐私——能用假数据就不用真数据；伦理——找到你产品里一个真实的风险，想一个具体办法去降低它；安全——API Key 不写在前端，管理后台不暴露。",
      ],
    },
    challenge: {
      title: "和你的小队一起，做出第一个能跑的 Demo",
      desc:
        "3-4 人一组，选一个议题开工。开发中途记得找技术导师做一次工程评审，15:30 我们一起检查 Demo 能不能展示。",
      fields: [
        {
          id: "group_issue",
          type: "input",
          label: "你们组要做的东西是什么？",
          placeholder: "用一句话说清楚：我们做一个 ___，帮 ___ 解决 ___ 问题。",
          maxLength: 100,
          required: true,
        },
        {
          id: "demo_url",
          type: "url",
          label: "Demo 网址",
          placeholder: "https://……",
          required: true,
        },
        {
          id: "demo_checklist",
          type: "cards",
          label: "Demo 能跑了吗？（15:30 我们一起看）",
          cards: [
            { id: "check_run", title: "能独立跑吗？", sub: "核心功能可以运行", color: "mint", icon: "▶", placeholder: "点一下能打开、能操作吗？试试……", maxLength: 100 },
            { id: "check_match", title: "和你答应的一样吗？", sub: "做出来的和你想的一致", color: "violet", icon: "✓", placeholder: "你说要做卡牌选择，页面上真的有卡牌吗？……", maxLength: 100 },
            { id: "check_crash", title: "有没有一点就崩的？", sub: "试着乱操作看看", color: "orange", icon: "⚠", placeholder: "什么都不填就提交会怎样？随便输入会怎样？……", maxLength: 100 },
          ],
        },
        {
          id: "dev_notes",
          type: "textarea",
          label: "开发日记（选填）",
          hint: "遇到什么坑？怎么解决的？",
          placeholder: "比如：AI 一开始听不懂我要什么，后来我把提示词改成了……就好了。",
          maxLength: 500,
        },
        {
          id: "privacy_note",
          type: "textarea",
          label: "你的产品用了什么数据？",
          hint: "有没有用到真实信息？能不能用假的代替？",
          placeholder: "比如：我们全部用假数据演示，不收集任何同学的真实信息。",
          maxLength: 150,
        },
        {
          id: "ethics_note",
          type: "textarea",
          label: "你的产品有什么风险？你打算怎么保护用户？",
          hint: "找到你的产品里一个真实的风险，想一个具体的办法去降低它。",
          placeholder: "比如：风险——有人可能在输入框里写同学的坏话。办法——加一个关键词提醒，并且不展示别人的输入内容。",
          maxLength: 200,
        },
      ],
    },
  },

  // ============================================================
  // 板块 5 · 沟通力
  // ============================================================
  {
    id: "communicate",
    module: "模块 05",
    power: "沟通力",
    title: "创客发布会：5 分钟路演，让你的作品被看见",
    subtitle: "准备路演发言，按评审标准展示你的产品，争夺一等奖。",
    knowledge: {
      intro:
        "沟通力不仅是写出好的 WHY 和 Slogan，更是站在台上，用 5 分钟让所有人听懂你的产品、感受你的初心、愿意为你投票。好的路演要从 WHY 讲起——先说为什么做，再说做了什么，最后说给谁用。",
      flow: [
        { icon: "", title: "开场 WHY", desc: "用一句话讲清你做这个产品的初衷", color: "mint" },
        { icon: "🛠", title: "演示 HOW", desc: "现场展示核心功能，让人看到它怎么工作", color: "violet" },
        { icon: "✨", title: "亮出 SLOGAN", desc: "念出你的价值定位，让人记住", color: "orange" },
        { icon: "", title: "推向 MARKET", desc: "谁会用、谁会买、谁会帮你传播", color: "mint" },
      ],
      bullets: [
        "每组 5 分钟路演，超时会被叫停——提前排练控制节奏。",
        "评审标准：WHY 是否打动人（30%）、HOW 是否清晰可演示（30%）、SLOGAN 是否易记有力（20%）、MARKET 是否合理可信（20%）。",
        "路演抽签决定顺序，每组派一位主讲，其他组员可补充。",
        "奖项设置：一等奖 1 个、二等奖 2 个、三等奖 5 个。",
        "嘉宾会根据评分表进行点评，认真听别人的反馈——这也是学习。",
        "提交前过一遍隐私检查：真实姓名、学校、地址、同学全名不能出现在公开展示里。",
      ],
    },
    challenge: {
      title: "写下你的 5 分钟路演稿，准备发布会",
      desc: "按下方结构写好路演稿，排练控制时间。这是发布会要讲的内容，也是评分的依据。",
      fields: [
        {
          id: "pitch_why",
          type: "textarea",
          label: "① 开场——为什么要做这个产品",
          hint: "用一句话说清初衷，30 秒以内",
          placeholder: "我们做这个产品，是因为……",
          maxLength: 150,
          required: true,
        },
        {
          id: "pitch_how",
          type: "textarea",
          label: " 演示——产品的核心功能是什么",
          hint: "现场要展示的部分，1 分钟",
          placeholder: "打开我们的产品，你可以看到……",
          maxLength: 200,
          required: true,
        },
        {
          id: "pitch_slogan",
          type: "input",
          label: "③ 亮出 Slogan——你的价值定位",
          hint: "一句话，让人一听就记住",
          placeholder: "我们的 Slogan 是……",
          maxLength: 30,
          required: true,
        },
        {
          id: "pitch_market",
          type: "textarea",
          label: "④ 推向市场——谁会用、谁会买",
          hint: "简短说明目标用户和推广思路，30 秒",
          placeholder: "我们的目标用户是……他们会因为……而使用/购买……",
          maxLength: 150,
        },
        {
          id: "pitch_closing",
          type: "textarea",
          label: "⑤ 结语——一句话收尾",
          hint: "用一个有力的句子结束，让人想支持你",
          placeholder: "我们希望……谢谢！",
          maxLength: 80,
        },
        {
          id: "demo_ready",
          type: "chips",
          label: "Demo 可展示度自查",
          hint: "全部打勾才能上台",
          max: 3,
          options: [
            "Demo 能正常打开",
            "核心功能可以现场演示",
            "没有真实姓名、学校等隐私信息",
          ],
          required: true,
        },
        {
          id: "code_file",
          type: "file",
          label: "上传你的代码（可选）",
          accept: ".zip,.js,.ts,.tsx,.html,.css,.py",
        },
      ],
    },
  },
];

// 营地与期数选项（登录用）
export const CAMPS = ["AI5000天 · 负责任开发者创客营"];
export const SESSIONS = ["第 1 期", "第 2 期", "第 3 期", "第 4 期", "第 5 期", "第 6 期", "第 7 期", "第 8 期"];
export const AGES = ["6-8 岁", "9-11 岁", "12-15 岁"];
