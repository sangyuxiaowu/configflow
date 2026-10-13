# OpsConfig Studio 配置文件系统

<div align="center">

<p align="center">
  <a href="./README.md">English</a> | <b>简体中文</b>
</p>

<p align="center">
  🚀 <a href="https://sangyuxiaowu.github.io/configflow"><b>在线体验 (Live Demo)</b></a>
</p>

![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.0-646cff.svg?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?logo=tailwindcss)
![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)

<p align="center">
  <b>面向开发与运维的双端协同配置设计与可视化编辑系统</b>
</p>
<p align="center">
  开发提供全量 JSON 约束规则、字段文档与架构参考样例<br/>
  运维免心智负担可视化安全编辑、实时合规校验、差异对比与一键导出
</p>

</div>

---

## 📖 项目背景与解决痛点

在分布式系统、微服务架构以及私有化部署运维中，配置文件（JSON / YAML）往往是系统故障的高发源头：

| 传统配置文件维护痛点 | OpsConfig Studio 解决方案 |
| :--- | :--- |
| **手写语法易错**：手工编辑 JSON/YAML 容易遗漏逗号、引号、缩进层级 | **自适应表单**：根据配置规范动态生成类型安全的可视化表单，零语法心智负担 |
| **字段含义模糊**：运维面对成百上千行的参数不知其意，容易误填 | **业务说明内嵌**：每个字段携带中文名、详细解释、单位、占位符及重启提醒 |
| **参数越界与崩溃**：端口被占用、数值超限、格式不合规导致服务启动失败 | **实时交互校验**：内置强类型与正则表达式校验，实时阻断非法输入并高亮报警 |
| **缺乏环境标准样例**：运维不知多环境（开发/测试/生产高可用）如何配比 | **架构参考样例库**：开发内置推荐架构配置，运维可随时查阅并一键套用 |
| **变更不可知**：修改后无法快速确认动了哪些配置项 | **实时 Diff 对比**：智能对比当前编辑内容与原始基线，变动项一览无余 |
| **隔离网络环境受限**：生产机房常为内网隔离环境 | **PWA 离线支持**：Service Worker 离线缓存，无网环境依然能完整使用并导出 |

---

## ✨ 核心特性

### 1. 🛠️ 开发设计端 (Dev Schema Designer)
- **智能 Schema 推断**：支持粘贴或上传 JSON、YAML、Properties、ENV 配置，也可从远程 URL 抓取；系统自动递归推断字段类型、默认值与层级嵌套。
- **11 种强类型字段支持**：
  - 基础类型：`string`（文本）、`number`（数字）、`boolean`（开关）、`enum`（枚举字典）
  - 网络与安全：`port`（网络端口校验 1-65535）、`ip`（IPv4 地址合规校验）、`url`（网络协议地址）、`secret`（密码/Token 遮罩脱敏）
  - 复杂类型：`array_string`（字符串数组/标签列表）、`object`（子对象）、`array_object`（对象数组/服务监控列表，支持自定义子字段结构）
- **高危与运维预警标识**：
  - 标记 **高危参数 (Dangerous)**：红色高亮预警，避免关键参数误修改。
  - 标记 **需要重启服务 (Requires Restart)**：明示改动成本，协助运维安排发布窗口。
  - 标记 **敏感配置 (Secret)**：运维端默认掩码展示，支持一键切换查看明文。
- **架构参考样例编辑器 (Reference Examples)**：
  - 支持配置多套典型环境（如：`生产高可用集群 (Prod HA)`、`预发演练环境`、`开发轻量单机`）。
  - 支持填写适用场景、推荐硬件规格及全量 JSON 配置，为运维提供权威范式。

### 2. ⚡ 运维编辑端 (Ops Visual Editor)
- **零语法心智负担编辑**：纯 UI 操作，卡片化分组，支持搜索过滤与折叠收起。
- **实时合规性校验引擎**：即时反馈类型不匹配、范围越界、正则不符或必填项缺失等警告与错误。
- **参考架构一键套用与抽屉对比**：右侧抽屉式展示架构范例，可随时点击一键套用至当前配置。
- **变更差异对比 (Diff Viewer)**：清晰高亮展示新增、修改与删除的字段及前后取值变化。
- **多格式导出与下载**：
  - 业务配置支持 `JSON`、`YAML`、`Properties` 和 `ENV` 格式
  - 可在开发设计端设置 `outputFormat`，控制默认模板与运维端最终配置的产出格式；未设置时默认为 `JSON`
  - 全量 `Schema Package` 始终以 JSON 导入、导出，与业务配置产出格式相互独立

Properties 使用点分层级键；ENV 导出使用大写下划线变量名，并以 `__` 分隔层级，导入时匹配 Schema 已知字段不区分大小写。Properties/ENV 中的数组和对象以 JSON 值编码；若多个字段路径映射到同一个 ENV 变量名，导入或导出会报错，避免静默覆盖。

### 3. 🌐 远程集成与免登录加载
- 支持 URL Query 参数直接远程装载配置或 Schema：
  - `?load=https://your-domain.com/config.json`
  - `?config=https://your-domain.com/schema.json`
- 支持在界面中直接输入 HTTP/HTTPS URL 或 GitHub/Gist 原始链接一键抓取并解析。

