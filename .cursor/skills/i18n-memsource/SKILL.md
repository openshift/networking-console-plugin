---
name: i18n-memsource
description: >-
  Automates the Memsource/Phrase i18n translation workflow for networking-console-plugin.
  Use when the user asks to upload translations, download translations, check translation
  status, memsource upload, memsource download, i18n upload, i18n download, send for
  translation, or get translations.
---

# networking-console-plugin i18n Memsource Workflow

Manages upload/download of translations to Phrase (Memsource) for this repo.

Uses the **existing** local `i18n-scripts/` + `i18next-parser` setup.
Does **not** use `ocp-plugin-i18n-scripts` or `i18next-cli`.

For a peer-oriented walkthrough, see [USAGE.md](./USAGE.md).

## State

Read and update `.cursor/skills/i18n-memsource/state.json` after each upload.

## Plugin config

| Field | Value |
|-------|-------|
| Namespace / locale file | `plugin__networking-console-plugin` |
| Memsource template ID | `zBOwr4BxYwEq7xlJ37c1F3` |
| Project title | `[OCP $VERSION] UI Localization networking-console-plugin - Sprint $SPRINT/Branch $BRANCH` |
| Languages | `ja`, `zh-cn`, `ko`, `fr`, `es` |
| Locale dirs on disk | `en`, `es`, `fr`, `ja`, `ko`, **`zh`** (not `zh-cn`) |
| PO filename pattern | `po-files/<lang>/plugin__networking-console-plugin.po` (no `public__` prefix) |

## Prerequisites

### Memsource CLI

`memsource` is often installed but **not** on the default `PATH`. Resolve it first:

```bash
MEMSOURCE_BIN=$(python3 -c "import shutil; print(shutil.which('memsource') or '')")
if [ -z "$MEMSOURCE_BIN" ]; then
  MEMSOURCE_BIN=$(find "$HOME/Library/Python" -name memsource -type f 2>/dev/null | head -1)
fi
# Also common: $HOME/git/memsource-cli-client/.memsource/bin/memsource
export PATH="$(dirname "$MEMSOURCE_BIN"):$PATH"
command -v memsource >/dev/null || { echo "ERROR: memsource not found on PATH"; exit 1; }
```

### Authentication (credentials stay with the user)

**Do not** read `~/.memsourcerc`, Memsource passwords, or long-lived tokens into
the agent context. Phrase is a paid external service — treat credentials like
any other secret. Never paste login tables or tokens into chat.

Preferred flow:

1. Ask the user to authenticate in **their own terminal** (not an agent-controlled
   shell) and confirm `memsource auth whoami` works.
2. The agent may run extract/export/validation without credentials.
3. For upload/download/status, the user runs authenticated `memsource-*` /
   `memsource job list` commands in **their** terminal after the agent prepares
   artifacts. Never export `MEMSOURCE_TOKEN` into an agent-controlled shell
   (even short-lived — the agent can read process env).

**User-terminal auth (required for all Memsource API calls):**

```bash
export PATH="$HOME/Library/Python/3.9/bin:$PATH"   # adjust if needed
source ~/.memsourcerc
export MEMSOURCE_TOKEN=$(memsource auth login \
  --user-name "$MEMSOURCE_USERNAME" \
  --password "$MEMSOURCE_PASSWORD" \
  -f json \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
# Do not echo MEMSOURCE_TOKEN. Login alone is not enough — without this export,
# later commands fail with 401 "auth: not logged".
memsource auth whoami
```

Also ensure `jq` is installed (`brew install jq`) — upload scripts need it.

---

## Critical nuances

### 1. zh-cn vs zh filesystem mismatch

`i18n-scripts/languages.sh` uses `zh-cn`, but locales live under `locales/zh/`.
Without a symlink, `i18n-to-po` cannot merge existing Chinese translations and
uploads empty msgstr for Chinese.

**Before any `export-pos` during upload prep**, register cleanup first, then create
the symlink. Keep symlink + trap in the **same shell session** through validation.
`memsource-upload.sh` also creates and cleans the symlink around its own
`export-pos` re-run, so authenticated upload in a separate shell is safe:

```bash
trap 'rm -f locales/zh-cn; rm -rf po-files locales/tmp' EXIT
if [ -e locales/zh-cn ] && [ ! -L locales/zh-cn ]; then
  echo "ERROR: locales/zh-cn exists and is not a symlink; resolve manually"
  exit 1
fi
ln -sfn zh locales/zh-cn
```

Download already maps `zh-cn` → `zh`.

### 2. PO generation preserves existing translations

`i18n-to-po.js`:

1. Start from English keys in `locales/en/`
2. Clear values (empty placeholders)
3. Merge existing values from `locales/<lang>/`
4. Convert to PO via `i18next-conv`

Never skip `export-pos` or hand-build English-only POs.

