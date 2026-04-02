#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$ROOT_DIR/skills-data/imported"

DEFAULT_SOURCE_DIRS="${CODEX_HOME:-$HOME/.codex}/skills:$HOME/.codex/skills:$HOME/.agents/skills"
SOURCE_DIRS="${LOCAL_SKILL_SOURCE_DIRS:-$DEFAULT_SOURCE_DIRS}"

mkdir -p "$DEST_DIR"

imported_count=0

IFS=':' read -r -a roots <<< "$SOURCE_DIRS"
for root in "${roots[@]}"; do
  if [[ ! -d "$root" ]]; then
    continue
  fi

  root_alias="$(echo "$root" | sed 's#[^a-zA-Z0-9_-]#-#g' | sed 's#--*#-#g' | sed 's#^-##; s#-$##')"
  target_root="$DEST_DIR/$root_alias"
  mkdir -p "$target_root"

  while IFS= read -r -d '' skill_file; do
    skill_dir="$(dirname "$skill_file")"
    skill_name="$(basename "$skill_dir")"
    target_dir="$target_root/$skill_name"
    rm -rf "$target_dir"
    cp -R "$skill_dir" "$target_dir"
    imported_count=$((imported_count + 1))
  done < <(find "$root" -type f -name 'SKILL.md' -print0)
done

echo "Imported $imported_count skills into $DEST_DIR"
