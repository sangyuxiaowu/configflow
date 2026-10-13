# OpsConfig Studio Skills 技能库

本目录包含用于指导 AI Agent（如 WorkBuddy、Claude Code、Cursor 等支持 SKILL.md 规范的智能体）的**技能 (Skills) 与配置约定规范 (Config Contract Specifications)**。

---

## 📂 目录结构

```text
skills/
├── README.md                                # Skills 目录总览与使用说明 (本文档)
└── opsconfig-schema-package/                # 核心技能：配置约束约定 JSON 生成与校验
    ├── SKILL.md                             # 技能入口：触发条件、生成工作流、设计规则 (核心执行文件)
    ├── references/                          # 参考资源 (按需加载)
    │   ├── data-model.md                    # TypeScript 数据模型契约 (FieldType / FieldDefinition 等)
    │   ├── schema-specification.json        # 标准 JSON Schema (Draft-07) 校验规范
    │   └── sample-schema-package.json       # 生产级参考规范 JSON 样例 (可直接导入验证)
    └── scripts/
        └── validate_package.py              # 交付前结构校验脚本 (纯 Python 标准库)
```

---

## 🎯 核心功能：生成并校验配置约定 JSON

在日常研发与运维工作中，手动编写包含类型、边界、说明、默认值以及多环境基线的 JSON 规范成本较高。本技能让 AI Agent 根据业务需求或现有配置直接输出标准 `ConfigSchemaPackage` JSON 文件，并在交付前自动完成结构校验。

### 适用场景
1. **现有配置文件迁移**：将手写的 `config.json`、`application.yml` 或 `.env` 交给 Agent，转化为附带中文文档与校验规则的规范文件。
2. **全新系统架构设计**：根据需求文档（如"设计一个高并发网关的配置"），自动推导端口范围、连接池上限、枚举策略与多环境基线。
3. **IDE / Agent 集成**：在支持 Skills 规范的智能体中加载 `skills/opsconfig-schema-package/`，实现自动化配置治理。

---

## 🚀 快速上手三步法

### 步骤 1：准备需求或原始配置
准备好配置要求描述，或直接提供现有的配置文件（JSON / YAML / Properties / ENV）。

### 步骤 2：交给 Agent 生成
让已加载本技能的 Agent 执行生成，例如：

> "根据以下业务架构需求，生成一份 ConfigSchemaPackage 规范包"

Agent 将按 `SKILL.md` 中的 5 步工作流执行：需求剖析 → 字段展开 → 约束加固 → 多环境基线 → 校验输出。

### 步骤 3：校验并导入 OpsConfig Studio
1. 运行校验脚本确认结构合法：
   ```bash
   python skills/opsconfig-schema-package/scripts/validate_package.py <生成的文件>.json
   ```
2. 打开 OpsConfig Studio 前端系统。
3. 进入 **「开发端 (Schema 规则设计)」** 或 **「运维端 (可视化安全编辑)」**。
4. 点击 **「载入约束规范」**，系统将自动识别标准规范包并渲染出全功能的类型安全可视化工作台。
