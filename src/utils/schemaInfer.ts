import { ConfigCategory, FieldDefinition, FieldType, ConfigSchemaPackage } from '../types/config';
import type { Language } from '../i18n/types';

// 常见通用计算机与系统运维键名翻译字典
const COMMON_KEY_LABELS: Record<string, { label: string; desc: string; category?: string; unit?: string }> = {
  port: { label: '监听/通信端口', desc: '网络通信端口 (1024-65535)', category: '基础网络', unit: 'Port' },
  host: { label: '主机名/监听IP', desc: '网络接口或IP绑定地址', category: '基础网络' },
  env: { label: '部署环境', desc: '环境标识 (prod/staging/dev)', category: '基础信息' },
  name: { label: '名称/标识', desc: '唯一标识名', category: '基础信息' },
  version: { label: '版本号', desc: '语义化发布版本', category: '基础信息' },
  timeout: { label: '超时时间', desc: '网络请求或操作的超时阈值', category: '性能与超时', unit: 'ms' },
  timeoutms: { label: '超时时间 (毫秒)', desc: '超时等待时间', category: '性能与超时', unit: 'ms' },
  timeoutseconds: { label: '超时时间 (秒)', desc: '超时等待秒数', category: '性能与超时', unit: '秒' },
  maxconnections: { label: '最大连接数', desc: '连接池或并发连接上限', category: '连接池', unit: '个' },
  minconnections: { label: '最小空闲连接数', desc: '连接池常驻连接数', category: '连接池', unit: '个' },
  workers: { label: '工作进程/Worker数', desc: '并发工作进程数量', category: '性能与并发', unit: '核' },
  concurrency: { label: '并发处理度', desc: '任务并发量', category: '性能与并发', unit: '条/秒' },
  loglevel: { label: '日志输出级别', desc: '日志详细粒度过滤', category: '日志监控' },
  enabletls: { label: '启用 TLS 加密', desc: '是否强制开启链路加密传输', category: '安全防护' },
  ssl: { label: 'SSL/TLS 加密设置', desc: '传输层加密配置', category: '安全防护' },
  password: { label: '认证密码', desc: '系统访问认证密码凭据', category: '安全防护' },
  secret: { label: '安全密钥', desc: '用于签名或加密解密的密钥', category: '安全防护' },
  token: { label: '访问令牌 Token', desc: 'API 接口鉴权凭证', category: '安全防护' },
};

const COMMON_KEY_LABELS_EN: typeof COMMON_KEY_LABELS = {
  port: { label: 'Listening / Communication Port', desc: 'Network communication port (1024-65535)', category: 'Networking', unit: 'Port' },
  host: { label: 'Hostname / Listening IP', desc: 'Network interface or IP binding address', category: 'Networking' },
  env: { label: 'Deployment Environment', desc: 'Environment identifier (prod/staging/dev)', category: 'General' },
  name: { label: 'Name / Identifier', desc: 'Unique identifier', category: 'General' },
  version: { label: 'Version', desc: 'Semantic release version', category: 'General' },
  timeout: { label: 'Timeout', desc: 'Timeout threshold for requests or operations', category: 'Performance & Timeouts', unit: 'ms' },
  timeoutms: { label: 'Timeout (Milliseconds)', desc: 'Timeout duration', category: 'Performance & Timeouts', unit: 'ms' },
  timeoutseconds: { label: 'Timeout (Seconds)', desc: 'Timeout duration in seconds', category: 'Performance & Timeouts', unit: 's' },
  maxconnections: { label: 'Maximum Connections', desc: 'Connection pool or concurrency limit', category: 'Connection Pool', unit: 'connections' },
  minconnections: { label: 'Minimum Idle Connections', desc: 'Persistent connections in the pool', category: 'Connection Pool', unit: 'connections' },
  workers: { label: 'Worker Count', desc: 'Number of concurrent workers', category: 'Performance & Concurrency', unit: 'cores' },
  concurrency: { label: 'Concurrency', desc: 'Concurrent task throughput', category: 'Performance & Concurrency', unit: 'items/s' },
  loglevel: { label: 'Log Level', desc: 'Log verbosity filter', category: 'Logging & Monitoring' },
  enabletls: { label: 'Enable TLS', desc: 'Require encrypted transport', category: 'Security' },
  ssl: { label: 'SSL / TLS Settings', desc: 'Transport encryption settings', category: 'Security' },
  password: { label: 'Authentication Password', desc: 'System access password', category: 'Security' },
  secret: { label: 'Secret Key', desc: 'Signing or encryption key', category: 'Security' },
  token: { label: 'Access Token', desc: 'API authentication credential', category: 'Security' },
};

