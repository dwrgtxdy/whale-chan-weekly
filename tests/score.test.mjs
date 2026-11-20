import test from 'node:test'
import assert from 'node:assert/strict'
import { percentiles, scorePool } from '../scripts/lib/score.mjs'

test('percentiles 单调且落在 0..1', () => {
  const p = percentiles([10, 20, 30])
  assert.equal(p[0], 0)
  assert.equal(p[2], 1)
  assert.ok(p[1] > 0 && p[1] < 1)
})

test('并列取中点', () => {
  const p = percentiles([5, 5, 5])
  assert.deepEqual([...p], [0.5, 0.5, 0.5])
})

test('scorePool 满分 100、播放高的排前面', () => {
  const items = [
    { view: 1000, like: 10, favorite: 5, share: 2, danmaku: 3, reply: 1 },
    { view: 10000, like: 100, favorite: 50, share: 20, danmaku: 30, reply: 10 },
  ]
  const scored = scorePool(items).sort((a, b) => b.score - a.score)
  assert.equal(scored[0].score, 100)
  assert.equal(scored[1].score, 0)
})

test('空池不炸', () => { assert.deepEqual(scorePool([]), []) })
