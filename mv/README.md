# 《渡口》MV

- `渡口_MV_分享版.mp4` — 成片（720×1280，3:29）
- `mv.html` — 画面源码：Canvas 程序化渲染，`render(t)` 输出任意时刻的一帧
- `env.js` → `env.js.json` — 从音轨提取的响度包络，用来驱动月晕和光点
- `chunk.js` / `runall.sh` — 用 Playwright 逐帧截图，ffmpeg 编码，再并行分段渲染后拼接配音轨

重新渲染：`npm install`（字体：霞鹜文楷、Noto Serif SC），把原曲音轨放成 `audio.m4a`，然后运行 `./runall.sh`。
