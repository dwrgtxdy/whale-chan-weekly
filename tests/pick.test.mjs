import test from 'node:test'
import assert from 'node:assert/strict'
import { pickWithFloor } from '../scripts/lib/pick.mjs'

const v = (id, view) => ({ bvid: id, view })

test('达标的多于 TOP_N：只取达标的', () => {
  const scored = [v('a', 300000), v('b', 200000), v('c', 150000), v('d', 120000), v('e', 90000)]
  const out = pickWithFloor(scored, { topN: 4, minView: 100000 })
  assert.deepEqual(out.map(x => x.bvid), ['a', 'b', 'c', 'd'])
  assert.ok(out.every(x => !x.belowFloor))
})

test('达标不足：用播放最高的补足到 TOP_N 并打 belowFloor', () => {
  const scored = [v('a', 727173), v('b', 374327), v('c', 5061), v('d', 4974), v('e', 3016)]
  const out = pickWithFloor(scored, { topN: 4, minView: 100000 })
  assert.deepEqual(out.map(x => x.bvid), ['a', 'b', 'c', 'd'])
  assert.equal(out[2].belowFloor, true)
  assert.equal(out[3].belowFloor, true)
})

test('一个都不达标：按播放降序取 TOP_N，全部标记补位', () => {
  const scored = [v('x', 500), v('y', 900), v('z', 100)]
  const out = pickWithFloor(scored, { topN: 2, minView: 100000 })
  assert.deepEqual(out.map(x => x.bvid), ['y', 'x'])
  assert.ok(out.every(x => x.belowFloor === true))
})

test('候选比 TOP_N 少：有多少给多少，不炸', () => {
  const out = pickWithFloor([v('only', 80000)], { topN: 4, minView: 100000 })
  assert.equal(out.length, 1)
  assert.equal(out[0].belowFloor, true)
})

test('空池返回空数组', () => {
  assert.deepEqual(pickWithFloor([], { topN: 4, minView: 100000 }), [])
})
