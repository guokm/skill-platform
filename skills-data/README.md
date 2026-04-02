# skills-data

把需要被站点爬取的技能目录放到这里，目录内部必须包含 `SKILL.md`。下载时会把整个技能目录打成 zip。

当前仓库自带 `examples/` 示例数据，`docker compose up -d --build` 后可以直接看到页面效果。

如果你想导入本机已有的 Skills，可以运行：

```bash
./scripts/import-skills.sh
```
