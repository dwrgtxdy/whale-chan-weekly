// 五个分区：关键词、配色、鲸鱼娘的定位
export const SECTIONS = [
  {
    id: 'models', name: '模型新货', short: '模型',
    tagline: '新模型、开源权重、能立刻上手的那种',
    color: '#2f6ee0', bg: '#eaf4ff',
    keywords: ['AI 新模型', '大模型 发布', '开源大模型', '模型 实测', 'DeepSeek', 'Qwen', 'Gemini', 'GPT'],
    mustHit: ['新模型', '开源模型', '大模型', 'DeepSeek', 'Qwen', 'Gemini', 'GPT', 'Claude', 'Llama', '权重'],
  },
  {
    id: 'tools', name: '工具与玩法', short: '工具',
    tagline: 'Agent、MCP、写代码、把手弄脏的那类',
    color: '#7a5af8', bg: '#f1edff',
    keywords: ['AI 工具', 'MCP', 'Agent', '代码 Agent', 'ComfyUI', 'AI 工作流', 'Cursor', 'Ollama'],
    mustHit: ['MCP', 'Agent', '智能体', 'Cursor', 'Claude Code', '工作流', 'RAG', 'Ollama', 'vLLM', 'ComfyUI'],
  },
  {
    id: 'tutorial', name: '教程与实战', short: '教程',
    tagline: '看完能自己动手，不是纸上谈兵',
    color: '#0f9d8f', bg: '#e6f8f5',
    keywords: ['AI 教程', '大模型 实战', 'AI 项目实战', '微调 教程', '提示词 教程', 'Agent 开发'],
    mustHit: ['教程', '实战', '从零', '微调', 'LoRA', '部署', '提示词', '原理', '开发'],
  },
  {
    id: 'media', name: '生图与生视频', short: '生成',
    tagline: '画得像不像、动得对不对，看成品说话',
    color: '#e0559b', bg: '#ffeef6',
    keywords: ['AI 生图', '文生图', 'AI 视频生成', 'ComfyUI 工作流', '数字人', '语音克隆', '可灵', 'Midjourney'],
    mustHit: ['生图', '文生图', '生视频', '视频生成', 'Sora', '可灵', '即梦', 'Midjourney', 'Stable Diffusion', '数字人', '语音克隆', 'ComfyUI'],
  },
  {
    id: 'drama', name: '翻车与争议', short: '翻车',
    tagline: '幻觉、版权、隐私、封号，出了事才有的看',
    color: '#e2622c', bg: '#fff0e8',
    keywords: ['AI 翻车', 'AI 幻觉', 'AI 版权', 'AI 争议', 'AI 造假', 'AI 隐私'],
    mustHit: ['翻车', '幻觉', '版权', '隐私', '泄露', '封禁', '争议', '造假', '抄袭', '起诉'],
  },
]

// 硬门槛：标题/简介里必须出现真正的 AI 信号，防止「手把手教你弹琴」混进来
export const CORE_TERMS = [
  'AI', '人工智能', '大模型', '大语言模型', 'LLM', '模型', '智能体', 'Agent', 'MCP', 'Prompt', '提示词',
  '生图', '文生图', '生视频', '视频生成', '数字人', '语音克隆', '微调', '训练', '推理', '算力', '显卡',
  'DeepSeek', 'Qwen', 'GPT', 'Claude', 'Gemini', 'Llama', 'Sora', '可灵', 'Midjourney', 'Stable Diffusion',
  'ComfyUI', 'Diffusion', 'Transformer', '多模态', 'TTS', 'RAG', 'Ollama', 'vLLM', 'Cursor',
]

// 判定「这条是不是 AI 内容」的最低命中数
export const AI_TERMS = CORE_TERMS.concat(['算法', '深度学习', '神经网络', '生成式', '语料', '开源', 'Token', 'NeRF', 'Lora'])

// 评分权重：播放 3 / 点赞 1 / 收藏 2 / 转发 2 / (弹幕+评论) 2
export const WEIGHTS = { view: 3, like: 1, favorite: 2, share: 2, engage: 2 }

export const TOP_N = 4
export const HISTORY_WEEKS = 3
export const WINDOW_DAYS = 7
export const MIN_DURATION = 60

// 播放量门槛：每个分区优先只收 ≥ 10 万的作品；不够 TOP_N 条时用该区播放最高的补足（MIN_VIEW 可覆盖）
export const MIN_VIEW = Number(process.env.MIN_VIEW || 100000)