### 4. 📱 PWA 与离线第一架构 (Offline First)
- 内置 Progressive Web App 支持与 Service Worker 缓存。
- 支持桌面端 (Chrome / Edge / Safari) 与移动端原生应用安装。
- 提供网络状态感知指示器，断网离线时自动切换本地缓存模式。

---

## 🛠️ 技术栈

- **核心框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite 8](https://vitejs.dev/)
- **样式与设计**：[Tailwind CSS v4](https://tailwindcss.com/)
- **动效库**：[Motion](https://motion.dev/)
- **图标系统**：[Lucide React](https://lucide.dev/)
- **PWA 插件**：`vite-plugin-pwa` + `sharp` 图标生成流水线

---

## 📁 目录结构

```text
├── public/                 # 静态资源与 PWA 图标
├── src-tauri/              # Tauri 2 桌面端配置与 Rust 入口
├── scripts/
│   └── generate-icons.js   # PWA 多尺寸图标自动生成脚本
├── src/
│   ├── components/
│   │   ├── common/         # 通用组件 (加载弹窗、全局 Toast 提示)
│   │   ├── dev/            # 开发设计端组件 (Schema 设计器、规则配置、参考样例配置、导出)
│   │   ├── ops/            # 运维编辑端组件 (可视化表单、字段渲染器、架构参考抽屉、差异对比)
│   │   └── pwa/            # 离线状态感知指示器与 PWA 安装按钮
│   ├── data/
│   │   └── mockTemplates.ts# 官方精选模板 (如监控看门狗全量服务配置规范)
│   ├── hooks/
│   │   ├── useOnlineStatus.ts # 网络连接状态监听 Hook
│   │   └── usePWAInstall.ts   # PWA 安装弹窗触发 Hook
│   ├── types/
│   │   └── config.ts       # 核心数据模型 (FieldDefinition, ConfigSchemaPackage, ValidationError)
│   ├── utils/
│   │   ├── schemaInfer.ts  # JSON 自动推断与 Schema 解析引擎
│   │   ├── configFormats.ts # JSON、YAML、Properties、ENV 解析与序列化
│   │   └── validator.ts    # 字段约束与合规性校验引擎
│   ├── App.tsx             # 应用主入口与双端切换逻辑
│   ├── index.css           # 全局样式 (Tailwind v4)
│   └── main.tsx            # 应用挂载点
├── metadata.json           # 项目应用元信息
├── package.json            # 依赖与脚本定义
├── LICENSE                 # Apache 2.0 开源许可证
├── README.md               # 英文项目说明
└── README.zh-CN.md         # 中文项目说明
```

---

## 🚀 快速上手

### 环境要求
- Node.js >= 18.0.0
- npm / pnpm / yarn / bun

### 1. 克隆项目
```bash
git clone https://github.com/sangyuxiaowu/configflow.git
cd configflow
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```
开发服务器将运行在 `http://localhost:3000`。

### 4. 构建生产产物
```bash
npm run build
```
执行构建前将自动触发 `scripts/generate-icons.js` 生成各尺寸 PWA 必备图标，并将打包产物输出至 `dist/` 目录。

### 5. 生产预览
```bash
npm run preview
```

### 6. 桌面端开发与打包
桌面端需要 Rust stable 工具链；Windows 还需要 Microsoft C++ Build Tools 和 WebView2 Runtime。

```bash
npm run dev:tauri
```

生成 Windows 安装包（或当前平台对应的桌面安装包）：

```bash
npm run build:tauri
```

Tauri 构建会自动生成桌面图标，并使用不含 PWA Service Worker 的前端产物；安装包输出到 `src-tauri/target/release/bundle/`。

---

## 💡 使用指南

### 场景一：开发人员定制配置模板
1. 进入系统后切换至顶部 **「开发端 (Schema 规则设计)」**。
2. 点击 **「导入配置并生成规范」**，粘贴或上传 JSON、YAML、Properties、ENV 配置，也可输入远程配置 URL；粘贴内容会自动识别格式，文件和 URL 按扩展名识别。
3. 系统将自动生成所有字段列表：
   - 补充中文标签（Label）与详细说明（Description）。
   - 设置关键字段的约束范围（端口范围、正则表达式、枚举列表）。
   - 对密码等敏感项勾选 **「敏感配置 (脱敏)」**；对高风险项勾选 **「高危参数」**。
4. 切换到 **「架构参考样例 (Reference Examples)」** 选项卡，添加多套标准生产/测试推荐配置。
5. 点击右上角 **「导出规范包」**，将生成的 Schema JSON 分享给运维团队或存入工程配置仓库。

### 场景二：运维人员安全编辑配置
1. 运维人员切换至 **「运维端 (可视化安全编辑)」**。
2. 界面将呈现清晰分类的表单卡片，支持实时填写、勾选与下拉选择。
3. 可点击右上角 **「参考架构样例」** 抽屉，查看开发推荐的规格配置，并支持一键将参考值载入表单。
4. 编辑过程中，校验引擎会实时提示红色阻断错误与黄色警告。
5. 编辑完成后，点击 **「导出/下载配置」**，在弹窗中查看变更 Diff 并下载格式化后的配置。产出格式遵循规范包的 `outputFormat`，支持 `JSON`、`YAML`、`Properties`、`ENV`，默认是 `JSON`。
