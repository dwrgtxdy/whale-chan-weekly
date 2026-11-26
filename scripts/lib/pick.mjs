// 播放门槛：够 TOP_N 条达标的就只用达标的；
// 不够时用该分区播放最高的补足，并给补位项打上 belowFloor 标记
export function pickWithFloor(scored, { topN, minView }) {
  const chosen = scored.filter(v => (v.view || 0) >= minView).slice(0, topN)
  if (chosen.length >= topN) return chosen
  const rest = scored
    .filter(v => !chosen.includes(v))
    .sort((a, b) => (b.view || 0) - (a.view || 0))
  for (const v of rest) {
    if (chosen.length >= topN) break
    chosen.push({ ...v, belowFloor: true })
  }
  return chosen
}
