
import { searchVideos } from './lib/bili.mjs'
import { AI_TERMS, WINDOW_DAYS, MIN_DURATION } from '../config/sections.mjs'
const list = await searchVideos('AI 大模型')
const cutoff = Math.floor(Date.now()/1000) - WINDOW_DAYS*86400
const hits=(t,w)=>w.filter(x=>t.includes(x)).length
let a=0,b=0,c=0
const samples=[]
for (const v of list){
  if (v.pubdate && v.pubdate<cutoff) continue; a++
  if (v.duration && v.duration<MIN_DURATION) continue; b++
  const blob=v.title+' '+v.desc
  if (hits(blob,AI_TERMS)<2) { if(samples.length<4) samples.push({aiHits:hits(blob,AI_TERMS),t:v.title.slice(0,44)}); continue }
  c++
}
console.log(JSON.stringify({total:list.length,afterDate:a,afterDur:b,afterAI:c,samples,top:list.slice(0,2).map(v=>({t:v.title.slice(0,40),d:v.duration,view:v.view,pub:v.pubdate}))},null,1))
