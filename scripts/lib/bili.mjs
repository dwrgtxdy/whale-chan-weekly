export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const BASE = 'https://api.bilibili.com'
export const wait = ms => new Promise(r => setTimeout(r, ms))

let lastAt = 0
async function throttle(gap) {
  const now = Date.now()
  if (now - lastAt < gap) await wait(gap - (now - lastAt))
  lastAt = Date.now()
}

// 匿名游客身份：没有它 search 接口会 412
let cookieCache = null
export async function visitorCookie() {
  if (cookieCache !== null) return cookieCache
  const extra = process.env.BILI_COOKIE || ''
  try {
    const res = await fetch(BASE + '/x/frontend/finger/spi', {
      headers: { 'user-agent': UA, referer: 'https://www.bilibili.com/', accept: 'application/json' },
    })
    const body = await res.json()
    const d = body?.data || {}
    cookieCache = [d.b_3 ? 'buvid3=' + d.b_3 : '', d.b_4 ? 'buvid4=' + d.b_4 : '', extra].filter(Boolean).join('; ')
  } catch {
    cookieCache = extra
  }
  return cookieCache
}

async function headers(origin) {
  const h = {
    'user-agent': UA,
    referer: origin || 'https://www.bilibili.com/',
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    cookie: await visitorCookie(),
  }
  if (origin) { try { h.origin = new URL(origin).origin } catch { h.origin = 'https://search.bilibili.com' } }
  return h
}

export async function api(path, { tries = 4, gap = 1600, origin = '' } = {}) {
  let lastErr
  for (let i = 0; i < tries; i++) {
    await throttle(gap)
    try {
      const res = await fetch(BASE + path, { headers: await headers(origin) })
      if (res.status === 412 || res.status === 429) {
        lastErr = new Error('HTTP ' + res.status)
        cookieCache = null            // 换一张游客票再试
        await wait(2500 + i * 2000)
        continue
      }
      if (!res.ok) {
        lastErr = new Error('HTTP ' + res.status)
        await wait(900 * (i + 1))
        continue
      }
      const body = await res.json()
      if (body.code !== 0) {
        lastErr = new Error('bili code ' + body.code + (body.message ? ' ' + body.message : ''))
        if (body.code === -412 || body.code === -352) { cookieCache = null; await wait(2500 + i * 2000) }
        else await wait(600 * (i + 1))
        continue
      }
      return body.data
    } catch (e) {
      lastErr = e
      await wait(900 * (i + 1))
    }
  }
  throw lastErr
}

export const stripEm = s => String(s || '')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')

export const normPic = p => {
  const s = String(p || '')
  if (!s) return ''
  return s.startsWith('//') ? 'https:' + s : s
}

export function parseDur(d) {
  const parts = String(d || '0:00').split(':').map(Number).reverse()
  const [s = 0, m = 0, h = 0] = parts
  return s + m * 60 + h * 3600
}

export async function searchVideos(keyword, { order = 'click', pageSize = 40 } = {}) {
  const qs = new URLSearchParams({ search_type: 'video', keyword, order, page: '1', page_size: String(pageSize) })
  const data = await api('/x/web-interface/search/type?' + qs.toString(), {
    gap: 2400,
    origin: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(keyword),
  })
  const list = data?.result || []
  return list.map(it => ({
    bvid: it.bvid,
    title: stripEm(it.title),
    author: it.author,
    mid: it.mid,
    desc: stripEm(it.description || ''),
    pic: normPic(it.pic),
    pubdate: Number(it.pubdate || 0),
    duration: parseDur(it.duration),
    view: Number(it.play || 0),
    danmaku: Number(it.video_review || 0),
    favorite: Number(it.favorites || 0),
    url: 'https://www.bilibili.com/video/' + it.bvid,
  })).filter(v => v.bvid && v.bvid.startsWith('BV'))
}

export async function videoDetail(bvid) {
  const d = await api('/x/web-interface/view?bvid=' + bvid, { gap: 1300 })
  const s = d.stat || {}
  return {
    bvid,
    title: stripEm(d.title),
    desc: stripEm(d.desc || '').slice(0, 200),
    pic: normPic(d.pic),
    author: d.owner?.name || '',
    duration: Number(d.duration || 0),
    pubdate: Number(d.pubdate || 0),
    view: Number(s.view || 0),
    like: Number(s.like || 0),
    coin: Number(s.coin || 0),
    favorite: Number(s.favorite || 0),
    share: Number(s.share || 0),
    reply: Number(s.reply || 0),
    danmaku: Number(s.danmaku || 0),
  }
}