#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Validate a ConfigSchemaPackage JSON file against OpsConfig Studio rules.

Usage:
    python validate_package.py <package.json>

Exit code 0 = pass, 1 = validation errors found, 2 = usage/IO error.
Only depends on the Python standard library.
"""
import json
import sys

ROOT_KEYS = [
    "id", "name", "version", "description", "author", "updatedAt",
    "categories", "fields", "referenceExamples", "defaultConfig",
]
FIELD_TYPES = {
    "string", "number", "boolean", "enum", "port", "ip", "url",
    "secret", "array_string", "array_object", "object",
}
FIELD_KEYS = [
    "id", "key", "path", "label", "description", "category",
    "type", "required", "defaultValue",
]
EXAMPLE_KEYS = [
    "id", "name", "environment", "summary", "detailedNotes", "config",
]
ENVIRONMENTS = {"production", "staging", "development", "testing"}

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def resolve(config, path):
    """Resolve a dotted path inside a nested dict. Returns (found, value)."""
    cur = config
    for part in path.split("."):
        if isinstance(cur, dict) and part in cur:
            cur = cur[part]
        else:
            return False, None
    return True, cur


def check_field(field, cat_names, seen_ids, ctx, config, check_default):
    """Validate one FieldDefinition (recursively for itemFields/children)."""
    for k in FIELD_KEYS:
        if k not in field:
            err("%s: 缺少必需属性 '%s'" % (ctx, k))
            return
    fid = field["id"]
    if fid in seen_ids:
        err("%s: 字段 id 重复 '%s'" % (ctx, fid))
    seen_ids.add(fid)
    if field["type"] not in FIELD_TYPES:
        err("%s (%s): 非法 type '%s'" % (ctx, fid, field["type"]))
    if field["category"] not in cat_names:
        err("%s (%s): category '%s' 未在 categories[].name 中定义"
            % (ctx, fid, field["category"]))

    path = field["path"]
    if path.split(".")[-1] != field["key"]:
        warn("%s (%s): key '%s' 与 path '%s' 末段不一致"
             % (ctx, fid, field["key"], path))

    constraints = field.get("constraints") or {}
    if field["type"] == "enum":
        options = constraints.get("options")
        if not isinstance(options, list) or not options:
            err("%s (%s): enum 类型必须提供非空 constraints.options" % (ctx, fid))
        else:
            for i, opt in enumerate(options):
                if not isinstance(opt, dict) or "value" not in opt or "label" not in opt:
                    err("%s (%s): options[%d] 缺少 value 或 label" % (ctx, fid, i))

    if field["type"] == "array_object":
        if "itemTitleKey" not in field:
            err("%s (%s): array_object 类型必须设置 itemTitleKey" % (ctx, fid))
        if not field.get("itemFields"):
            err("%s (%s): array_object 类型必须提供 itemFields" % (ctx, fid))
        for sub in field.get("itemFields") or []:
            check_field(sub, cat_names, seen_ids,
                        "%s.itemFields[%s]" % (ctx, sub.get("id", "?")), None, False)

    for child in field.get("children") or []:
        check_field(child, cat_names, seen_ids,
                    "%s.children[%s]" % (ctx, child.get("id", "?")), None, False)

    if field["type"] == "secret" and not field.get("isSensitive"):
        warn("%s (%s): secret 类型建议设置 isSensitive: true" % (ctx, fid))

    # defaultConfig mirroring / referenceExample coverage
    if config is not None and check_default:
        found, value = resolve(config, path)
        if not found:
            err("%s (%s): defaultConfig 中缺少路径 '%s'" % (ctx, fid, path))
        elif value != field["defaultValue"]:
            err("%s (%s): defaultConfig['%s'] 与 defaultValue 不一致 (%r != %r)"
                % (ctx, fid, path, value, field["defaultValue"]))
        if field["type"] == "array_object" and found and isinstance(value, list):
            item_keys = {sub["key"] for sub in field.get("itemFields") or []}
            for i, item in enumerate(value):
                missing = item_keys - set(item.keys())
                if missing:
                    err("%s (%s): defaultConfig['%s'][%d] 缺少 itemFields 定义的键: %s"
                        % (ctx, fid, path, i, ", ".join(sorted(missing))))


def main():
    if len(sys.argv) != 2:
        print("Usage: python validate_package.py <package.json>")
        return 2
    try:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            pkg = json.load(f)
    except (OSError, ValueError) as e:
        print("[FAIL] 无法读取或解析 JSON: %s" % e)
        return 2

    if not isinstance(pkg, dict):
        print("[FAIL] 顶层必须是 JSON 对象")
        return 1

    # 1. Root keys
    for k in ROOT_KEYS:
        if k not in pkg:
            err("根节点缺少必需属性 '%s'" % k)

    # 2. Categories
    cat_names = set()
    for i, cat in enumerate(pkg.get("categories") or []):
        if not isinstance(cat, dict) or "id" not in cat or "name" not in cat:
            err("categories[%d] 缺少 id 或 name" % i)
        else:
            if cat["name"] in cat_names:
                warn("categories[%d]: name '%s' 重复" % (i, cat["name"]))
            cat_names.add(cat["name"])
    if not (pkg.get("categories") or []):
        err("categories 不能为空")

    # 3. Fields
    fields = pkg.get("fields") or []
    if not fields:
        err("fields 不能为空")
    seen_ids = set()
    for i, field in enumerate(fields):
        check_field(field, cat_names, seen_ids, "fields[%d]" % i,
                    pkg.get("defaultConfig"), True)

    # 4. Reference examples
    examples = pkg.get("referenceExamples") or []
    if len(examples) < 2:
        err("referenceExamples 至少需要 2 套参考方案，当前 %d 套" % len(examples))
    for i, ex in enumerate(examples):
        if not isinstance(ex, dict):
            err("referenceExamples[%d] 不是对象" % i)
            continue
        for k in EXAMPLE_KEYS:
            if k not in ex:
                err("referenceExamples[%d]: 缺少必需属性 '%s'" % (i, k))
        if ex.get("environment") not in ENVIRONMENTS:
            err("referenceExamples[%d]: environment 非法 (%r)"
                % (i, ex.get("environment")))
        cfg = ex.get("config")
        if not isinstance(cfg, dict) or not cfg:
            err("referenceExamples[%d]: config 必须是非空对象" % i)
            continue
        # Required fields must resolve in every example config
        for field in fields:
            if not isinstance(field, dict) or "path" not in field:
                continue
            if field.get("required"):
                found, _ = resolve(cfg, field["path"])
                if not found:
                    err("referenceExamples[%d]: 必填字段路径 '%s' 缺失"
                        % (i, field["path"]))

    # Report
    for w in warnings:
        print("[WARN] %s" % w)
    for e in errors:
        print("[FAIL] %s" % e)
    if errors:
        print("\n校验未通过：%d 个错误，%d 个警告" % (len(errors), len(warnings)))
        return 1
    print("校验通过：%d 个字段，%d 套参考方案，%d 个警告"
          % (len(fields), len(examples), len(warnings)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
