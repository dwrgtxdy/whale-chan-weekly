import { readFile, writeFile, mkdir, readdir, copyFile, rm } from 'node:fs/promises'
import { SECTIONS, HISTORY_WEEKS, TOP_N } from '../config/sections.mjs'

const ROOT = new URL('../', import.meta.url)
const p = rel => new URL(rel, ROOT)
const readJson = async rel => JSON.parse(await readFile(p(rel), 'utf8'))
const ASSETS = ['wc-hero.webp', 'wc-avatar.png', 'wc-lazy.png', 'wc-wave.png']
const CSS = await readFile(p('scripts/lib/style.css'), 'utf8')

const n = v => { v = Number(v || 0); return v >= 1e8 ? (v / 1e8).toFixed(1) + '亿' : v >= 1e4 ? (v / 1e4).toFixed(1) + '万' : String(v) }
const dur = s => { s = Math.round(Number(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(ss).padStart(2, '0') }
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const pic = u => { let t = String(u || ''); if (!t) return ''; if (t.indexOf('//') === 0) t = 'https:' + t; return t.replace(/^http:\/\//i, 'https://') }
const wk = w => { const a = w.split('-W'); return a[0] + ' 年第 ' + Number(a[1]) + ' 周' }
const secOf = id => SECTIONS.find(s => s.id === id) || { name: id, tagline: '', color: '#2f6ee0', bg: '#eaf4ff' }

function itemCard(v) {
  const sec = secOf(v.section)
  const say = v.comment ? '<div class="say"><b>鲸鱼娘</b>' + esc(v.comment) + '</div>' : ''
  return '<a class="card item" href="https://www.bilibili.com/video/' + esc(v.bvid) + '" target="_blank" rel="noopener">'
    + '<div class="thumb"><img src="' + esc(pic(v.pic)) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"><span class="dur">' + dur(v.duration) + '</span><span class="bili">去B站 ↗</span></div>'
    + '<div class="txt"><h4>' + esc(v.title) + '</h4>'
    + '<div class="stats"><span>UP ' + esc(v.author || '') + '</span><span>·</span><span>播放 ' + n(v.view) + '</span><span>·</span><span>弹幕 ' + n(v.danmaku) + '</span>' + (v.belowFloor ? '<span class="fill">补位</span>' : '') + '</div>'
    + say + '</div></a>'
}

function headlineCard(v) {
  const sec = secOf(v.section)
  return '<a class="card headline" href="https://www.bilibili.com/video/' + esc(v.bvid) + '" target="_blank" rel="noopener">'
    + '<div class="cover"><img src="' + esc(pic(v.pic)) + '" alt="" referrerpolicy="no-referrer" onerror="this.remove()"><span class="bili big">去B站看正片 ↗</span></div>'
    + '<div class="body"><span class="badge">头版 · 本周综合第一</span>'
    + '<span class="badge alt" style="margin-left:6px;background:' + sec.bg + ';color:' + sec.color + '">' + esc(sec.name) + '</span>'
    + '<h2>' + esc(v.title) + '</h2>'
    + '<div class="meta"><span>' + esc(v.author || '') + '</span><span class="dot"></span><span>' + dur(v.duration) + '</span><span class="dot"></span><span>播放 ' + n(v.view) + '</span><span class="dot"></span><span>点赞 ' + n(v.like) + '</span><span class="dot"></span><span>收藏 ' + n(v.favorite) + '</span><span class="score">' + v.score + ' 分</span></div>'
    + '<div class="verdict"><span class="who">鲸鱼娘</span>' + esc(v.comment) + '</div></div></a>'
}

function nav(active, pre) {
  const links = [['首页', 'index.html']].concat(SECTIONS.map(s => [s.name, 's/' + s.id + '.html']))
  return '<nav class="nav">' + links.map(function (l) {
    return '<a href="' + pre + l[1] + '" class="' + (active === l[1] ? 'on' : '') + '">' + esc(l[0]) + '</a>'
  }).join('') + '</nav>'
}

function hero(week, opt) {
  opt = opt || {}
  const pre = opt.pre || ''
  const title = opt.title || '鲸鱼娘快报'
  const sub = opt.sub || '先吃饭，后推理｜每周日 23:00 投喂一次，不卖鱼只卖眼光'
  const stats = opt.stats || []
  const chips = stats.map(s => '<span class="chip">' + esc(s[0]) + ' <b>' + esc(s[1]) + '</b></span>').join('')
  return '<header class="hero"><div class="wrap"><div>'
    + '<div class="brand">REEF OBSERVATORY · 深海观测站</div>'
    + '<h1>' + esc(title) + '</h1><div class="sub">' + esc(sub) + '</div>'
    + '<div class="chips"><span class="chip">' + wk(week) + '</span>' + chips + '</div></div>'
    + '<div class="hero-art"><img src="' + pre + 'assets/wc-hero.webp" alt="鲸鱼娘"></div>'
    + '</div></header>'
}

function foot(week, pre) {
  return '<footer><span class="me"><img src="' + pre + 'assets/wc-avatar.png" alt="">鲸鱼娘快报 · ' + wk(week) + ' · 内容来自哔哩哔哩，仅作转述与索引</span>'
    + '<span>评分：播放3 点赞1 收藏2 转发2 弹幕评论2 · 百分位加权</span></footer>'
}

function mascotNote(pre) {
  return '<div class="mascot-note"><img src="' + pre + 'assets/wc-lazy.png" alt=""><p><b>她在碗里待机。</b>这期评论如果哪条写得敷衍，就是饭没吃饱——下周日 23:00 她再来一次。内容只做转述与索引，原片请去 B 站看。</p></div>'
}

function page(body, opt) {
  opt = opt || {}
  const pre = opt.pre || ''
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + esc(opt.title || '鲸鱼娘快报') + '</title><style>' + CSS + '</style></head><body>'
    + '<div class="topbar"><div class="wrap"><span>深海养殖基地 · 每周投喂 · 不卖鱼只卖眼光</span><a href="' + pre + 'index.html">最新一期 →</a></div></div>'
    + body + '</body></html>'
}

function weekHome(week, weeks, pre) {
  const blocks = SECTIONS.map(function (s) { return week.sections[s.id] }).filter(Boolean).map(function (sec) {
    const meta = secOf(sec.id)
    return '<section class="sec"><div class="sec-head"><h3>' + esc(meta.name) + '</h3><span class="tag">' + esc(meta.tagline) + '</span>'
      + '<a class="more" href="' + pre + 's/' + sec.id + '.html">分区页 →</a></div>'
      + '<p class="sec-sum">' + esc(sec.summary) + '</p>'
      + '<div class="grid">' + sec.items.map(itemCard).join('') + '</div></section>'
  }).join('')
  const older = weeks.filter(w => w.week !== week.week)
  const oldLinks = older.length
    ? '<div class="weeks"><span class="wlabel">往期：</span>' + older.map(w => '<a href="' + pre + w.week + '/index.html">' + wk(w.week) + '</a>').join('') + '</div>'
    : '<div class="weeks"><span class="wlabel">只保留最近 ' + HISTORY_WEEKS + ' 周</span></div>'
  const body = hero(week.week, { pre: pre, stats: [['本周候选', week.candidates + ' 条'], ['进榜', '5 区 × ' + TOP_N], ['鲸鱼娘点评', '全']] })
    + '<div class="wrap">' + nav('index.html', pre)
    + (week.headline ? headlineCard(week.headline) : '')
    + blocks + mascotNote(pre) + oldLinks + foot(week.week, pre) + '</div>'
  return page(body, { title: '鲸鱼娘快报 · ' + wk(week.week), pre: pre })
}

function sectionPage(week, secId, weeks, pre) {
  const meta = secOf(secId)
  const sec = week.sections[secId]
  const items = (sec && sec.items) || []
  const hist = weeks.filter(w => w.week !== week.week && w.sections[secId]).map(function (w) {
    const s = w.sections[secId]
    return '<div class="hist"><h3>' + wk(w.week) + '</h3><p class="sec-sum">' + esc(s.summary) + '</p>'
      + s.items.map(v => '<div class="row"><span class="k">' + v.score + ' 分</span><a href="https://www.bilibili.com/video/' + esc(v.bvid) + '" target="_blank" rel="noopener">' + esc(v.title) + '</a></div>').join('') + '</div>'
  }).join('')
  const body = hero(week.week, { pre: pre, title: meta.name, sub: meta.tagline + '｜' + wk(week.week) + ' 前 ' + TOP_N + ' 名', stats: [['候选', (week.candidates || 0) + ' 条'], ['本期进榜', items.length + ' 条'], ['历史', '最近 ' + HISTORY_WEEKS + ' 周']] })
    + '<div class="wrap">' + nav('s/' + secId + '.html', pre)
    + (sec ? '<p class="sec-sum" style="margin-top:22px">' + esc(sec.summary) + '</p>' : '<p class="sec-sum" style="margin-top:22px">这周这条支流没捞到鱼。</p>')
    + '<div class="grid">' + items.map(itemCard).join('') + '</div>'
    + hist + mascotNote(pre) + foot(week.week, pre) + '</div>'
  return page(body, { title: '鲸鱼娘快报 · ' + meta.name, pre: pre })
}

async function main() {
  const weeklyDir = p('data/weekly/')
  const files = (await readdir(weeklyDir)).filter(f => /^\d{4}-W\d{2}\.json$/.test(f)).sort()
  const weeks = []
  for (const f of files.slice(-HISTORY_WEEKS)) weeks.push(await readJson('data/weekly/' + f))
  if (!weeks.length) throw new Error('no weekly data')
  weeks.sort((a, b) => a.week < b.week ? 1 : -1)
  const latest = weeks[0]

  const docs = p('docs/')
  await mkdir(new URL('assets/', docs), { recursive: true })
  await writeFile(new URL('assets/style.css', docs), CSS)
  for (const a of ASSETS) {
    try { await copyFile(p('assets/' + a), new URL('assets/' + a, docs)) } catch (e) { console.error('[render] asset skip', a, String(e.message || e)) }
  }

  await writeFile(new URL('index.html', docs), weekHome(latest, weeks, ''))
  await mkdir(new URL('s/', docs), { recursive: true })
  for (const s of SECTIONS) await writeFile(new URL('s/' + s.id + '.html', docs), sectionPage(latest, s.id, weeks, '../'))

  for (const w of weeks) {
    const dir = new URL(w.week + '/', docs)
    await mkdir(new URL('s/', dir), { recursive: true })
    await writeFile(new URL(w.week + '/index.html', docs), weekHome(w, weeks, '../'))
    for (const s of SECTIONS) await writeFile(new URL(w.week + '/s/' + s.id + '.html', docs), sectionPage(w, s.id, weeks, '../../'))
    try { await rm(new URL(w.week + '/assets/', docs), { recursive: true, force: true }) } catch (e) {}
  }

  const keep = new Set(weeks.map(w => w.week))
  for (const d of await readdir(docs, { withFileTypes: true })) {
    if (d.isDirectory() && /^\d{4}-W\d{2}$/.test(d.name) && !keep.has(d.name)) await rm(new URL(d.name + '/', docs), { recursive: true, force: true })
  }
  console.log(JSON.stringify({ ok: true, weeks: weeks.map(w => w.week) }))
}

main().catch(e => { console.error(e); process.exit(1) })