/**
 * 转换 camelCase / PascalCase / snake_case 为友好显示名称
 */
export function formatKeyToLabel(key: string, language: Language = 'zh'): string {
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(language === 'en' ? COMMON_KEY_LABELS_EN : COMMON_KEY_LABELS)) {
    if (lower === k || lower.endsWith(k)) {
      return v.label;
    }
  }

  // 分词处理 (PascalCase / camelCase / snake_case)
  const result = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * 自动推断所属分组
 */
export function inferCategory(key: string, path: string, language: Language = 'zh'): string {
  const lower = (key + '.' + path).toLowerCase();
  const rootPart = path.split('.')[0] || '';

  if (lower.includes('db') || lower.includes('database') || lower.includes('mysql') || lower.includes('postgres') || lower.includes('sql') || lower.includes('mongo')) {
    return language === 'en' ? 'Databases & Storage' : '数据库与存储';
  }
  if (lower.includes('redis') || lower.includes('cache') || lower.includes('memcached')) {
    return language === 'en' ? 'Cache & Memory' : '缓存与内存';
  }
  if (lower.includes('log') || lower.includes('trace') || lower.includes('monitor') || lower.includes('metric') || lower.includes('probe')) {
    return language === 'en' ? 'Logging & Monitoring' : '日志与监控探测';
  }
  if (lower.includes('security') || lower.includes('auth') || lower.includes('ssl') || lower.includes('tls') || lower.includes('cors') || lower.includes('secret') || lower.includes('password') || lower.includes('token')) {
    return language === 'en' ? 'Security & Authentication' : '安全策略与认证';
  }
  if (lower.includes('server') || lower.includes('http') || lower.includes('port') || lower.includes('host') || lower.includes('network') || lower.includes('gateway')) {
    return language === 'en' ? 'Networking & Gateways' : '基础网络与网关';
  }
  if (lower.includes('queue') || lower.includes('mq') || lower.includes('kafka') || lower.includes('rabbit') || lower.includes('worker')) {
    return language === 'en' ? 'Messaging & Work Queues' : '消息与工作队列';
  }

  if (rootPart) {
    return formatKeyToLabel(rootPart, language);
  }
  return language === 'en' ? 'Core Settings' : '核心业务配置';
}

/**
 * 猜测字段的详细类型
 */
export function inferFieldType(key: string, value: any): FieldType {
  const lowerKey = key.toLowerCase();

  if (typeof value === 'boolean') return 'boolean';

  if (typeof value === 'number') {
    if (lowerKey.includes('port') && value > 0 && value <= 65535) {
      return 'port';
    }
    return 'number';
  }

  if (typeof value === 'string') {
    if (lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token') || lowerKey.includes('key')) {
      return 'secret';
    }
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return 'url';
    }
    // IPv4 校验
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
      return 'ip';
    }
    return 'string';
  }

  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      return 'array_object';
    }
    return 'array_string';
  }

  if (typeof value === 'object' && value !== null) {
    return 'object';
  }

  return 'string';
}

/**
 * 从对象数组推断子项的规范结构（完全通用，无任何硬编码）
 */
