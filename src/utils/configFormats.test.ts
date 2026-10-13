import { describe, expect, it } from 'vitest';
import {
  configFileExtension,
  detectConfigFormat,
  detectConfigFormatFromContent,
  parseConfigText,
  stringifyConfig,
  type ConfigFormat,
} from './configFormats';

const config = {
  server: {
    host: 'localhost',
    port: 8080,
    enabled: true,
  },
  credentials: {
    apiToken: 'true',
    note: 'line one\nline two',
  },
  features: ['cache', 'metrics'],
};

const knownPaths = [
  'server.host',
  'server.port',
  'server.enabled',
  'credentials.apiToken',
  'credentials.note',
  'features',
];

describe('config format conversion', () => {
  const formats: ConfigFormat[] = ['json', 'yaml', 'properties', 'env'];

  for (const format of formats) {
    it(`round-trips nested configuration as ${format}`, () => {
      const text = stringifyConfig(config, format);

      expect(parseConfigText(text, format, knownPaths)).toEqual(config);
    });
  }

  it('parses escaped Properties keys, values, and continuation lines', () => {
    const text = [
      '# comment',
      '! another comment',
      '',
      'root=old',
      'root.child=7',
      'root..enabled=true',
      'escaped\\ key=two\\ words',
      'escaped\\:colon=value',
      'unicode=\\u4E2D',
      'controls=one\\ntwo\\rthree\\tfour\\f',
      'unknown=left\\q',
      "quoted='it''s fine'",
      'invalidArray=[not-json]',
      'continued=first\\\n second',
      'withoutSeparator',
    ].join('\n');

    expect(parseConfigText(text, 'properties')).toEqual({
      root: { child: 7, enabled: true },
      'escaped key': 'two words',
      'escaped:colon': 'value',
      unicode: '中',
      controls: 'one\ntwo\rthree\tfour\f',
      unknown: 'leftq',
      quoted: "it's fine",
      invalidArray: '[not-json]',
      continued: 'first second',
      withoutSeparator: '',
    });
  });

  it('round-trips escaped Properties keys, special strings, and empty values', () => {
    const specialConfig = {
      'name with: punctuation!': '  leading\nline\tcolumn\fform',
      emptyObject: {},
      emptyArray: [],
      emptyValue: null,
      scalarStrings: {
        booleanLike: 'false',
        numberLike: '01',
        arrayLike: '[not-json]',
      },
    };

    expect(parseConfigText(stringifyConfig(specialConfig, 'properties'), 'properties')).toEqual(specialConfig);
    expect(stringifyConfig({}, 'properties')).toBe('');
    expect(stringifyConfig({}, 'env')).toBe('');
  });

  it('parses dotenv exports, nested keys, and ignores comments or invalid lines', () => {
    const text = [
      '# comment',
      '',
      'not an assignment',
      'INVALID-KEY=value',
      'export SERVER__PORT = 443',
      'CAMEL_CASE__PATH=/tmp/app',
      'FEATURE_ENABLED=true',
      'NESTED__DEEP__VALUE=1',
      'EMPTY=',
      "TITLE='it''s fine'",
      'LIST=[1,2]',
      'MALFORMED=[oops]',
      'NULL_VALUE=~',
    ].join('\n');

    expect(parseConfigText(text, 'env', ['server.port', 'camelCase.path', 'empty'])).toEqual({
      server: { port: 443 },
      camelCase: { path: '/tmp/app' },
      FEATURE_ENABLED: true,
      NESTED: { DEEP: { VALUE: 1 } },
      empty: '',
      TITLE: "it's fine",
      LIST: [1, 2],
      MALFORMED: '[oops]',
      NULL_VALUE: null,
    });
  });

  it('detects formats from filenames, including query strings', () => {
    expect(detectConfigFormat('settings.yaml?download=1')).toBe('yaml');
    expect(detectConfigFormat('/etc/service.properties')).toBe('properties');
    expect(detectConfigFormat('.env.production')).toBe('env');
    expect(detectConfigFormat('settings.yml')).toBe('yaml');
    expect(detectConfigFormat('settings.json')).toBe('json');
    expect(detectConfigFormat('settings.env')).toBe('env');
    expect(detectConfigFormat('settings.unknown', 'yaml')).toBe('yaml');
    expect(configFileExtension('yaml')).toBe('yml');
    expect(configFileExtension('json')).toBe('json');
  });

  it('detects formats from content', () => {
    expect(detectConfigFormatFromContent('{"port":8080}')).toBe('json');
    expect(detectConfigFormatFromContent('SERVER__PORT=8080')).toBe('env');
    expect(detectConfigFormatFromContent('server.port=8080')).toBe('properties');
    expect(detectConfigFormatFromContent('server:8080')).toBe('properties');
    expect(detectConfigFormatFromContent('server:\n  port: 8080')).toBe('yaml');
    expect(detectConfigFormatFromContent('- first\n- second')).toBe('yaml');
    expect(detectConfigFormatFromContent('# comment only', 'properties')).toBe('properties');
    expect(detectConfigFormatFromContent('plain text', 'env')).toBe('env');
    expect(detectConfigFormatFromContent('[1, 2]')).toBe('json');
    expect(detectConfigFormatFromContent('', 'yaml')).toBe('yaml');
  });

  it('surfaces malformed JSON and YAML input errors', () => {
    expect(() => parseConfigText('{invalid}', 'json')).toThrow();
    expect(() => parseConfigText('key: [unterminated', 'yaml')).toThrow();
  });

  it('rejects ENV keys that collide after normalization', () => {
    expect(() => stringifyConfig({ apiToken: 'first', api_token: 'second' }, 'env')).toThrow(
      /ENV variable name collision/,
    );
    expect(() => parseConfigText('API_TOKEN=value', 'env', ['apiToken', 'api_token'])).toThrow(
      /ENV variable name collision/,
    );
  });
});