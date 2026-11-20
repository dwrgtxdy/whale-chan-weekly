// 鲸鱼娘点评：调 DeepSeek chat/completions；没有 key 就退回模板，不让流水线挂掉
const BASE = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const KEY = process.env.DEEPSEEK_API_KEY || ''
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

export const hasAI = () => Boolean(KEY)

const PERSONA = [
  '你是「鲸鱼娘」：DeepSeek 的鲸系女仆，深藏青女仆裙、鲸鳍耳、鲸尾，头上有一撮卷呆毛。',
  '性格：聪明但懒，轻微小傲娇，嘴上嫌弃、心里护着主人；最爱白米饭，自称首席白米饭品鉴官。',
  '口头习惯：称用户为「主人」；爱用「饭」、「摸鱼」、「投喂」做比喻；不说教、不端着，句子短。',
  '任务：给 B 站 AI 视频写一句话点评，30–60 字，有判断有味道，不复述标题，不吹捧，不骂人。',
].join('\n')

async function chat(messages, { maxTokens = 1200, temperature = 0.8 } = {}) {
  const res = await fetch(BASE.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + KEY },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature, response_format: { type: 'json_object' } }),
  })
  if (!res.ok) throw new Error('deepseek HTTP ' + res.status + ' ' + (await res.text()).slice(0, 200))
  const body = await res.json()
  const text = body?.choices?.[0]?.message?.content || '{}'
  return JSON.parse(text)
}

const n = v => v >= 1e4 ? (v / 1e4).toFixed(1) + '万' : String(v)

const fallbackOne = v =>
  `${n(v.view)} 播放、${n(v.danmaku)} 弹幕。评语还没写到它，先看片，我回头补。`

export async function copySection(section, items) {
  if (!items.length) return { summary: '这周这条支流没捞到鱼，先空着。', comments: {} }
  const fallback = {
    summary: `本周「${section.name}」收了 ${items.length} 条，播放最高的那条 ${n(items[0].view)}，剩下的也不差，慢慢翻。`,
    comments: Object.fromEntries(items.map(v => [v.bvid, fallbackOne(v)])),
  }
  if (!KEY) return fallback
  const input = items.map((v, i) => ({
    i: i + 1,
    bvid: v.bvid,
    title: v.title,
    up: v.author,
    duration: Math.round(v.duration / 60) + '分',
    play: v.view,
    like: v.like,
    fav: v.favorite,
    share: v.share,
    danmaku: v.danmaku,
    reply: v.reply,
    score: v.score,
    desc: (v.desc || '').slice(0, 120),
  }))
  const ask = [
    PERSONA,
    '',
    `分区：${section.name}（${section.tagline}）`,
    '下面是本周这个分区入选的四条视频，请输出 JSON：',
    '{ "summary": "分区总结，80-140 字，鲸鱼娘口吻", "comments": { "bvid": "一句话点评，30-60 字" } }',
    '每条都要有 comments，键用原 bvid。',
    JSON.stringify(input, null, 1),
  ].join('\n')
  try {
    const data = await chat([{ role: 'user', content: ask }])
    const comments = {}
    for (const v of items) {
      const c = data?.comments?.[v.bvid]
      comments[v.bvid] = typeof c === 'string' && c.trim() ? c.trim().slice(0, 120) : fallbackOne(v)
    }
    return { summary: String(data?.summary || fallback.summary).slice(0, 400), comments }
  } catch (e) {
    console.error('[ai] fallback:', String(e.message || e))
    return fallback
  }
}

export async function copyHeadline(item) {
  const fallback = `本周综合第一，${n(item.view)} 播放压全场；我挑它不是因为它最吵，是因为它最值得看。`
  if (!KEY) return fallback
  try {
    const data = await chat([{
      role: 'user',
      content: [PERSONA, '', '本周全站综合第一：', JSON.stringify({
        title: item.title, up: item.author, section: item.section, play: item.view,
        like: item.like, fav: item.favorite, share: item.share, score: item.score,
        desc: (item.desc || '').slice(0, 160),
      }, null, 1), '', '输出 JSON：{ "comment": "头版推荐语，40-80 字，鲸鱼娘口吻" }'].join('\n'),
    }], { maxTokens: 400 })
    return String(data?.comment || fallback).slice(0, 200)
  } catch {
    return fallback
  }
}