### 3. English placeholders must be empty in uploaded POs

`i18next-parser` + `useKeysAsDefaultValue: true` can leave English text in
secondary locale JSON. Old `i18n-to-po` copies that into `msgstr`, which Phrase
may treat as already translated.

**Desired PO state before upload:**

| Locale JSON value | msgstr in PO |
|-------------------|--------------|
| Real non-English translation | Keep it (carry forward) |
| Empty `""` | Empty (needs translation) |
| English placeholder (== English source) | **Empty** (needs translation) |

`export-pos.sh` runs `i18n-scripts/clear-english-msgstr.js` after generating POs
to clear `msgstr` when it equals `msgid`. Because `memsource-upload.sh` re-runs
`export-pos`, that clear also applies to the files that get uploaded.

This clear step is **redundant** if the repo migrates to
[`ocp-plugin-i18n-scripts`](https://github.com/avivtur/ocp-plugin-i18n-scripts),
which filters English placeholders during PO generation.

### 4. Download clean-git check is wrong

`memsource-download.sh` checks `public/locales` / `packages/**/locales`, but this
repo uses root `locales/`. Before download, verify:

```bash
git status --short --untracked-files -- locales/
```

---

## Action 1: Upload Translations

Trigger: "upload translations", "memsource upload", "i18n upload", "send for translation"

### Checklist

```text
Upload Progress:
- [ ] Step 1: Load state
- [ ] Step 2: Get VERSION from user, auto-increment SPRINT
- [ ] Step 3: Confirm user-provided Memsource auth (no credential access)
- [ ] Step 4: Extract translation keys
- [ ] Step 5–8: Symlink + export + validate; user-terminal upload (script owns symlink)
- [ ] Step 9: Cleanup and update state
```

### Step 1: Load state

Read `.cursor/skills/i18n-memsource/state.json`.

### Step 2: Get VERSION and SPRINT

- Always ask the user for VERSION. Do not assume.
- Auto-increment SPRINT from state (previous + 1).
- Show: "Uploading VERSION X, Sprint Y (branch: Z)"

```bash
git branch --show-current
```

### Step 3: Confirm authentication

Confirm the user will run authenticated Memsource commands in **their** terminal.
Do not source `~/.memsourcerc`, and do not use or request `MEMSOURCE_TOKEN` in an
agent-controlled shell.

### Step 4: Extract translation keys

```bash
npm run i18n
# → ./i18n-scripts/build-i18n.sh && node ./i18n-scripts/set-english-defaults.js
```

Then show:

```bash
git status --short -- locales/
git diff --stat -- locales/
```

Require approval if the locale diff looks wrong.

### Steps 5–8: Symlink, export, validate, then upload

`memsource-upload.sh` **owns** the `locales/zh-cn` → `zh` symlink (creates it,
re-runs `export-pos`, cleans up via `EXIT` trap). Agent prep and authenticated
upload may be separate shells. Still validate POs before upload so English leaks
are caught early.

```bash
set -euo pipefail
trap 'rm -f locales/zh-cn; rm -rf po-files locales/tmp' EXIT
if [ -e locales/zh-cn ] && [ ! -L locales/zh-cn ]; then
  echo "ERROR: locales/zh-cn exists and is not a symlink; resolve manually"
  exit 1
fi
ln -sfn zh locales/zh-cn
rm -rf po-files
npm run export-pos
# export-pos ends with: node ./i18n-scripts/clear-english-msgstr.js

# Validate (fail closed on missing POs / english leaks) — must exit before upload
for lang in ja zh-cn ko fr es; do
  echo "=== $lang ==="
  python3 -c "
import re, glob, sys
files = glob.glob(f'po-files/{sys.argv[1]}/*.po')
if not files:
  raise SystemExit(f'missing PO files for {sys.argv[1]}')
content = ''.join(open(f).read() for f in files)
entries = re.findall(r'msgid \"((?:\\\\.|[^\"])*)\"\s*msgstr \"((?:\\\\.|[^\"])*)\"', content)
entries = [(a,b) for a,b in entries if a]
translated = sum(1 for a,b in entries if b and b != a)
needs = sum(1 for a,b in entries if not b)
leaks = sum(1 for a,b in entries if b and b == a)
print(f'  total={len(entries)} translated={translated} needs_translation={needs} english_leaks_remaining={leaks}')
if leaks:
  raise SystemExit('english_leaks_remaining must be 0')
" "$lang"
done

# After validation: present summary and get explicit approval, then
# USER terminal (authenticated) only — upload re-exports with its own symlink:
npm run memsource-upload -- -v "$VERSION" -s "$SPRINT"
# capture PROJECT_ID (.uid) from memsource project create output
```

Present plugin, version, sprint, branch, validation results, and project title
before the user runs upload.

- **translated** = non-empty msgstr and msgstr ≠ msgid
- **needs translation** = empty msgstr
- **english_leaks remaining** = msgstr == msgid (must be 0)

### Step 9: Cleanup and update state

Explicit cleanup (trap also covers failure paths):

```bash
rm -f locales/zh-cn
rm -rf po-files locales/tmp
```

Update `state.json` with `version`, `sprint`, `lastProjectId`, `memsourceProjectUrl`, and history.

Draft notification:

```text
Subject: [OCP VERSION] Translation Upload - networking-console-plugin Sprint SPRINT

Hi Localization Team,

New translation strings have been uploaded for networking-console-plugin
(OCP VERSION, Sprint SPRINT).

Memsource project: https://cloud.memsource.com/web/project2/show/PROJECT_ID

Languages: ja, zh-cn, ko, fr, es
Total keys: N

Please review and translate at your convenience. Let us know when translations
are ready for download.

Thanks
```

---

## Action 2: Download Translations

Trigger: "download translations", "memsource download", "i18n download", "get translations"

### Checklist

```text
Download Progress:
- [ ] Step 1: Load state / confirm PROJECT_ID
- [ ] Step 2: Confirm user-provided Memsource auth
- [ ] Step 3: Check translation status
- [ ] Step 4: Ensure locales/ is clean
- [ ] Step 5: Download translations
- [ ] Step 6: Show diff summary
- [ ] Step 7: Create PR (optional)
```

### Step 1: Confirm PROJECT_ID

Show `lastProjectId` from state; ask to confirm or override.

### Step 2: Confirm authentication

Same as upload Step 3 — user-owned credentials only; no `~/.memsourcerc` in agent context.

### Step 3: Status

Omit `-c`, or pass **separate** `-c` flags. Comma-separated `-c uid,status,...`
is treated as one invalid column name. Column is `target_lang` (not `targetLang`).

```bash
# USER terminal (MEMSOURCE_TOKEN already exported)
for lang in ja zh-cn ko fr es; do
  echo "=== $lang ==="
  memsource job list \
    --project-id "$PROJECT_ID" \
    --target-lang "$lang" \
    -f json
  # optional: -c uid -c status -c target_lang
done
```

Warn if not all completed; ask before proceeding.

### Step 4: Clean locales

```bash
git status --short --untracked-files -- locales/
# Must be clean — commit or stash first
```

### Step 5: Download

Load `SPRINT` from `state.json` (or ask the user). Create/switch to the PR
branch **before** download (the script auto-commits):

```bash
STATE=.cursor/skills/i18n-memsource/state.json
SPRINT=$(jq -r '.sprint' "$STATE")   # or ask user / override
BRANCH="chore/i18n-update-sprint-${SPRINT}"
# Non-destructive: create the branch, or switch to it if it already exists.
# Do NOT use `git switch -C` (resets the branch tip and can drop unpushed commits).
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git switch "$BRANCH"
else
  git switch -c "$BRANCH"
fi

# USER terminal (authenticated):
npm run memsource-download -- -p "$PROJECT_ID"
```

This downloads POs, converts with `po-to-i18n` (`zh-cn` → `zh`), and auto-commits.

### Step 6–7: Diff + optional PR

Review the **full** locale diff (not only `--stat`) before pushing:

```bash
git diff HEAD~1 -- locales/

git push -u origin HEAD
gh pr create --title "chore(i18n): update translations for Sprint ${SPRINT}" --body "$(cat <<EOF
## Summary
- Downloaded translations from Memsource project ${PROJECT_ID}
- Languages: ja, zh-cn, ko, fr, es

## Memsource Project
https://cloud.memsource.com/web/project2/show/${PROJECT_ID}

## Test plan
- [ ] Verify locale files are valid JSON
- [ ] Spot-check translations in the UI

Resolves: None
EOF
)"
```

---

## Action 3: Status only

1. Load `lastProjectId` (confirm/override)
2. Authenticate (user terminal only)
3. Run job list for each language (omit comma-separated `-c`)
4. If all completed, suggest download

---

## Important reminders

- Always symlink `locales/zh-cn` → `zh` before upload `export-pos`; remove after upload
- Never skip `export-pos` (it preserves real translations and clears English placeholders)
- After export, `needs_translation` should cover empty msgstr; `english_leaks_remaining` should be 0
- Clean root `locales/` before download
- Update `state.json` after successful upload
- PO basename is `plugin__networking-console-plugin.po` (no `public__` prefix); still prefer globbing `po-files/<lang>/*.po`
- User-terminal auth must `export MEMSOURCE_TOKEN=…` from `auth login -f json` or API calls 401
- `memsource job list -c` must use separate flags (`-c uid -c status -c target_lang`) or omit `-c`
- If this repo migrates to `ocp-plugin-i18n-scripts`, remove `clear-english-msgstr.js` from `export-pos.sh` (redundant)
