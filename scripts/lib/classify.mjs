import { CORE_TERMS, SECTIONS } from '../../config/sections.mjs'

export const hits = (text, words) => words.filter(w => String(text || '').includes(w)).length
export const coreHits = text => hits(text, CORE_TERMS)

// 强信号：光这几个词就够判断「这是 AI 内容」
const STRONG = ['AI', '人工智能', '大模型', '大语言模型', 'LLM', '智能体', 'Agent', 'MCP', 'Prompt', '提示词',
  '生图', '文生图', '生视频', '视频生成', '数字人', '语音克隆', '微调', 'DeepSeek', 'Qwen', 'GPT', 'Claude',
  'Gemini', 'Llama', 'Sora', '可灵', 'Midjourney', 'Stable Diffusion', 'ComfyUI', 'Diffusion', '多模态',
  'RAG', 'Ollama', 'vLLM', 'Cursor', 'LangChain', 'TTS', 'MiniMax']

export function isAI(v) {
  const title = v.title || ''
  const blob = title + ' ' + (v.desc || '')
  if (hits(title, STRONG) > 0) return true
  if (hits(blob, STRONG) > 0 && SECTIONS.some(s => hits(title, s.mustHit) > 0)) return true
  return coreHits(blob) >= 2
}

export function sectionScore(v, sec) {
  const title = v.title || ''
  const blob = title + ' ' + (v.desc || '')
  return hits(title, sec.mustHit) * 6 + hits(title, sec.keywords) * 2 + hits(blob, sec.keywords)
}

const DRAMA_NEWS = ['版权', '起诉', '封禁', '隐私', '泄露', '造假', '争议', '翻车', '抄袭', '事故']

export function isDrama(v) {
  const title = v.title || ''
  if (hits(title, STRONG) > 0) return true
  return hits(title, DRAMA_NEWS) > 0 && hits((v.desc || '') + title, STRONG) > 0
}

export function pickSection(v) {
  let best = null
  for (const sec of SECTIONS) {
    const s = sectionScore(v, sec)
    if (sec.id === 'drama' && !isDrama(v)) continue
    if (s > 0 && (!best || s > best.score)) best = { id: sec.id, score: s }
  }
  return best?.id || null
}

// 话题去重：标题里共有的实词 >= 2 个，就算同一条新闻的不同搬运
const tokenize = t => String(t || '').toLowerCase()
  .replace(/[，。！？、：；「」【】（）()【\[\]|/\\-]/g, ' ')
  .split(/\s+/).filter(w => w.length >= 2)

export function sameTopic(a, b) {
  const ta = new Set(tokenize(a.title))
  const tb = tokenize(b.title)
  let shared = 0
  for (const w of tb) if (ta.has(w)) shared++
  return shared >= 2
}