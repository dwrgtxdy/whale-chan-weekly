import { writeFile, mkdir } from 'node:fs/promises'
import { CORE_TERMS, SECTIONS, WINDOW_DAYS, MIN_DURATION } from '../config/sections.mjs'
import { searchVideos, videoDetail } from './lib/bili.mjs'

const ROOT = new URL('../', import.meta.url)
const VIEW_BUDGET = Number(process.env.VIEW_BUDGET || 40)
const KW_LIMIT = Number(process.env.KW_LIMIT || 4)
const ONLY = (process.env.SECTIONS || '').split(',').map(s => s.trim()).filter(Boolean)
const ORDERS = (process.env.ORDERS || 'pubdate,click').split(',')

const hits = (text, words) => words.filter(w => String(text).includes(w)).length
const day = t => new Date(t * 1000 + 8 * 3600 * 1000).toISOString().slice(0, 10)

function sectionScore(v, sec) {
  const title = v.title || ''
  const blob = title + ' ' + (v.desc || '')
  return hits(title, sec.mustHit) * 6 + hits(title, sec.keywords) * 2 + hits(blob, sec.keywords)
}

function pickSection(v) {
  let best = null
  for (const sec of SECTIONS) {
    const s = sectionScore(v, sec)
    if (s > 0 && (!best || s > best.score)) best = { id: sec.id, score: s }
  }
  return best?.id || null
}

async function main() {
  const secs = SECTIONS.filter(s => !ONLY.length || ONLY.includes(s.id))
  const failed = []
  const all = new Map()

  for (const sec of secs) {
    for (const kw of sec.keywords.slice(0, KW_LIMIT)) {
      for (const order of ORDERS) {
        try {
          const list = await searchVideos(kw, { order })
          for (const v of list) {
            if (!all.has(v.bvid)) all.set(v.bvid, { ...v, firstKeyword: kw })
          }
        } catch (e) {
          failed.push({ section: sec.id, keyword: kw, order, error: String(e.message || e) })
        }
      }
      console.error('[fetch]', sec.id, kw, 'seen=' + all.size, 'failed=' + failed.length)
    }
  }

  // 窗口锚点用「抓到的最新发布时间」，不依赖机器时钟（云上/本机时钟可能不准）
  const anchor = Math.max(0, ...[...all.values()].map(v => v.pubdate || 0))
  const cutoff = anchor - WINDOW_DAYS * 86400

  const kept = [...all.values()].filter(v => {
    if ((v.pubdate || 0) < cutoff) return false
    if ((v.duration || 0) < MIN_DURATION) return false
    const blob = (v.title || '') + ' ' + (v.desc || '')
    if (!CORE_TERMS.some(t => blob.includes(t))) return false
    return true
  }).map(v => ({ ...v, section: pickSection(v) })).filter(v => v.section)

  const out = {
    anchor: new Date(anchor * 1000).toISOString(),
    anchorDate: day(anchor),
    generatedAt: new Date().toISOString(),
    windowDays: WINDOW_DAYS,
    sections: {},
  }
  let fetched = 0
  for (const sec of secs) {
    const pool = kept.filter(v => v.section === sec.id).sort((a, b) => b.view - a.view)
    const picked = []
    for (const v of pool.slice(0, VIEW_BUDGET)) {
      try {
        const d = await videoDetail(v.bvid)
        picked.push({ ...v, ...d, section: sec.id })
        fetched++
      } catch (e) {
        failed.push({ section: sec.id, bvid: v.bvid, error: String(e.message || e) })
      }
    }
    out.sections[sec.id] = { candidates: pool.length, items: picked }
    console.error('[fetch]', sec.id, 'pool=' + pool.length, 'detail=' + picked.length)
  }
  out.stats = { seen: all.size, kept: kept.length, fetched, failed: failed.slice(0, 20) }

  const target = 'data/daily/' + out.anchorDate + '.json'
  await mkdir(new URL('data/daily/', ROOT), { recursive: true })
  await writeFile(new URL(target, ROOT), JSON.stringify(out, null, 1))
  console.log(JSON.stringify({ ok: true, anchorDate: out.anchorDate, seen: all.size, kept: kept.length, fetched, failed: failed.length }))
}

main().catch(e => { console.error(e); process.exit(1) })