# Markd 官网 / Markd Site

Markd（纯 Rust + egui、无 Web Kernel 的桌面 Markdown 编辑器）的介绍站点源码：单页、中英双语、深色极光风格，纯静态 HTML/CSS/JavaScript，无构建步骤、无第三方依赖。

Live: <https://whboy10000.github.io/markd-site/> · 源码即部署产物，改完直接推送即可上线。

## 目录结构

```
web/                  站点公开目录（GitHub Pages 与 Qoder Sites 都直接用它）
  index.html          页面结构与全部文案（中英双语都在同一份文件里）
  styles.css          设计令牌 + 全部样式 + 响应式断点
  app.js              语言切换、抽屉导航、滚动揭示、标签页与 Hybrid View 演示
  favicon.svg         站点图标，同时用作页头/页脚的品牌标记
  assets/             应用截图（深色 / 浅色）
```

## 本地预览

任意静态服务器都可以，例如：

```bash
python3 -m http.server 8000 -d web
# 打开 http://127.0.0.1:8000/
```

## 双语

语言由 `<html data-lang="zh|en">` 控制，文案成对写在 `.zh` / `.en` 元素里，非当前语言的一侧被 `display: none` 隐藏。

- 优先读取地址栏 `?lang=en`，其次读取 `localStorage` 中的 `markd-lang`，默认中文。
- 页头中英文按钮切换；`app.js` 里注册了切换回调，用于同步统计数字等随语言变化的内容（如 `50万字` ↔ `500k`）。

## 换肤与设计变量

`styles.css` 顶部 `:root` 是唯一的设计令牌层，其余样式全部消费这些变量，改这里即可整体调整外观：

| 变量 | 作用 |
| --- | --- |
| `--site-bg` / `--site-fg` / `--site-accent` / `--site-on-accent` | 背景、正文、强调色、强调色上的文字 |
| `--site-surface` / `--site-muted` / `--site-border` / `--site-font` | 面板底色、次要文字、描边、字体栈 |
| `--site-radius` / `--site-space` / `--site-type` / `--site-motion` | 圆角、间距、字号、动效时长的整体缩放系数 |

`--site-space`、`--site-type`、`--site-motion` 是倍率（默认 `1`），因为它们乘在 `calc()` 里，改一个数字就能同时放大全站的间距 / 字号 / 动画时长。派生色（渐变、发丝线、玻璃底）由 `color-mix()` 从强调色计算得出，不需要逐个改。

## 页面里真正可交互的部分

- **Hybrid View 演示**：点击渲染块进入原始 Markdown 源码，失焦或 `⌘/Ctrl + Enter` 回到渲染结果。渲染器是页面内手写的 Markdown 子集（标题、引用、列表、任务列表、表格、行内代码、粗斜体、高亮、链接、代码高亮），DOM 全部用 `createElement` / `createTextNode` 构造，不使用 `innerHTML` 注入文本；公式为近似的浏览器端排版，仅用于概念展示。
- **Mermaid 示例**：按标签切换的图例是站点内手写的 SVG 示意图，用来表达渲染思路，不是 Markd 输出的截图。
- 其余数据（解析 ~11ms、块级回写 ~3µs、帧耗时 ~9.5ms、25+ 图表类型、220+ 编译期 SVG 图标等）取自 Markd 项目本身的实现说明。

## 许可说明

本仓库只包含站点静态源码。Markd 程序本体采用 PolyForm Noncommercial 1.0.0 许可，版权信息见页面页脚与 Markd 主仓库。
