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
| PO filename pattern | `po-files/<lang>/plugin__networking-console-plugin.po` |

## Prerequisites

### Memsource CLI

```bash
MEMSOURCE_BIN=$(python3 -c "import shutil; print(shutil.which('memsource') or '')")
if [ -z "$MEMSOURCE_BIN" ]; then
  MEMSOURCE_BIN=$(find "$HOME/Library/Python" -name memsource -type f 2>/dev/null | head -1)
fi
export PATH="$(dirname "$MEMSOURCE_BIN"):$PATH"
```

### Authentication

Credentials live in `~/.memsourcerc`. Capture a token so npm child processes inherit auth:

```bash
source ~/.memsourcerc
export MEMSOURCE_TOKEN=$(memsource auth login \
  --user-name "$MEMSOURCE_USERNAME" \
  --password "$MEMSOURCE_PASSWORD" \
  -f json \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

if [ -z "$MEMSOURCE_TOKEN" ]; then
  echo "ERROR: Memsource authentication failed. Check ~/.memsourcerc credentials."
  return 1
fi

memsource auth whoami
```

Run this once at the start of every action. Do not ask the user to authenticate manually.

---

## Critical nuances

### 1. zh-cn vs zh filesystem mismatch

`i18n-scripts/languages.sh` uses `zh-cn`, but locales live under `locales/zh/`.
Without a symlink, `i18n-to-po` cannot merge existing Chinese translations and
uploads empty msgstr for Chinese.

**Before any `export-pos` during upload:**

```bash
ln -sfn zh locales/zh-cn
```

Remove after upload finishes. Download already maps `zh-cn` → `zh`.

### 2. PO generation preserves existing translations

`i18n-to-po.js`:

1. Start from English keys in `locales/en/`
2. Clear values (empty placeholders)
3. Merge existing values from `locales/<lang>/`
4. Convert to PO via `i18next-conv`

Never skip `export-pos` or hand-build English-only POs.

### 3. English leak detection

`i18next-parser` + `useKeysAsDefaultValue: true` can leave English in secondary
locale JSON. After `export-pos`, flag msgstr identical to msgid.

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

```
Upload Progress:
- [ ] Step 1: Load state
- [ ] Step 2: Get VERSION from user, auto-increment SPRINT
- [ ] Step 3: Authenticate with Memsource
- [ ] Step 4: Extract translation keys
- [ ] Step 5: Create zh-cn symlink and generate PO files
- [ ] Step 6: Validate PO files
- [ ] Step 7: Show summary and get approval
- [ ] Step 8: Upload to Memsource
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

### Step 3: Authenticate

Run the Prerequisites auth sequence and `memsource auth whoami`.

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

### Step 5: zh-cn symlink + export POs

```bash
ln -sfn zh locales/zh-cn
rm -rf po-files
npm run export-pos
```

Keep the symlink until after Step 8 (`memsource-upload` re-runs `export-pos`).

### Step 6: Validate PO files

For each of `ja`, `zh-cn`, `ko`, `fr`, `es`:

```bash
for lang in ja zh-cn ko fr es; do
  echo -n "$lang keys: "
  rg -c '^msgid "' po-files/$lang/*.po 2>/dev/null || echo "0"
done

for lang in ja zh-cn ko fr es; do
  echo "=== $lang ==="
  python3 -c "
import re, glob, sys
files = glob.glob(f'po-files/{sys.argv[1]}/*.po')
content = ''.join(open(f).read() for f in files)
entries = re.findall(r'msgid \"((?:\\\\.|[^\"])*)\"\s*msgstr \"((?:\\\\.|[^\"])*)\"', content)
# skip header empty msgid
entries = [(a,b) for a,b in entries if a]
translated = sum(1 for a,b in entries if b and b != a)
leaks = sum(1 for a,b in entries if b and b == a)
new = sum(1 for a,b in entries if not b)
print(f'  total={len(entries)} translated={translated} new={new} english_leaks={leaks}')
" "$lang"
done
```

### Step 7: Show summary and get approval

Present plugin, version, sprint, branch, validation results, and project title.
Ask for explicit approval before upload.

### Step 8: Upload to Memsource

```bash
npm run memsource-upload -- -v "$VERSION" -s "$SPRINT"
```

Capture `PROJECT_ID` (`.uid`) from `memsource project create` output.

### Step 9: Cleanup and update state

```bash
rm -f locales/zh-cn
rm -rf po-files locales/tmp
```

Update `state.json` with `version`, `sprint`, `lastProjectId`, `memsourceProjectUrl`, and history.

Draft notification:

```
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

```
Download Progress:
- [ ] Step 1: Load state / confirm PROJECT_ID
- [ ] Step 2: Authenticate
- [ ] Step 3: Check translation status
- [ ] Step 4: Ensure locales/ is clean
- [ ] Step 5: Download translations
- [ ] Step 6: Show diff summary
- [ ] Step 7: Create PR (optional)
```

### Step 1: Confirm PROJECT_ID

Show `lastProjectId` from state; ask to confirm or override.

### Step 2: Authenticate

Same auth sequence as upload.

### Step 3: Status

```bash
for lang in ja zh-cn ko fr es; do
  memsource job list \
    --project-id "$PROJECT_ID" \
    --target-lang "$lang" \
    -f json \
    -c uid,status,targetLang
done
```

Warn if not all completed; ask before proceeding.

### Step 4: Clean locales

```bash
git status --short --untracked-files -- locales/
# Must be clean — commit or stash first
```

### Step 5: Download

```bash
npm run memsource-download -- -p "$PROJECT_ID"
```

This downloads POs, converts with `po-to-i18n` (`zh-cn` → `zh`), and auto-commits.

### Step 6–7: Diff + optional PR

```bash
git diff HEAD~1 --stat -- locales/

git checkout -b "chore/i18n-update-sprint-${SPRINT}"
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
2. Authenticate
3. Run job list for each language
4. If all completed, suggest download

---

## Important reminders

- Always symlink `locales/zh-cn` → `zh` before upload `export-pos`; remove after upload
- Never skip `export-pos`
- Validate English leaks before upload
- Clean root `locales/` before download
- Update `state.json` after successful upload
