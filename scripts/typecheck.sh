#!/usr/bin/env bash
#
# Typecheck src/, preferring the strongest check available.
#
# Two lists, and which one runs depends on what resolves on this machine:
#
#   whole src/   tsconfig.json covers every module, `src/plugin.ts` included.
#                plugin.ts imports four @deepseek-ai/* packages, so this needs
#                them installed — from a harness checkout's node_modules or this
#                repo's own (its devDependencies carry dsh-llm/dsh-tools, which is
#                what Dependabot's majors actually break).
#   CI's list     the harness-free closure, byte-for-byte the command in
#                .github/workflows/ci.yml. Reads as one source rather than a
#                second copy that can drift; `check-typecheck-list.mjs` fails when
#                it stops covering src/.
#
# The compiler choice matters more than it looks. This repo's own tsc comes
# first because a tsconfig project resolves @types/node from THIS node_modules;
# the harness checkout ships TypeScript 6, which resolves types from ITS tree,
# and using it first turned every `Buffer` and `node:crypto` into TS2591/TS2503
# — errors with nothing to do with the code under test.
#
# `--ignoreConfig` is TypeScript 6 only: on 6, naming files beside a config file
# is TS5112; on 5.x the flag itself is TS5023. Ask the compiler rather than its
# version number.
set -uo pipefail

HARNESS="${DSH_HARNESS:-$HOME/work/harvey/freepeak/deepseek-harness}"
tsc_bin=""; why=""
if [ -x node_modules/.bin/tsc ]; then
  tsc_bin=node_modules/.bin/tsc; why="project tsconfig"
elif [ -f "$HARNESS/node_modules/typescript/lib/tsc.js" ]; then
  tsc_bin="node $HARNESS/node_modules/typescript/lib/tsc.js"; why="harness checkout"
elif command -v tsc >/dev/null 2>&1; then
  tsc_bin=tsc; why="PATH"
fi
if [ -z "$tsc_bin" ]; then
  echo "  ! no TypeScript compiler found. Run: pnpm install"
  exit 1
fi
echo "  compiler: $why"

extra=""
if "$tsc_bin" --version 2>/dev/null | grep -qE ' Version [6-9]'; then extra="--ignoreConfig"; fi

if [ -d node_modules/@deepseek-ai/dsh-llm ] || [ -d "$HARNESS/node_modules/@deepseek-ai/dsh-llm" ]; then
  "$tsc_bin" --noEmit && echo "  typecheck clean (whole src/, including plugin.ts)"
  exit $?
fi

roots=""
[ -d "$HOME/node_modules/@types" ] && roots="--typeRoots $HOME/node_modules/@types --types node"

# The CI list, read rather than copied. sed stops at the next unindented line,
# which is the end of that step's `run:` block.
files=$(sed -n '/- name: tsc --noEmit/,$p' .github/workflows/ci.yml \
  | grep -o 'src/[a-z0-9-]*\.ts' | tr '\n' ' ')
if [ -z "$files" ]; then
  echo "  ! could not read the CI typecheck list out of .github/workflows/ci.yml"
  exit 1
fi
# shellcheck disable=SC2086
"$tsc_bin" --noEmit $extra \
  --target ES2024 --module NodeNext --moduleResolution NodeNext \
  --strict --esModuleInterop --skipLibCheck --isolatedModules \
  --allowImportingTsExtensions $roots \
  $files && echo "  typecheck clean (CI file list; plugin.ts needs the harness packages)"
