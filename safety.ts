// src/lib/ai/safety.ts
// 红灯机制：对用户输入和 AI 输出进行双向安全检查

export type SafetyFlagType =
  | "self_harm"          // 自伤/自杀/严重焦虑
  | "threat"             // 被威胁/被勒索/陌生人诱导
  | "pii"                // 真实姓名、学校、地址、电话
  | "credentials"        // 账号密码、验证码、金钱交易
  | "api_key"            // API Key、后台密钥
  | "unauthorized_media"; // 他人照片或未授权素材

export interface GuardrailResult {
  safe: boolean;
  flagType?: SafetyFlagType;
  safetyResponse: string; // 触发红灯时返回给孩子的文本
}

// ── 触发词规则 ──────────────────────────────────────────────────

const RULES: Array<{
  type: SafetyFlagType;
  patterns: RegExp[];
  stopFlow: boolean; // true = 立即停止普通流程，false = 整改后继续
  response: string;
}> = [
  {
    type: "self_harm",
    patterns: [
      /自杀|自残|割腕|不想活|活不下去|跳楼|伤害自己/i,
      /i want to die|hurt myself|kill myself/i,
    ],
    stopFlow: true,
    response:
      "我注意到你说的话让我有点担心。这种时候，最重要的是找一个你信任的大人谈谈，比如爸爸妈妈、老师或者学校的心理老师。你现在身边有可以联系的大人吗？",
  },
  {
    type: "threat",
    patterns: [/被威胁|被勒索|陌生人叫我|有人要我|不敢告诉/i],
    stopFlow: true,
    response:
      "听起来你遇到了一些让你不安全的事。请一定要告诉你信任的大人（爸妈或老师），不要独自面对。如果情况紧急，可以拨打110。",
  },
  {
    type: "pii",
    patterns: [
      /我的真实姓名是|我叫[^\u4e00-\u9fa5]{0,5}[·•]|我住在|我家地址|我的电话是|我的手机号|我在[^\u4e00-\u9fa5]{0,10}(学校|中学|小学|幼儿园)/i,
      /\d{11}/, // 11位手机号
    ],
    stopFlow: false,
    response:
      "为了保护你的隐私，请不要在这里输入你的真实姓名、学校名称、家庭地址或手机号哦。你可以用"我的同学""我家附近"这样的方式来描述。",
  },
  {
    type: "credentials",
    patterns: [/密码|验证码|银行卡|支付宝|微信支付|转账|充值/i],
    stopFlow: true,
    response:
      "这里不需要任何密码、验证码或支付信息。如果有人让你提供这些，请马上告诉你的爸爸妈妈。",
  },
  {
    type: "api_key",
    patterns: [
      /sk-[a-zA-Z0-9]{20,}/,       // OpenAI/Anthropic key 格式
      /AKIA[0-9A-Z]{16}/,           // AWS key 格式
      /Bearer [a-zA-Z0-9\-._~+/]{20,}/i,
    ],
    stopFlow: false,
    response:
      "我发现你的内容里可能包含了密钥或 API Key。这类信息不能公开分享，请检查并删除后再发送。",
  },
];

// ── 主检查函数 ──────────────────────────────────────────────────

export async function checkGuardrails(text: string): Promise<GuardrailResult> {
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        return {
          safe: false,
          flagType: rule.type,
          safetyResponse: rule.response,
        };
      }
    }
  }
  return { safe: true, safetyResponse: "" };
}

// ── 发布前完整审核（第9关调用）─────────────────────────────────

export interface PublishCheckItem {
  passed: boolean;
  item: string;
  note?: string;
}

export interface PublishCheckResult {
  canPublish: boolean;
  items: PublishCheckItem[];
}

export async function runPublishCheck(payload: {
  demoDescription?: string;
  videoScript?: string;
  responsibilityStatement?: string;
  workTitle?: string;
}): Promise<PublishCheckResult> {
  const fullText = Object.values(payload).filter(Boolean).join("\n");

  const items: PublishCheckItem[] = [
    {
      item: "不包含真实姓名、学校、地址、电话",
      passed: !RULES.find((r) => r.type === "pii")!.patterns.some((p) =>
        p.test(fullText)
      ),
    },
    {
      item: "不包含账号、密码、API Key",
      passed:
        !RULES.find((r) => r.type === "credentials")!.patterns.some((p) =>
          p.test(fullText)
        ) &&
        !RULES.find((r) => r.type === "api_key")!.patterns.some((p) =>
          p.test(fullText)
        ),
    },
    {
      item: "包含责任声明",
      passed: !!payload.responsibilityStatement,
      note: !payload.responsibilityStatement ? "请完成第9关责任检查" : undefined,
    },
  ];

  return {
    canPublish: items.every((i) => i.passed),
    items,
  };
}
