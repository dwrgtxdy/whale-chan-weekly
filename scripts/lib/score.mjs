import { WEIGHTS } from '../../config/sections.mjs'

// 百分位：等于或低于它的比例（并列取中点），返回 0..1
export function percentiles(values) {
  const n = values.length
  const out = new Float64Array(n)
  if (!n) return out
  if (n === 1) { out[0] = 1; return out }
  const idx = values.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0])
  let i = 0
  while (i < n) {
    let j = i
    while (j + 1 < n && idx[j + 1][0] === idx[i][0]) j++
    const rank = (i + j) / 2 / (n - 1)
    for (let k = i; k <= j; k++) out[idx[k][1]] = rank
    i = j + 1
  }
  return out
}

export const METRICS = ['view', 'like', 'favorite', 'share', 'engage']

export function metricOf(item) {
  return {
    view: item.view || 0,
    like: item.like || 0,
    favorite: item.favorite || 0,
    share: item.share || 0,
    engage: (item.danmaku || 0) + (item.reply || 0),
  }
}

// 用同一套口径给一组视频打分（区内可比：只传同一区的候选）
export function scorePool(items) {
  if (!items.length) return []
  const rows = items.map(metricOf)
  const pcts = METRICS.map(k => percentiles(rows.map(r => r[k])))
  return items.map((item, i) => {
    let sum = 0
    METRICS.forEach((k, mi) => { sum += WEIGHTS[k] * pcts[mi][i] })
    const totalWeight = METRICS.reduce((a, k) => a + WEIGHTS[k], 0)
    return { ...item, score: Math.round(sum / totalWeight * 100) }
  })
}
