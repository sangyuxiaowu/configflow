---
name: opsconfig-schema-package
description: 生成与校验符合 OpsConfig Studio 规范的配置约束约定包（ConfigSchemaPackage JSON）。当用户要求依据业务架构需求、运维要求或既有配置文件（JSON/YAML/Properties/ENV）生成配置规范包、配置约束约定、ConfigSchemaPackage，或需要校验此类规范包的结构合法性时，使用本技能。
homepage: https://github.com/sangyuxiaowu/configflow
version: 1.0.0
author: sangyuxiaowu
metadata:
  openclaw:
    emoji: "🛠️"
---

# ConfigSchemaPackage 生成与校验

## 用途

根据业务需求描述、技术架构说明或既有配置文件（JSON / YAML / Properties / ENV），生成可被 OpsConfig Studio 直接导入与解析的标准化配置约束约定包（ConfigSchemaPackage JSON），并在交付前完成结构校验。

## 交付物要求

输出一个顶层为标准 JSON 对象的 ConfigSchemaPackage：

- 必须包含 `id`, `name`, `version`, `description`, `author`, `updatedAt`, `categories`, `fields`, `referenceExamples`, `defaultConfig`。
- `defaultConfig` 与 `referenceExamples[].config` 中的每个字段路径与键名，必须与 `fields` 中的 `path` / `key` 完全一致。
- `outputFormat` 可选，支持 `json`、`yaml`、`properties`、`env`，缺省按 `json`；该字段控制业务配置产出格式，约束规范包仍为 JSON。
- 仅输出合法的纯 JSON。系统识别条件：顶层含 `fields` 数组，且首个字段包含 `key` 或 `path`。

## 生成工作流

按以下 5 步执行：

1. **需求剖析与拓扑识别**：提炼配置所属技术栈（如 Spring Boot / Nginx / Redis / 微服务看门狗），归纳 3~6 个顶层业务类别（`categories`）。
2. **字段扁平化与层级展开**：为所有参数生成唯一 `key` 与点分路径 `path`（如 `database.connection.maxPoolSize`），映射为 11 种强类型之一，并赋予中文 `label` 与详细 `description`。
3. **约束加固与防呆标记**：补充 `min` / `max` / `unit` / `options` 等约束，并按"设计规则"设置安全标记。
4. **构造默认配置与多环境基线**：生成 `defaultConfig`（与各字段 `defaultValue` 完全对应）；在 `referenceExamples` 中构造至少 2 套参考方案——生产高可用（严谨高配、开启 TLS、调大连接池、启用熔断告警）与开发/单机（轻量低配、本地 IP、降低资源消耗），均提供 `recommendedHardware` 与面向运维的 `detailedNotes`。
5. **语法自检与输出**：将 JSON 落盘后运行 `scripts/validate_package.py <文件路径>` 校验，全部通过后再交付。

## 字段类型决策矩阵

| 业务场景 | 推荐 FieldType | 必需约束 | 安全标记 |
| :--- | :--- | :--- | :--- |
| HTTP/gRPC 监听端口 | `port` | `min: 1024, max: 65535, unit: "Port"` | `requiresRestart: true` |
| 服务绑定 IPv4 | `ip` | - | `requiresRestart: true` |
| 文档地址、回调 Webhook | `url` | - | - |
| 访问令牌、密码、私钥 | `secret` | `minLength: 6` | `isSensitive: true` |
| 连接池上限、Worker 数量 | `number` | `min: 1, max: 200, unit: "个"` | 影响过大时 `isDangerous: true` |
| 超时时间（毫秒/秒） | `number` | `min: 100, max: 60000, unit: "ms"` | - |
| 负载均衡模式、日志级别 | `enum` | `options: [...]` | - |
| 跨域域名白名单、Topic 列表 | `array_string` | `minItems: 0, maxItems: 50` | - |
| 监控节点列表、服务规则组 | `array_object` | `minItems: 1`, `itemFields`, `itemTitleKey` | - |
| 单个复杂对象 | `object` | `children: [...]` | - |

