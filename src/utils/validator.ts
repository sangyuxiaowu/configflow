import { FieldDefinition, ValidationError } from '../types/config';
import { getValueByPath } from './schemaInfer';

/**
 * 校验运维填写的配置是否满足开发定义的全部规范（支持嵌套对象与对象数组校验）
 * 支持中英文双语错误提示
 */
export function validateConfigAgainstSchema(
  config: Record<string, any>,
  fields: FieldDefinition[],
  lang: 'zh' | 'en' = 'zh'
): ValidationError[] {
  const isEn = lang === 'en';
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const val = getValueByPath(config, field.path);
    const { required, constraints, type, label, path, itemFields } = field;

    // 1. 数组对象 (array_object) 特殊校验
    if (type === 'array_object') {
      if (required && (!Array.isArray(val) || val.length === 0)) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `List "${label}" must contain at least one service configuration item`
            : `「${label}」列表中至少需要包含一个服务配置项`,
          level: 'error',
        });
        continue;
      }

      if (Array.isArray(val)) {
        if (constraints.minItems !== undefined && val.length < constraints.minItems) {
          errors.push({
            path,
            fieldLabel: label,
            message: isEn
              ? `List "${label}" must have at least ${constraints.minItems} items (current: ${val.length})`
              : `「${label}」列表数量不能少于 ${constraints.minItems} 项 (当前: ${val.length})`,
            level: 'error',
          });
        }

        if (constraints.maxItems !== undefined && val.length > constraints.maxItems) {
          errors.push({
            path,
            fieldLabel: label,
            message: isEn
              ? `List "${label}" cannot exceed ${constraints.maxItems} items (current: ${val.length})`
              : `「${label}」列表数量不能超过 ${constraints.maxItems} 项 (当前: ${val.length})`,
            level: 'error',
          });
        }

        // 校验对象数组中的每个子项属性
        if (itemFields && itemFields.length > 0) {
          val.forEach((item, index) => {
            if (typeof item !== 'object' || item === null) return;
            const itemTitle =
              item[field.itemTitleKey || 'ServiceName'] ||
              item.name ||
              (isEn ? `Item #${index + 1}` : `第 ${index + 1} 项`);

            for (const subField of itemFields) {
              const subVal = item[subField.key];

              if (subField.required) {
                if (subVal === undefined || subVal === null || subVal === '') {
                  errors.push({
                    path: `${path}[${index}].${subField.key}`,
                    fieldLabel: `${label} > ${itemTitle} > ${subField.label}`,
                    message: isEn
                      ? `Required field "${subField.label}" in service "${itemTitle}" cannot be empty`
                      : `服务「${itemTitle}」的必填项「${subField.label}」不可为空`,
                    level: 'error',
                  });
                  continue;
                }
              }

              if (subVal === undefined || subVal === null || subVal === '') continue;

              // 端口校验
              if (subField.type === 'port') {
                const p = Number(subVal);
                if (isNaN(p) || !Number.isInteger(p) || p < 1 || p > 65535) {
                  errors.push({
                    path: `${path}[${index}].${subField.key}`,
                    fieldLabel: `${label} > ${itemTitle} > ${subField.label}`,
                    message: isEn
                      ? `Port for service "${itemTitle}" must be an integer between 1 and 65535 (current: ${subVal})`
                      : `服务「${itemTitle}」端口号必须在 1 ~ 65535 之间整数 (当前: ${subVal})`,
                    level: 'error',
                  });
                }
              }

              // 数值范围校验
              if (subField.type === 'number') {
                const n = Number(subVal);
                if (!isNaN(n)) {
                  if (subField.constraints.min !== undefined && n < subField.constraints.min) {
                    errors.push({
                      path: `${path}[${index}].${subField.key}`,
                      fieldLabel: `${label} > ${itemTitle} > ${subField.label}`,
                      message: isEn
                        ? `"${subField.label}" in service "${itemTitle}" cannot be less than ${subField.constraints.min}`
                        : `服务「${itemTitle}」的「${subField.label}」不能小于 ${subField.constraints.min}`,
                      level: 'error',
                    });
                  }
                  if (subField.constraints.max !== undefined && n > subField.constraints.max) {
                    errors.push({
                      path: `${path}[${index}].${subField.key}`,
                      fieldLabel: `${label} > ${itemTitle} > ${subField.label}`,
                      message: isEn
                        ? `"${subField.label}" in service "${itemTitle}" cannot exceed ${subField.constraints.max}`
                        : `服务「${itemTitle}」的「${subField.label}」不能大于 ${subField.constraints.max}`,
                      level: 'error',
                    });
                  }
                }
              }
            }
          });
        }
      }
      continue;
    }

    // 2. 标量必填项检查
    if (required) {
      if (val === undefined || val === null || val === '') {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" is required and cannot be empty`
            : `「${label}」为必填参数，不可留空`,
          level: 'error',
        });
        continue;
      }
      if (Array.isArray(val) && val.length === 0) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `List "${label}" must contain at least one item`
            : `「${label}」列表中至少需要包含一项配置`,
          level: 'error',
        });
        continue;
      }
    }

    if (val === undefined || val === null || val === '') {
      continue; // 非必填且为空则跳过后续数值校验
    }

    // 3. 数值与范围检查
    if (type === 'number' || type === 'port') {
      const num = Number(val);
      if (isNaN(num)) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" must be a valid number`
            : `「${label}」必须是有效数字`,
          level: 'error',
        });
        continue;
      }

      if (type === 'port') {
        if (!Number.isInteger(num) || num < 1 || num > 65535) {
          errors.push({
            path,
            fieldLabel: label,
            message: isEn
              ? `Port must be an integer between 1 and 65535 (current: ${num})`
              : `端口号必须在 1 ~ 65535 之间整数 (当前: ${num})`,
            level: 'error',
          });
        } else if (num < 1024) {
          errors.push({
            path,
            fieldLabel: label,
            message: isEn
              ? `Port ${num} is a privileged system port (<1024), which may require root permissions in production`
              : `端口号 ${num} 为系统保留端口 (<1024)，生产环境非 root 运行可能权限不足`,
            level: 'warning',
          });
        }
      }

      if (constraints.min !== undefined && num < constraints.min) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" cannot be less than minimum ${constraints.min} ${constraints.unit || ''}`
            : `「${label}」不能小于最小值 ${constraints.min} ${constraints.unit || ''}`,
          level: 'error',
        });
      }

      if (constraints.max !== undefined && num > constraints.max) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" cannot exceed maximum ${constraints.max} ${constraints.unit || ''}`
            : `「${label}」不能超过最大上限 ${constraints.max} ${constraints.unit || ''}`,
          level: 'error',
        });
      }
    }

    // 4. 字符串长度与正则检查
    if (typeof val === 'string') {
      if (constraints.minLength !== undefined && val.length < constraints.minLength) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" length cannot be less than ${constraints.minLength} characters`
            : `「${label}」长度不能少于 ${constraints.minLength} 个字符`,
          level: 'error',
        });
      }

      if (constraints.maxLength !== undefined && val.length > constraints.maxLength) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" length cannot exceed ${constraints.maxLength} characters`
            : `「${label}」长度不能超过 ${constraints.maxLength} 个字符`,
          level: 'error',
        });
      }

      if (constraints.pattern) {
        try {
          const reg = new RegExp(constraints.pattern);
          if (!reg.test(val)) {
            errors.push({
              path,
              fieldLabel: label,
              message:
                constraints.patternDescription ||
                (isEn
                  ? `"${label}" format does not match rule: ${constraints.pattern}`
                  : `「${label}」格式不符合规则: ${constraints.pattern}`),
              level: 'error',
            });
          }
        } catch {
          // ignore bad developer regex
        }
      }
    }

    // 5. IP 地址格式检查
    if (type === 'ip' && typeof val === 'string') {
      const isIpv4 = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(val);
      const isLocal = val === '0.0.0.0' || val === 'localhost' || val === '127.0.0.1';
      if (!isIpv4 && !isLocal) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" is not a valid IPv4 address (e.g. 192.168.1.100 or 0.0.0.0)`
            : `「${label}」不是合法的 IPv4 地址 (如 192.168.1.100 或 0.0.0.0)`,
          level: 'error',
        });
      }
    }

    // 6. URL 格式检查
    if (type === 'url' && typeof val === 'string') {
      try {
        const parsedUrl = new URL(val);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          errors.push({
            path,
            fieldLabel: label,
            message: isEn
              ? `"${label}" must be a standard URL (starting with http:// or https://)`
              : `「${label}」必须是标准 URL 格式 (以 http:// 或 https:// 开头)`,
            level: 'error',
          });
        }
      } catch {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" must be a standard URL (starting with http:// or https://)`
            : `「${label}」必须是标准 URL 格式 (以 http:// 或 https:// 开头)`,
          level: 'error',
        });
      }
    }

    // 7. 枚举可选值范围检查
    if (type === 'enum' && constraints.options && constraints.options.length > 0) {
      const allowedValues = constraints.options.map((opt) => String(opt.value));
      if (!allowedValues.includes(String(val))) {
        errors.push({
          path,
          fieldLabel: label,
          message: isEn
            ? `"${label}" has invalid value "${val}". Allowed values: [${allowedValues.join(', ')}]`
            : `「${label}」输入了非预设值 "${val}"，允许的值为: [${allowedValues.join(', ')}]`,
          level: 'error',
        });
      }
    }
  }

  return errors;
}
