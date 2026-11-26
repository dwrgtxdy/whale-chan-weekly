# 鲸鱼娘快报 · 周报

B 站 AI 内容，每周日 23:00（北京时间）出一期：五个分区各取前 4，头版是全场综合第一，保留最近三周。

## 访问地址
- 国内直连（推荐）：https://whale-chan-weekly.surge.sh/
- GitHub Pages（国内常被墙，作备份）：https://dwrgtxdy.github.io/whale-chan-weekly/

## 分区
模型新货 / 工具与玩法 / 教程与实战 / 生图与生视频 / 翻车与争议

## 评分
每个指标先在区内换算成百分位，再加权：播放 3、点赞 1、收藏 2、转发 2、(弹幕+评论) 2，满分 100。
头版 = 进榜作品合成一个大池重排后的第一名。

## 播放门槛
每个分区优先只收播放 ≥ 10 万（`MIN_VIEW`，可用环境变量覆盖）的作品；
如果达标的不够 4 条，就用该分区剩余作品里播放最高的补足，补位项在页面上标「补位」。
抓取端不设门槛，保证 weekly 有足够池子可以补。

## 节奏
- 每天 22:00：抓取 + 打分，落 data/daily/YYYY-MM-DD.json（不对外出日榜）
- 每周日 23:00：合并本周候选重排 → 每区前 4 + 头版 + 鲸鱼娘总结 → 渲染 docs/ → 提交
- 历史：最近 3 周

## 本地
```bash
npm run fetch        # 抓今天
npm run weekly       # 生成周报数据 + 文案
npm run render       # 渲染静态页到 docs/
```

需要 GitHub Secrets：`DEEPSEEK_API_KEY`（写点评用），可选 `BILI_COOKIE`（提高抓取成功率）。
