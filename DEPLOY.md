# 上线步骤（给主人手抄版）

## 0. 你需要准备
- GitHub 账号（用来放仓库 + Pages）
- 一个 DeepSeek API Key（可选；没有就用模板文案，有就自动写鲸鱼娘点评）

## 1. 建仓库
1. github.com → New repository → 名字 `whale-chan-weekly` → Public（Pages 免费，Actions 公开仓库免分钟）
2. 不要勾 README / .gitignore，直接 Create

## 2. 推代码（二选一）
### A. 把 PAT 给我，我全自动（推荐）
- 生成 classic PAT：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
- 勾选：`repo`、`workflow`
- 有效期选 7 天，用完就删

### B. 你自己推
```bash
cd D:/DeepSeekHarness/workspace/reef-site
git init -b main
git add -A && git commit -m 'init: 鲸鱼娘快报'
git remote add origin https://github.com/<你的用户名>/whale-chan-weekly.git
git push -u origin main
```
（网络到 github.com 不稳，多试几次；或开代理再推）

## 3. 加 Secrets（网页点几下）
仓库 → Settings → Secrets and variables → Actions → New repository secret
- `DEEPSEEK_API_KEY` = 你的 key（可选）
- `BILI_COOKIE` = 可选，游客 cookie 提高抓取成功率

## 4. 开 Pages
仓库 → Settings → Pages → Build and deployment → Source 选 **GitHub Actions**

## 5. 手动跑一次
仓库 → Actions → `weekly-report` → Run workflow → 等 2 分钟
成功后地址：`https://<你的用户名>.github.io/whale-chan-weekly/`

## 定时
- 每天 22:00（北京）抓取打分，提交 data/daily
- 每周日 23:00（北京）重排 → 出周报 → 提交 docs → 部署 Pages

## 本地
```bash
cd D:/DeepSeekHarness/workspace/reef-site
npm run render     # 用现有数据重渲染 docs/
npm run weekly     # 重算周报（+ API key 时写点评）
npm test           # 评分单元测试
```