export function inferItemFieldsFromArray(
  items: Array<Record<string, any>>,
  parentPath: string,
  parentCategory: string,
  language: Language = 'zh'
): { itemFields: FieldDefinition[]; itemTitleKey: string } {
  const allKeys = new Set<string>();
  const keyFrequency: Record<string, number> = {};
  const keyValues: Record<string, any[]> = {};

  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      for (const [k, v] of Object.entries(item)) {
        allKeys.add(k);
        keyFrequency[k] = (keyFrequency[k] || 0) + 1;
        if (!keyValues[k]) keyValues[k] = [];
        keyValues[k].push(v);
      }
    }
  }

  // 智能寻找代表名称的 key (如 ServiceName, name, title, id, key 等)
  let itemTitleKey = '';
  for (const candidate of Array.from(allKeys)) {
    const cLower = candidate.toLowerCase();
    if (cLower.includes('name') || cLower.includes('title') || cLower === 'id' || cLower.includes('service')) {
      itemTitleKey = candidate;
      break;
    }
  }
  if (!itemTitleKey && allKeys.size > 0) {
    itemTitleKey = Array.from(allKeys)[0];
  }

  const itemFields: FieldDefinition[] = [];

  for (const key of Array.from(allKeys)) {
    const values = keyValues[key] || [];
    const sampleVal = values.find(v => v !== undefined && v !== null) ?? '';
    const type = inferFieldType(key, sampleVal);
    const keyInfo = (language === 'en' ? COMMON_KEY_LABELS_EN : COMMON_KEY_LABELS)[key.toLowerCase()] || {};
    const isRequired = keyFrequency[key] === items.length;
    const isPort = type === 'port' || key.toLowerCase().includes('port');
    const isIp = type === 'ip' || key.toLowerCase() === 'host';

    // 如果多次出现且为特定字符串，搜集候选枚举
    let enumOptions = undefined;
    if (type === 'string' && (key.toLowerCase().includes('mode') || key.toLowerCase().includes('type') || key.toLowerCase().includes('protocol'))) {
      const distinctVals = Array.from(new Set(values.map(v => String(v)).filter(Boolean)));
      if (distinctVals.length > 0 && distinctVals.length <= 10) {
        enumOptions = distinctVals.map(val => ({
          value: val,
          label: val,
          description: language === 'en' ? `Option value: ${val}` : `选项值: ${val}`
        }));
      }
    }

    itemFields.push({
      id: `${parentPath}_item_${key}`,
      key,
      path: key,
      label: keyInfo.label || formatKeyToLabel(key, language),
      description: keyInfo.desc || (language === 'en' ? `Configuration field "${key}"` : `配置项「${key}」`),
      category: parentCategory,
      type: isPort ? 'port' : (isIp ? 'ip' : (enumOptions ? 'enum' : type)),
      required: isRequired,
      defaultValue: sampleVal,
      isDangerous: key.toLowerCase().includes('danger') || key.toLowerCase().includes('freeze'),
      isSensitive: key.toLowerCase().includes('pass') || key.toLowerCase().includes('secret'),
      requiresRestart: false,
      constraints: {
        unit: keyInfo.unit || (typeof sampleVal === 'number' && key.toLowerCase().includes('second') ? (language === 'en' ? 's' : '秒') : undefined),
        min: typeof sampleVal === 'number' ? (isPort ? 1 : 0) : undefined,
        max: typeof sampleVal === 'number' ? (isPort ? 65535 : undefined) : undefined,
        options: enumOptions
      }
    });
  }

  return { itemFields, itemTitleKey };
}

/**
 * 从原始 JSON 对象递归解析出字段定义树，通用展开所有层级
 */
