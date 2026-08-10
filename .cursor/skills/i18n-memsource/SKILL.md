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

### Authentication (credentials stay with the user)

**Do not** read `~/.memsourcerc`, Memsource passwords, or long-lived tokens into
the agent context. Phrase is a paid external service — treat credentials like
any other secret.

Preferred flow:

1. Ask the user to authenticate in **their own terminal** and confirm
   `memsource auth whoami` works (and that `MEMSOURCE_TOKEN` is exported in the
   shell they will use for `npm run memsource-*`).
2. The agent may run extract/export/validation without credentials.
3. For upload/download/status, either:
   - the user runs the `memsource-*` commands themselves after the agent prepares
     artifacts, or
   - the user has already exported a **short-lived** `MEMSOURCE_TOKEN` in the
     shared shell (never paste the password into chat).

If a shared shell already has `MEMSOURCE_TOKEN`, verify with:

```bash
memsource auth whoami
```

If auth fails, stop and ask the user to refresh the token outside the agent.
Also ensure `jq` is installed (`brew install jq`) — upload scripts need it.

---

## Critical nuances

### 1. zh-cn vs zh filesystem mismatch

`i18n-scripts/languages.sh` uses `zh-cn`, but locales live under `locales/zh/`.
Without a symlink, `i18n-to-po` cannot merge existing Chinese translations and
uploads empty msgstr for Chinese.

**Before any `export-pos` during upload**, register cleanup first, then create
the symlink (also cleans up on failure / cancel). Do not overwrite a
pre-existing non-symlink `locales/zh-cn`:

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
to clear `msgstr` when it equals `msgid`. `memsource-upload.sh` re-runs the same
`export-pos` pipeline before creating jobs, so Step 6 validation is of the same
artifacts the upload script regenerates (not a different code path).

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
- [ ] Step 5: Create zh-cn symlink, generate PO files, clear English msgstr
- [ ] Step 6: Validate PO files
- [ ] Step 7: Show summary and get approval
- [ ] Step 8: Upload to Memsource (user shell / short-lived token only)
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

Do **not** source `~/.memsourcerc` or request the password in chat. Ask the user
to authenticate in their terminal, then verify `memsource auth whoami` in the
shell that will run upload (or have the user run Step 8 themselves).

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

### Step 5: zh-cn symlink + export POs + clear English msgstr

```bash
trap 'rm -f locales/zh-cn; rm -rf po-files locales/tmp' EXIT
if [ -e locales/zh-cn ] && [ ! -L locales/zh-cn ]; then
  echo "ERROR: locales/zh-cn exists and is not a symlink; resolve manually"
  exit 1
fi
ln -sfn zh locales/zh-cn
rm -rf po-files
npm run export-pos
# export-pos ends with: node ./i18n-scripts/clear-english-msgstr.js
```

Keep the symlink until after Step 8 (`memsource-upload` re-runs the same
`export-pos` + clear pipeline). The `trap` ensures cleanup even if a later
step fails.

If validating a hand-run export that skipped the script hook:

```bash
node ./i18n-scripts/clear-english-msgstr.js
```

### Step 6: Validate PO files

After the clear step, English placeholders should be empty. Report:

- **translated** = non-empty msgstr and msgstr ≠ msgid (real carry-forward)
- **needs translation** = empty msgstr (includes former English placeholders)
- **english_leaks remaining** = msgstr == msgid (should be 0 after clear)

```bash
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
```

Stop the upload if any language is missing POs or has `english_leaks_remaining > 0`.

### Step 7: Show summary and get approval

Present plugin, version, sprint, branch, validation results, and project title.
Ask for explicit approval before upload.

### Step 8: Upload to Memsource

```bash
npm run memsource-upload -- -v "$VERSION" -s "$SPRINT"
```

Capture `PROJECT_ID` (`.uid`) from `memsource project create` output. If the
command fails after project creation, persist that ID (or delete the orphan in
Phrase) before retrying — otherwise a retry creates another project.

### Step 9: Cleanup and update state

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
- Never skip `export-pos` (it preserves real translations and clears English placeholders)
- After export, `needs_translation` should cover empty msgstr; `english_leaks_remaining` should be 0
- Clean root `locales/` before download
- Update `state.json` after successful upload
- If this repo migrates to `ocp-plugin-i18n-scripts`, remove `clear-english-msgstr.js` from `export-pos.sh` (redundant)