## 设计规则

### 分类
- 提取 3~6 个核心业务分组（如：基础网络与通信、数据存储与连接池、安全认证与白名单、性能调优与并发、日志监控与告警）。
- 每个 `field.category` 必须精确匹配 `categories` 数组中某一项的 `name`。

### 强类型与边界防呆
- 端口类：`type: 'port'`，设置 `constraints.min: 1024, max: 65535, unit: "Port"`。
- 时间与超时：`type: 'number'`，明确 `unit`（`"ms"` / `"秒"`）并设定合理上下限（如连接超时 500ms~30000ms）。
- 容量与连接数：`type: 'number'`，给出 `step` 与 `unit`（如 `"个连接"`、`"MB"`）；高并发参数过大可能压垮底层系统时标注 `isDangerous: true`。
- 枚举项：`type: 'enum'` 时 `constraints.options` 必须完整，每个选项含 `value`、`label`、`description`，关键选项提供 `badge`（如 `"推荐"`、`"默认"`）。
- 网络地址：独立 IP 用 `'ip'`，外链用 `'url'`。

### 安全与运维标记
- 密码、Token、API Key：`type: 'secret'` 且 `isSensitive: true`。
- 高危不可逆操作（禁用鉴权、清空缓存、关闭熔断、超时调 0 等）：`isDangerous: true`，并在 `description` 中明确警告。
- 需重启进程生效（监听端口、Worker 线程数、TLS 证书、内存上限等）：`requiresRestart: true`。

### 对象数组（array_object）
- `itemTitleKey` 指定卡片标题属性名（如 `"serviceName"`、`"NodeName"`）。
- `itemFields` 完整定义子字段规范（子字段 `path` 为相对属性名，如 `"Port"`）。
- `defaultValue` 中提供至少 1~2 个代表性子项对象。

### 默认配置镜像
- `defaultConfig` 是系统初始化/重置使用的完整 JSON 对象，其中每个值必须与 `fields` 中各字段声明的 `defaultValue` 结构完全对应。

## 交付前自查清单

生成最终 JSON 前，逐项核对：

1. 根节点包含全部 10 个必需属性。
2. 每个 `fields[i].category` 在 `categories[].name` 中存在。
3. `path` 为点分完整路径（如 `db.pool.maxConnections`），`key` 为末尾属性名（如 `maxConnections`）。
4. `type == 'enum'` 时 `constraints.options` 为含 `value` 和 `label` 的数组。
5. `type == 'array_object'` 时已设置 `itemTitleKey` 并提供 `itemFields`。
6. 敏感项 `isSensitive: true`、高危项 `isDangerous: true`、重启项 `requiresRestart: true` 标记到位。
7. `defaultConfig` 所有字段路径均能对应到 `fields` 定义，且值与 `defaultValue` 一致。
8. `referenceExamples` 至少 2 套（如 `production` 与 `development`），其 `config` 完整合规。

以上 1~8 项已由 `scripts/validate_package.py` 自动检查，以脚本通过为准。

## 参考资源

| 文件 | 用途 |
|---|---|
| `references/data-model.md` | 完整 TypeScript 数据模型契约（FieldType / FieldConstraints / FieldDefinition / ReferenceExample / ConfigSchemaPackage） |
| `references/schema-specification.json` | JSON Schema（draft-07），机器可校验的结构定义 |
| `references/sample-schema-package.json` | 完整黄金范例（企业级 API 网关服务规范包） |
| `scripts/validate_package.py` | 交付前结构校验脚本（纯 Python 标准库，无需安装依赖） |

完整字段契约与范例不在本文件中展开；生成时按需读取 `references/` 下对应文件。

## 交付物使用

交付物可以直接在 https://sangyuxiaowu.github.io/configflow/ 中使用，帮助运维人员快速生成系统配置和管理配置项，提升配置管理效率并减少人为错误。