export function inferSchemaFromJson(
  rawJson: Record<string, any>,
  language: Language = 'zh'
): { fields: FieldDefinition[]; categories: ConfigCategory[] } {
  const fields: FieldDefinition[] = [];
  const categorySet = new Set<string>();

  function traverse(obj: Record<string, any>, currentPath: string, parentCategory?: string) {
    for (const [key, val] of Object.entries(obj)) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      const type = inferFieldType(key, val);
      const keyInfo = (language === 'en' ? COMMON_KEY_LABELS_EN : COMMON_KEY_LABELS)[key.toLowerCase()] || {};
      const category = parentCategory || keyInfo.category || inferCategory(key, fullPath, language);
      categorySet.add(category);

      // 如果是纯嵌套 Object (不是数组)，继续深入递归
      if (type === 'object' && val && typeof val === 'object' && !Array.isArray(val)) {
        traverse(val, fullPath, category);
        continue;
      }

      // 如果是对象数组 (例如 Services, Nodes, Clusters)
      if (type === 'array_object' && Array.isArray(val)) {
        const { itemFields, itemTitleKey } = inferItemFieldsFromArray(val, fullPath.replace(/\./g, '_'), category, language);

        const arrayField: FieldDefinition = {
          id: fullPath.replace(/\./g, '_'),
          key,
          path: fullPath,
          label: keyInfo.label || formatKeyToLabel(key, language),
          description: keyInfo.desc || (language === 'en' ? `Configuration list "${key}" containing multiple objects` : `配置列表「${key}」，包含多个子对象`),
          category,
          type: 'array_object',
          required: true,
          defaultValue: val,
          isDangerous: false,
          requiresRestart: false,
          constraints: {
            minItems: 1,
            maxItems: 50,
          },
          itemFields,
          itemTitleKey,
        };

        fields.push(arrayField);
        continue;
      }

      // 普通标量字段
      const isPort = type === 'port' || key.toLowerCase().includes('port');
      const isDangerous = key.toLowerCase().includes('danger') || key.toLowerCase().includes('freeze');
      const isSensitive = type === 'secret' || key.toLowerCase().includes('pass') || key.toLowerCase().includes('secret');

      const field: FieldDefinition = {
        id: fullPath.replace(/\./g, '_'),
        key,
        path: fullPath,
        label: keyInfo.label || formatKeyToLabel(key, language),
        description: keyInfo.desc || (language === 'en' ? `Configuration field ${key}, initial value: ${JSON.stringify(val)}` : `配置项 ${key}，初值: ${JSON.stringify(val)}`),
        category,
        type: isPort ? 'port' : type,
        required: true,
        defaultValue: val,
        isSensitive,
        isDangerous,
        requiresRestart: ['port', 'host'].includes(key.toLowerCase()),
        constraints: {
          unit: keyInfo.unit || (typeof val === 'number' && key.toLowerCase().includes('second') ? (language === 'en' ? 's' : '秒') : typeof val === 'number' && key.toLowerCase().includes('ms') ? 'ms' : undefined),
          min: typeof val === 'number' ? (isPort ? 1 : 0) : undefined,
          max: typeof val === 'number' ? (isPort ? 65535 : undefined) : undefined,
          step: typeof val === 'number' ? 1 : undefined,
          options: type === 'enum' ? [
            { value: val, label: `${val}` },
          ] : undefined
        }
      };

      fields.push(field);
    }
  }

  traverse(rawJson, '');

  const categories: ConfigCategory[] = Array.from(categorySet).map(c => ({
    id: c,
    name: c,
    description: language === 'en' ? `System configuration for ${c}` : `${c}相关系统配置项`
  }));

  return { fields, categories };
}

/**
 * 根据点路径读取嵌套对象的值
 */
export function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * 根据点路径设置嵌套对象的值（深拷贝安全）
 */
export function setValueByPath(obj: any, path: string, value: any): any {
  const result = JSON.parse(JSON.stringify(obj || {}));
  const parts = path.split('.');
  let current = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return result;
}

/**
 * 递归对比两份配置，生成 Diff 变更明细
 */
export function calculateConfigDiff(
  oldConfig: Record<string, any>,
  newConfig: Record<string, any>,
  fields: FieldDefinition[]
): {
  items: Array<{
    path: string;
    label: string;
    category: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'modified' | 'unchanged';
  }>;
  hasChanges: boolean;
  modifiedCount: number;
} {
  const items: Array<{
    path: string;
    label: string;
    category: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'modified' | 'unchanged';
  }> = [];

  let modifiedCount = 0;

  for (const field of fields) {
    const oldVal = getValueByPath(oldConfig, field.path);
    const newVal = getValueByPath(newConfig, field.path);

    const oldStr = JSON.stringify(oldVal);
    const newStr = JSON.stringify(newVal);

    if (oldVal === undefined && newVal !== undefined) {
      items.push({
        path: field.path,
        label: field.label,
        category: field.category,
        oldValue: oldVal,
        newValue: newVal,
        type: 'added'
      });
      modifiedCount++;
    } else if (oldVal !== undefined && newVal === undefined) {
      items.push({
        path: field.path,
        label: field.label,
        category: field.category,
        oldValue: oldVal,
        newValue: newVal,
        type: 'removed'
      });
      modifiedCount++;
    } else if (oldStr !== newStr) {
      items.push({
        path: field.path,
        label: field.label,
        category: field.category,
        oldValue: oldVal,
        newValue: newVal,
        type: 'modified'
      });
      modifiedCount++;
    } else {
      items.push({
        path: field.path,
        label: field.label,
        category: field.category,
        oldValue: oldVal,
        newValue: newVal,
        type: 'unchanged'
      });
    }
  }

  return {
    items,
    hasChanges: modifiedCount > 0,
    modifiedCount
  };
}

export function flattenFields(fields: FieldDefinition[]): FieldDefinition[] {
  return fields;
}

/**
 * 智能解析开发交付的约束规范文件 (ConfigSchemaPackage) 或从普通 JSON 中推断规范
 */
