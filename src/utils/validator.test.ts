import { describe, expect, it } from 'vitest';
import type { FieldDefinition } from '../types/config';
import { validateConfigAgainstSchema } from './validator';

function field(
  overrides: Partial<FieldDefinition> & Pick<FieldDefinition, 'path' | 'type'>,
): FieldDefinition {
  const pathParts = overrides.path.split('.');
  return {
    ...overrides,
    id: overrides.id ?? overrides.path,
    key: overrides.key ?? pathParts[pathParts.length - 1],
    path: overrides.path,
    label: overrides.label ?? overrides.path,
    description: overrides.description ?? '',
    category: overrides.category ?? '',
    type: overrides.type,
    required: overrides.required ?? false,
    defaultValue: overrides.defaultValue,
    constraints: overrides.constraints ?? {},
  };
}

describe('validateConfigAgainstSchema', () => {
  it('checks required values, numeric bounds, and port warnings', () => {
    const fields = [
      field({ path: 'service.name', type: 'string', required: true }),
      field({ path: 'service.tags', type: 'array_string', required: true }),
      field({ path: 'service.note', type: 'string' }),
      field({ path: 'service.retries', type: 'number', constraints: { min: 2, max: 5 } }),
      field({ path: 'service.maxRetries', type: 'number', constraints: { min: 2, max: 5 } }),
      field({ path: 'service.workers', type: 'number' }),
      field({ path: 'service.adminPort', type: 'port' }),
      field({ path: 'service.invalidPort', type: 'port' }),
    ];

    const errors = validateConfigAgainstSchema(
      { service: { tags: [], retries: 1, maxRetries: 6, workers: 'many', adminPort: 80, invalidPort: 65536 } },
      fields,
    );

    expect(errors.map(({ path, level }) => [path, level])).toEqual([
      ['service.name', 'error'],
      ['service.tags', 'error'],
      ['service.retries', 'error'],
      ['service.maxRetries', 'error'],
      ['service.workers', 'error'],
      ['service.adminPort', 'warning'],
      ['service.invalidPort', 'error'],
    ]);
    expect(errors[0].message).toContain('必填');
    expect(errors[2].message).toContain('最小值 2');
    expect(errors[3].message).toContain('最大上限 5');
  });

  it('validates string constraints, IPs, URLs, and enum values', () => {
    const fields = [
      field({
        path: 'secret',
        type: 'string',
        constraints: { minLength: 4, maxLength: 8, pattern: '^[A-Z]+$', patternDescription: 'uppercase only' },
      }),
      field({ path: 'tooLong', type: 'string', constraints: { maxLength: 3 } }),
      field({ path: 'host', type: 'ip' }),
      field({ path: 'callback', type: 'url' }),
      field({ path: 'malformedUrl', type: 'url' }),
      field({ path: 'mode', type: 'enum', constraints: { options: [{ value: 'safe', label: 'Safe' }] } }),
      field({ path: 'validHost', type: 'ip' }),
      field({ path: 'validUrl', type: 'url' }),
      field({ path: 'validMode', type: 'enum', constraints: { options: [{ value: 1, label: 'One' }] } }),
      field({ path: 'badPattern', type: 'string', constraints: { pattern: '(' } }),
    ];

    const errors = validateConfigAgainstSchema(
      {
        secret: 'ab',
        tooLong: 'long',
        host: '300.1.1.1',
        callback: 'ftp://example.com',
        malformedUrl: 'not a url',
        mode: 'unsafe',
        validHost: 'localhost',
        validUrl: 'https://example.com',
        validMode: '1',
        badPattern: 'ignored',
      },
      fields,
    );

    expect(errors.map(({ path, message }) => [path, message])).toEqual([
      ['secret', '「secret」长度不能少于 4 个字符'],
      ['secret', 'uppercase only'],
      ['tooLong', '「tooLong」长度不能超过 3 个字符'],
      ['host', '「host」不是合法的 IPv4 地址 (如 192.168.1.100 或 0.0.0.0)'],
      ['callback', '「callback」必须是标准 URL 格式 (以 http:// 或 https:// 开头)'],
      ['malformedUrl', '「malformedUrl」必须是标准 URL 格式 (以 http:// 或 https:// 开头)'],
      ['mode', '「mode」输入了非预设值 "unsafe"，允许的值为: [safe]'],
    ]);
  });

  it('checks object-array counts and each item field', () => {
    const servicesField = field({
      path: 'services',
      type: 'array_object',
      constraints: { minItems: 2, maxItems: 2 },
      itemTitleKey: 'ServiceName',
      itemFields: [
        field({ path: 'Name', type: 'string', required: true }),
        field({ path: 'port', type: 'port', required: true }),
        field({ path: 'weight', type: 'number', constraints: { min: 1, max: 10 } }),
      ],
    });

    const errors = validateConfigAgainstSchema(
      {
        services: [
          { ServiceName: 'api', Name: '', port: 70000, weight: 0 },
          { port: 8080, weight: 11 },
          null,
        ],
      },
      [servicesField],
    );

    expect(errors.map(({ path, fieldLabel, level }) => [path, fieldLabel, level])).toEqual([
      ['services', 'services', 'error'],
      ['services[0].Name', 'services > api > Name', 'error'],
      ['services[0].port', 'services > api > port', 'error'],
      ['services[0].weight', 'services > api > weight', 'error'],
      ['services[1].Name', 'services > 第 2 项 > Name', 'error'],
      ['services[1].weight', 'services > 第 2 项 > weight', 'error'],
    ]);
  });

  it('reports missing arrays and item limits in English', () => {
    const requiredItems = field({
      path: 'services',
      type: 'array_object',
      required: true,
      constraints: { minItems: 2 },
    });

    expect(validateConfigAgainstSchema({}, [requiredItems], 'en')[0].message).toContain('must contain at least one');
    expect(validateConfigAgainstSchema({ services: [] }, [requiredItems], 'en')[0].message).toContain(
      'must contain at least one',
    );
    expect(validateConfigAgainstSchema({ services: [{}] }, [requiredItems], 'en')[0].message).toContain(
      'must have at least 2 items',
    );
  });
});