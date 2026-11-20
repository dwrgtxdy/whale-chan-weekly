import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises'
import { SECTIONS, TOP_N, WINDOW_DAYS } from '../config/sections.mjs'
import { scorePool } from './lib/score.mjs'
import { copySection, copyHeadline } from './lib/ai.mjs'
import { pickSection, isAI, sameTopic } from './lib/classify.mjs'

const ROOT = new URL('../', import.meta.url)
const p = rel => new URL(rel, ROOT)
const readJson = async f => JSON.parse(await readFile(p(f), 'utf8'))

function weekId(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return d.getUTCFullYear() + '-W' + String(week).padStart(2, '0')
}

async function loadCandidates(files) {
  const byId = new Map()
  for (const f of files) {
    const day = f.slice(0, 10)
    let doc
    try { doc = await readJson('data/daily/' + f) } catch { continue }
    for (const [sid, bucket] of Object.entries(doc.sections || {})) {
      for (const item of bucket.items || []) {
        const prev = byId.get(item.bvid)
        if (!prev || (item.view || 0) >= (prev.view || 0)) byId.set(item.bvid, { ...item, section: sid, firstSeen: prev?.firstSeen || day })
        else if (!prev.firstSeen) prev.firstSeen = day
      }
    }
  }
  return [...byId.values()]
}

// 质量闸：真 AI、分区对得上、同一 UP / 同一话题不刷屏
function clean(items) {
  const seen = new Set()
  const authorCount = new Map()
  const out = []
  for (const it of items) {
    if (seen.has(it.bvid)) continue
    if (!isAI(it)) continue
    if (pickSection(it) !== it.section) continue
    const a = it.author || '?'
    if ((authorCount.get(a) || 0) >= 2) continue
    if (out.some(o => sameTopic(o, it))) continue
    seen.add(it.bvid)
    authorCount.set(a, (authorCount.get(a) || 0) + 1)
    out.push(it)
  }
  return out
}

async function loadCopy(wid) {
  try {
    await stat(p('data/copy/' + wid + '.json'))
    return await readJson('data/copy/' + wid + '.json')
  } catch { return null }
}

function applyCopy(secId, sec, copy) {
  const c = copy?.sections?.[secId]
  if (!c) return sec
  if (c.summary) sec.summary = c.summary
  for (const it of sec.items) if (c.comments?.[it.bvid]) it.comment = c.comments[it.bvid]
  return sec
}

async function main() {
  const dir = p('data/daily/')
  let files = []
  try { files = (await readdir(dir)).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().slice(-12) } catch { files = [] }
  if (!files.length) { console.error('[weekly] no daily data'); process.exit(2) }
  const raw = await loadCandidates(files)
  const items = clean(raw)
  if (!items.length) { console.error('[weekly] nothing passes quality gate'); process.exit(3) }

  const anchorSec = Math.max(...items.map(v => v.pubdate || 0))
  const anchor = new Date(anchorSec * 1000 + 8 * 3600 * 1000)
  const wid = weekId(anchor)

  const sections = {}
  const globalPool = []
  for (const sec of SECTIONS) {
    const pool = items.filter(v => v.section === sec.id)
    const scored = scorePool(pool).sort((a, b) => b.score - a.score || b.view - a.view)
    const top = scored.slice(0, TOP_N)
    const copy = await copySection(sec, top)
    sections[sec.id] = { id: sec.id, name: sec.name, summary: copy.summary, items: top.map(v => ({ ...v, comment: copy.comments[v.bvid] || '' })) }
    globalPool.push(...scored)
  }

  const head = scorePool(globalPool).sort((a, b) => b.score - a.score || b.view - a.view)[0]
  const copy = await loadCopy(wid)
  if (copy) for (const k of Object.keys(sections)) applyCopy(k, sections[k], copy)
  const headComment = copy?.headline || await copyHeadline(head)

  const week = {
    week: wid,
    anchorDate: anchor.toISOString().slice(0, 10),
    generatedAt: new Date().toISOString(),
    windowDays: WINDOW_DAYS,
    candidates: items.length,
    headline: { ...head, comment: headComment },
    sections,
  }
  await mkdir(p('data/weekly/'), { recursive: true })
  await writeFile(p('data/weekly/' + wid + '.json'), JSON.stringify(week, null, 1))
  console.log(JSON.stringify({ ok: true, week: wid, candidates: items.length, sections: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.items.length])) }))
}

main().catch(e => { console.error(e); process.exit(1) })