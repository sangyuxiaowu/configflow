import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type ConfigFormat = 'json' | 'yaml' | 'properties' | 'env';

function parseScalar(value: string): any {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^(true|false|null|~)$/i.test(trimmed)) {
    return trimmed.toLowerCase() === '~' ? null : JSON.parse(trimmed.toLowerCase());
  }
  if (/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    const unquoted = trimmed.slice(1, -1);
    return trimmed.startsWith('"') ? JSON.parse(trimmed) : unquoted.replace(/''/g, "'");
  }
  return trimmed;
}

function insertPath(target: Record<string, any>, path: string[], value: any): void {
  let current = target;
  for (const segment of path.slice(0, -1)) {
    if (!segment) continue;
    if (!current[segment] || typeof current[segment] !== 'object' || Array.isArray(current[segment])) {
      current[segment] = {};
    }
    current = current[segment];
  }
  const leaf = path[path.length - 1];
  if (leaf) current[leaf] = value;
}

function parseProperties(text: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = text.replace(/\\\r?\n/g, '').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
    let separator = -1;
    let escaped = false;
    for (let index = 0; index < line.length; index += 1) {
      if (escaped) {
        escaped = false;
      } else if (line[index] === '\\') {
        escaped = true;
      } else if (/[=:\s]/.test(line[index])) {
        separator = index;
        break;
      }
    }
    const key = (separator < 0 ? line : line.slice(0, separator)).trim();
    const value = separator < 0 ? '' : line.slice(separator).replace(/^[=:\s]+/, '');
    if (!key) continue;
    const unescape = (part: string) => part.replace(/\\(u[\da-fA-F]{4}|.)/g, (_match, escapedChar: string) => {
      if (escapedChar.startsWith('u')) return String.fromCharCode(parseInt(escapedChar.slice(1), 16));
      return ({ n: '\n', r: '\r', t: '\t', f: '\f' } as Record<string, string>)[escapedChar] ?? escapedChar;
    });
    const unescapedValue = unescape(value);
    const trimmedValue = unescapedValue.trim();
    const parsedValue = /^["[{]/.test(trimmedValue)
      ? parseScalar(trimmedValue)
      : trimmedValue === unescapedValue
        ? parseScalar(unescapedValue)
        : unescapedValue;
    insertPath(result, key.split('.').map(unescape), parsedValue);
  }
  return result;
}

function envKeyForPath(path: string): string {
  return path
    .split('.')
    .map((part) => part.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase())
    .join('__');
}

function parseEnv(text: string, knownPaths: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  const knownEnvPaths = new Map<string, string>();
  for (const path of knownPaths) {
    const envKey = envKeyForPath(path);
    const existingPath = knownEnvPaths.get(envKey);
    if (existingPath && existingPath !== path) {
      throw new Error(`ENV variable name collision: ${existingPath} and ${path} both map to ${envKey}`);
    }
    knownEnvPaths.set(envKey, path);
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const assignment = trimmed.replace(/^export\s+/, '').match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!assignment) continue;
    const [, key, rawValue] = assignment;
    const value = rawValue.trim();
    const parsedValue = parseScalar(value);
    const knownPath = knownEnvPaths.get(key.toUpperCase());
    insertPath(result, (knownPath || key).split(knownPath ? '.' : '__'), parsedValue);
  }
  return result;
}

export function parseConfigText(text: string, format: ConfigFormat, knownPaths: string[] = []): any {
  switch (format) {
    case 'json':
      return JSON.parse(text);
    case 'yaml':
      return parseYaml(text);
    case 'properties':
      return parseProperties(text);
    case 'env':
      return parseEnv(text, knownPaths);
  }
}

function scalarText(value: any): string {
  if (typeof value === 'string') {
    if (/^(true|false|null|~)$/i.test(value) || /^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(value) || /^[\[{"']/.test(value)) {
      return JSON.stringify(value);
    }
    return value;
  }
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeProperties(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/ /g, '\\ ')
    .replace(/([=:#!])/g, '\\$1');
}

function escapePropertiesValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f')
    .replace(/^ +/, (spaces) => '\\ '.repeat(spaces.length));
}

function serializePropertyValue(value: any): string {
  if (typeof value !== 'string') return JSON.stringify(value) ?? 'null';
  if (/^(true|false|null|~)$/i.test(value) || /^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(value) || /^["[{']/.test(value)) {
    return JSON.stringify(value);
  }
  return escapePropertiesValue(value);
}

function flattenConfig(value: any, path: string[] = [], entries: Array<[string, any]> = []): Array<[string, any]> {
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
    for (const [key, child] of Object.entries(value)) flattenConfig(child, [...path, key], entries);
  } else {
    entries.push([path.join('.'), value]);
  }
  return entries;
}

function stringifyProperties(config: Record<string, any>): string {
  return flattenConfig(config)
    .filter(([key]) => key)
    .map(([key, value]) => `${escapeProperties(key)}=${serializePropertyValue(value)}`)
    .join('\n');
}

function stringifyEnv(config: Record<string, any>): string {
  const entries = flattenConfig(config).filter(([key]) => key);
  const pathsByEnvKey = new Map<string, string>();
  for (const [path] of entries) {
    const envKey = envKeyForPath(path);
    const existingPath = pathsByEnvKey.get(envKey);
    if (existingPath && existingPath !== path) {
      throw new Error(`ENV variable name collision: ${existingPath} and ${path} both map to ${envKey}`);
    }
    pathsByEnvKey.set(envKey, path);
  }
  return entries
    .map(([key, value]) => `${envKeyForPath(key)}=${typeof value === 'string' ? JSON.stringify(value) : scalarText(value)}`)
    .join('\n');
}

export function detectConfigFormat(filename: string, fallback: ConfigFormat = 'json'): ConfigFormat {
  const cleanName = filename.split(/[?#]/, 1)[0].toLowerCase();
  if (/(^|\/)\.env(?:\.|$)/.test(cleanName) || cleanName.endsWith('.env')) return 'env';
  const extension = cleanName.split('.').pop();
  if (extension === 'yaml' || extension === 'yml') return 'yaml';
  if (extension === 'properties') return 'properties';
  if (extension === 'env') return 'env';
  if (extension === 'json') return 'json';
  return fallback;
}

export function detectConfigFormatFromContent(text: string, fallback: ConfigFormat = 'json'): ConfigFormat {
  const content = text.trim();
  if (!content) return fallback;
  if (/^[{[]/.test(content)) return 'json';

  const lines = content.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith('#'));
  const equalsAssignments = lines.flatMap((line) => {
    const match = line.trim().replace(/^export\s+/, '').match(/^([^=]+?)\s*=/);
    return match ? [match[1].trim()] : [];
  });
  if (equalsAssignments.length > 0) {
    return equalsAssignments.every((key) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) ? 'env' : 'properties';
  }
  if (lines.some((line) => /^\s*[^#!\s][^:=\s]*:[^\s]/.test(line))) return 'properties';
  if (lines.some((line) => /^\s*(?:[^#\s][^:]*:\s*|-)\s*(?:$|\S)/.test(line))) return 'yaml';
  return fallback;
}

export function stringifyConfig(config: Record<string, any>, format: ConfigFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(config, null, 2);
    case 'yaml':
      return stringifyYaml(config, { indent: 2 });
    case 'properties':
      return stringifyProperties(config);
    case 'env':
      return stringifyEnv(config);
  }
}

export function configFileExtension(format: ConfigFormat): string {
  return format === 'yaml' ? 'yml' : format;
}