export function resolveSchemaPackageFromJson(
  parsedJson: any,
  fallbackName?: string,
  sourceUrl?: string,
  language: Language = 'zh'
): {
  schemaPackage: ConfigSchemaPackage;
  isStandardSchema: boolean;
  configData: Record<string, any>;
} {
  // 1. 判断是否为开发导出的标准化配置约束规范包 (ConfigSchemaPackage)
  const isStandardSchema = Boolean(
    parsedJson &&
      typeof parsedJson === 'object' &&
      !Array.isArray(parsedJson) &&
      Array.isArray(parsedJson.fields) &&
      parsedJson.fields.length > 0 &&
      parsedJson.fields[0] &&
      (parsedJson.fields[0].path !== undefined || parsedJson.fields[0].key !== undefined)
  );

  if (isStandardSchema) {
    const rawCategories: ConfigCategory[] = Array.isArray(parsedJson.categories)
      ? parsedJson.categories
      : [];
    const fields: FieldDefinition[] = parsedJson.fields;

    // 确保包含所有字段中出现的 category
    const categorySet = new Set(rawCategories.map((c) => c.name));
    for (const f of fields) {
      if (f.category && !categorySet.has(f.category)) {
        rawCategories.push({
          id: `cat_${f.category}`,
          name: f.category,
        });
        categorySet.add(f.category);
      }
    }

    const defaultConfig =
      parsedJson.defaultConfig && typeof parsedJson.defaultConfig === 'object'
        ? parsedJson.defaultConfig
        : parsedJson.referenceExamples?.[0]?.config || {};

    const schemaPackage: ConfigSchemaPackage = {
      id: parsedJson.id || `pkg-${Date.now()}`,
      name: parsedJson.name || fallbackName || (language === 'en' ? 'Developer Configuration Schema' : '开发交付配置约束规范'),
      version: parsedJson.version || '1.0.0',
      description:
        parsedJson.description ||
        (sourceUrl
          ? (language === 'en' ? `Schema loaded from: ${sourceUrl}` : `从远程地址加载的约束规范: ${sourceUrl}`)
          : (language === 'en' ? 'Developer configuration rules and baselines' : '开发团队交付的配置规则与约束基线')),
      author: parsedJson.author || (language === 'en' ? 'Development Team' : '系统开发团队'),
      updatedAt: parsedJson.updatedAt || new Date().toISOString().split('T')[0],
      categories: rawCategories,
      fields,
      referenceExamples: Array.isArray(parsedJson.referenceExamples)
        ? parsedJson.referenceExamples
        : [],
      defaultConfig,
    };

    return {
      schemaPackage,
      isStandardSchema: true,
      configData: JSON.parse(JSON.stringify(defaultConfig)),
    };
  }

  // 2. 普通业务配置 JSON：自动逆向推断基础约束模型
  const { fields, categories } = inferSchemaFromJson(parsedJson, language);
  const autoName = fallbackName || (language === 'en' ? 'Service Configuration Schema' : '业务系统配置约束规范');
  const autoPkg: ConfigSchemaPackage = {
    id: `pkg-${Date.now()}`,
    name: autoName,
    version: '1.0.0',
    description: sourceUrl
      ? (language === 'en' ? `Schema inferred from remote data: ${sourceUrl}` : `从远程数据自动推断生成的约束规则: ${sourceUrl}`)
      : (language === 'en' ? 'Field boundaries and constraints inferred from imported configuration' : '从载入的数据中自动逆向识别的字段边界与约束规范'),
    author: language === 'en' ? 'Schema Inference Engine' : '规范推断引擎',
    updatedAt: new Date().toISOString().split('T')[0],
    categories,
    fields,
    referenceExamples: [
      {
        id: `ref-orig-${Date.now()}`,
        name: language === 'en' ? 'Initial Baseline' : '初始基准版本',
        environment: 'production',
        summary: language === 'en' ? 'Configuration snapshot at initial import' : '初次载入时的基准数据快照',
        detailedNotes: sourceUrl
          ? (language === 'en' ? `Source: ${sourceUrl}` : `来源: ${sourceUrl}`)
          : (language === 'en' ? 'Generated from initial configuration data.' : '由初始配置数据生成。'),
        config: parsedJson,
      },
    ],
    defaultConfig: parsedJson,
  };

  return {
    schemaPackage: autoPkg,
    isStandardSchema: false,
    configData: JSON.parse(JSON.stringify(parsedJson)),
  };
}
