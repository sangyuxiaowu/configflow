# ConfigSchemaPackage 数据模型契约（TypeScript）

生成规范包时，严格遵循以下类型定义。字段语义见各行注释。

```typescript
export type FieldType =
  | 'string'        // 普通单行文本
  | 'number'        // 数值 (支持范围、步长、单位)
  | 'boolean'       // 开关/布尔值
  | 'enum'          // 枚举单选 (含选项列表)
  | 'port'          // 网络端口 (1-65535 整数)
  | 'ip'            // IPv4 地址格式校验
  | 'url'           // HTTP/HTTPS 统一资源定位符
  | 'secret'        // 敏感机密 (密码/Token/私钥，默认脱敏遮罩)
  | 'array_string'  // 字符串数组 (如白名单域名列表、标签 Tags)
  | 'array_object'  // 对象数组 (如服务列表、集群节点列表，内嵌 itemFields)
  | 'object';       // 嵌套对象容器

export interface EnumOption {
  value: string | number; // 枚举实际值
  label: string;          // 显示名称 (如 "轮询调度")
  description?: string;   // 选项技术与业务含义说明
  badge?: string;         // 推荐/默认标记 (如 "推荐", "生产标配", "高危")
}

export interface FieldConstraints {
  min?: number;           // 最小值 (针对 number / port)
  max?: number;           // 最大值 (针对 number / port)
  step?: number;          // 调整步长
  unit?: string;          // 单位标签 (如 'ms', 's', 'MB', 'GB', 'Core', '个连接')
  minLength?: number;     // 字符串最小长度
  maxLength?: number;     // 字符串最大长度
  pattern?: string;       // 正则表达式字符串 (不含两侧斜杠)
  patternDescription?: string; // 正则含义中文提示
  options?: EnumOption[]; // 枚举选项列表 (当 type 为 'enum' 时必填)
  minItems?: number;      // 数组最小元素个数
  maxItems?: number;      // 数组最大元素个数
}

export interface FieldDefinition {
  id: string;               // 唯一标识 (英文下划线，如 "server_port")
  key: string;              // 字段真实 Key (如 "port")
  path: string;             // 字段完整点分路径 (如 "server.port" 或 "watchdog.services")
  label: string;            // 人性化中文标签 (如 "服务监听端口")
  description: string;      // 详细的业务意图与运维指引说明
  category: string;         // 所属分类名称 (必须与 categories 中的某一个 name 一致)
  type: FieldType;          // 字段类型
  required: boolean;        // 是否必填
  defaultValue: any;        // 默认初始值
  placeholder?: string;     // 输入占位符提示
  isSensitive?: boolean;    // 是否为敏感凭据 (密码、私钥、Token，默认脱敏遮罩)
  isDangerous?: boolean;    // 是否为高危参数 (红色醒目标识，防手滑误改)
  requiresRestart?: boolean;// 修改后是否需要重启生效 (黄色时钟标识，提醒维护窗口)
  constraints: FieldConstraints;
  itemFields?: FieldDefinition[]; // 当 type 为 'array_object' 时，定义列表子项的字段模板
  itemTitleKey?: string;    // 当 type 为 'array_object' 时，用于卡片主标题的子键名
  children?: FieldDefinition[];   // 当 type 为 'object' 时可选
}

export interface ReferenceExample {
  id: string;               // 唯一标识 (如 "ref_prod_ha")
  name: string;             // 架构方案名称 (如 "生产高可用集群 (Prod HA)")
  environment: 'production' | 'staging' | 'development' | 'testing';
  summary: string;          // 适用场景简要概述
  detailedNotes: string;    // 详细架构说明、参数调优理由与运维保障考量
  config: Record<string, any>; // 完整的配置 JSON 对象
  recommendedHardware?: string; // 推荐规格 (如 "8 Core / 32GB RAM / 10Gbps 网卡")
}

export interface ConfigCategory {
  id: string;               // 分类唯一标识 (如 "cat_network")
  name: string;             // 分类显示名称 (如 "基础网络与网关")
  description?: string;     // 分类职责与管理范围说明
  icon?: string;            // 可选图标名称
}

export interface ConfigSchemaPackage {
  id: string;               // 规范包唯一标识 (如 "pkg-gateway-service")
  name: string;             // 规范包名称 (如 "API 网关服务配置约束规范")
  version: string;          // 语义化版本号 (如 "1.0.0")
  outputFormat?: 'json' | 'yaml' | 'properties' | 'env'; // 业务配置产出格式，缺省为 JSON
  description: string;      // 规范包整体说明
  author: string;           // 制定团队或架构师姓名 (如 "基础架构平台组")
  updatedAt: string;        // 制定日期 (YYYY-MM-DD 格式)
  categories: ConfigCategory[];
  fields: FieldDefinition[];
  referenceExamples: ReferenceExample[];
  defaultConfig: Record<string, any>;
}
```

`outputFormat` 仅控制业务配置模板和最终配置的序列化格式；约束规范包本身仍以 JSON 导入、导出。Properties 使用点分层级键，ENV 使用大写下划线键并以 `__` 分隔层级；Properties/ENV 中数组和对象以 JSON 值编码。若多个字段路径归一化为同一个 ENV 变量名，导入或导出会报错以避免静默覆盖。

## 路径约定

- `path`：字段在配置 JSON 中的完整点分路径（`itemFields` 子字段除外，其 `path` 为相对属性名）。
- `key`：`path` 的末尾属性名。
- `defaultConfig` 及 `referenceExamples[].config` 中实际出现的键结构，必须能通过 `fields` 的 `path` 逐一还原。

机器可校验版本见 `schema-specification.json`（JSON Schema draft-07）；完整实例见 `sample-schema-package.json`。
