/**
 * 配置文件编写系统 - 核心类型定义
 */

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'port'
  | 'ip'
  | 'url'
  | 'secret'
  | 'array_string'
  | 'array_object'
  | 'object';

export interface EnumOption {
  value: string | number;
  label: string;
  description?: string;
  badge?: string;
}

export interface FieldConstraints {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternDescription?: string;
  options?: EnumOption[];
  minItems?: number;
  maxItems?: number;
}

export interface FieldDefinition {
  id: string;
  key: string;               // 字段原始Key，如 'Port' 或 'Services'
  path: string;              // 字段路径，如 'Watchdog.Services'
  label: string;             // 中文显示标签，如 '服务监控列表'
  description: string;       // 详细业务与技术说明
  category: string;          // 所属分组，如 '看门狗服务', '基础网络'
  type: FieldType;
  required: boolean;
  defaultValue: any;
  placeholder?: string;
  isSensitive?: boolean;     // 敏感配置（密码、Token等）
  isDangerous?: boolean;     // 高危参数
  requiresRestart?: boolean; // 是否需重启服务才能生效
  constraints: FieldConstraints;
  // 对象数组 (array_object) 的子项模板规范定义
  itemFields?: FieldDefinition[];
  // 作为卡片展示标题的子键名（如 'ServiceName' 或 'name'）
  itemTitleKey?: string;
  children?: FieldDefinition[];
}

export interface ReferenceExample {
  id: string;
  name: string;             // 样例名称，如 "生产高可用集群 (Prod HA)"
  environment: 'production' | 'staging' | 'development' | 'testing';
  summary: string;          // 适用场景简述
  detailedNotes: string;    // 详细架构说明与配置考量（面向运维）
  config: Record<string, any>; // 完整的配置 JSON 对象
  recommendedHardware?: string; // 推荐规格
}

export interface ConfigCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface ConfigSchemaPackage {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  updatedAt: string;
  categories: ConfigCategory[];
  fields: FieldDefinition[];
  referenceExamples: ReferenceExample[];
  defaultConfig: Record<string, any>;
}

export interface ValidationError {
  path: string;
  fieldLabel: string;
  message: string;
  level: 'error' | 'warning';
}

export interface DiffItem {
  path: string;
  label: string;
  category: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'modified' | 'removed' | 'unchanged';
}
