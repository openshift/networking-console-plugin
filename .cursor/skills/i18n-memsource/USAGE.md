# How to use the i18n Memsource skill (networking-console-plugin)

This guide is for teammates who need to send new UI strings to Phrase/Memsource
or pull finished translations back into the repo.

This PR keeps the existing `i18n-scripts/` + `i18next-parser` setup as an
**interim** workflow. A follow-up should migrate to
[`i18next-cli`](https://github.com/i18next/i18next-cli) (and optionally
[`ocp-plugin-i18n-scripts`](https://github.com/avivtur/ocp-plugin-i18n-scripts) /
native Phrase [i18next JSON](https://support.phrase.com/hc/en-us/articles/7278275219612--JSON-i18next-i18nextV4-Strings)),
which can drop most custom scripts including PO conversion and
`clear-english-msgstr.js`.

---

## What this skill does

In Cursor, attach or invoke the **i18n-memsource** skill, then ask for one of:

| You say… | Skill runs… |
|----------|-------------|
| "upload translations" / "memsource upload" | Extract keys → build POs (keeping existing translations) → upload to Phrase |
| "download translations" / "memsource download" | Pull finished translations → convert to locale JSON → commit → optional PR |
| "translation status" / "memsource status" | Show Phrase job status per language |

State (last sprint, version, project ID) is stored in
[`.cursor/skills/i18n-memsource/state.json`](./state.json).

---

## One-time setup (your machine)

### 1. Clone and install

```bash
git clone https://github.com/openshift/networking-console-plugin.git
cd networking-console-plugin
npm install
```

### 2. Install Memsource CLI

```bash
DIRECTORY="${HOME}/git/memsource-cli-client/"
mkdir -p "$DIRECTORY" && cd "$DIRECTORY"
python3 -m venv --system-site-packages .memsource
source .memsource/bin/activate
pip install -U pip setuptools pbr memsource-cli
```

Also install `jq` if missing: `brew install jq`.

### 3. Memsource credentials (keep out of the agent)

Create `~/.memsourcerc` for **your own shell only** (chmod 600):

```bash
source ${HOME}/git/memsource-cli-client/.memsource/bin/activate
export MEMSOURCE_URL="https://cloud.memsource.com/web"
export MEMSOURCE_USERNAME=<your-username>
export MEMSOURCE_PASSWORD="<your-password>"
```

**Security:** Do **not** give Memsource username/password (or a long-lived token)
to the Cursor agent. Treat Phrase like any other paid external service.

Recommended split:

1. **You** authenticate in a local terminal and run `memsource-*` / upload-download
   commands that need `MEMSOURCE_TOKEN`.
2. The agent may help with extract/export/validation (`npm run i18n`,
   `export-pos`, PO checks) and drafting notifications — without reading
   `~/.memsourcerc`.

If you temporarily export `MEMSOURCE_TOKEN` into a shell the agent uses, prefer
a short-lived token and do not commit it or paste it into chat.

---

## Upload flow (send strings for translation)

### Using Cursor (recommended for extract/validate)

1. Open this repo in Cursor.
2. Attach the **i18n-memsource** skill.
3. Ask the agent to extract keys, create the `zh-cn` symlink, run `export-pos`,
   and validate POs. Provide the **OCP VERSION** when asked (sprint auto-increments
   from `state.json`).
4. Review the locale diff and PO validation summary.
5. **You** run the Memsource upload in your own authenticated terminal (see manual
   upload below), or export a short-lived `MEMSOURCE_TOKEN` yourself before asking
   the agent to run `npm run memsource-upload`.
6. Update `state.json` after a successful upload (or ask the agent to, using the
   project ID from the upload output — not credentials).

### Manual upload (authenticated shell)

```bash
cd networking-console-plugin

# Auth in YOUR terminal only — do not paste password/token into Cursor chat
source ~/.memsourcerc
export PATH="$(dirname "$(python3 -c "import shutil; print(shutil.which('memsource') or '')")"):$PATH"
export MEMSOURCE_TOKEN=$(memsource auth login \
  --user-name "$MEMSOURCE_USERNAME" \
  --password "$MEMSOURCE_PASSWORD" \
  -f json \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

npm run i18n
git diff --stat -- locales/   # review before continuing

# CRITICAL: register cleanup BEFORE creating the symlink
trap 'rm -f locales/zh-cn; rm -rf po-files locales/tmp' EXIT
if [ -e locales/zh-cn ] && [ ! -L locales/zh-cn ]; then
  echo "ERROR: locales/zh-cn exists and is not a symlink; resolve manually"
  exit 1
fi
ln -sfn zh locales/zh-cn

rm -rf po-files
npm run export-pos
# export-pos also runs clear-english-msgstr.js so msgstr==msgid becomes empty
# validate the same export-pos pipeline memsource-upload will re-run
# (translated vs needs_translation; english_leaks_remaining should be 0)
for lang in ja zh-cn ko fr es; do
  echo "=== $lang ==="
  python3 -c "
import re, glob, sys
files = glob.glob(f'po-files/{sys.argv[1]}/*.po')
if not files:
  raise SystemExit(f'missing PO files for {sys.argv[1]}')
content = ''.join(open(f).read() for f in files)
entries = [(a,b) for a,b in re.findall(r'msgid \"(.*?)\"\nmsgstr \"(.*?)\"', content) if a]
translated = sum(1 for a,b in entries if b and b != a)
needs = sum(1 for a,b in entries if not b)
leaks = sum(1 for a,b in entries if b and b == a)
print(f'total={len(entries)} translated={translated} needs_translation={needs} english_leaks_remaining={leaks}')
if leaks:
  raise SystemExit('english_leaks_remaining must be 0')
" "$lang"
done

# Read current state; ask for VERSION; increment sprint (do not reuse literals)
STATE=.cursor/skills/i18n-memsource/state.json
VERSION=...   # ask / set from current OCP release — do not copy a stale example
SPRINT=$(( $(jq -r '.sprint // 0' "$STATE") + 1 ))
npm run memsource-upload -- -v "$VERSION" -s "$SPRINT"
# capture PROJECT_ID from memsource project create output (.uid)
# If upload fails after project create: save that PROJECT_ID into state.json
# (or delete the orphan project in Phrase) before retrying — otherwise retry
# creates a second project.
```

After a successful upload, **merge** into `.cursor/skills/i18n-memsource/state.json`
(append history; do not replace the whole file with a one-entry example):

```bash
STATE=.cursor/skills/i18n-memsource/state.json
PROJECT_ID=...   # from upload output
TODAY=$(date +%F)
jq --arg v "$VERSION" --argjson s "$SPRINT" --arg p "$PROJECT_ID" --arg d "$TODAY" '
  .version = $v
  | .sprint = $s
  | .lastProjectId = $p
  | .memsourceProjectUrl = ("https://cloud.memsource.com/web/project2/show/" + $p)
  | .history = ((.history // []) + [{version:$v, sprint:$s, projectId:$p, date:$d}])
' "$STATE" > "${STATE}.tmp" && mv "${STATE}.tmp" "$STATE"
```

---

## Why the `zh-cn` symlink matters

- Memsource language code: `zh-cn`
- Repo locale directory: `locales/zh/`

`i18n-to-po` looks for `locales/zh-cn/` when building Chinese POs. If that path
is missing, **all Chinese msgstr values are empty** and prior translations are
not carried forward. Register an `EXIT` trap **before** `ln -sfn zh locales/zh-cn`,
refuse to overwrite a non-symlink `locales/zh-cn`, and let the trap remove the
symlink afterward (even on failure). Download already remaps `zh-cn` → `zh`.

---

## How existing translations are preserved

PO export does **not** upload English into every language blindly. For each language:

1. Take English keys as the source of truth (`msgid`)
2. Clear values
3. Copy back any existing translation from `locales/<lang>/plugin__networking-console-plugin.json` into `msgstr`
4. Leave new keys with empty `msgstr` for translators
5. **Post-export clear:** if `msgstr` still equals `msgid` (English placeholder left by `i18next-parser`), clear it to empty so Phrase marks it as needing translation

| Locale JSON value | msgstr uploaded to Phrase |
|-------------------|---------------------------|
| Real translation (e.g. Japanese) | Kept |
| Empty | Empty (needs translation) |
| English placeholder | Cleared to empty (needs translation) |

That is why you must run `npm run export-pos` (never hand-edit English-only POs).

With a modern Phrase + i18next JSON workflow, PO conversion and this clear step
can go away (see migration note at the top).

---

## Download flow (pull finished translations)

### Using Cursor

1. Attach **i18n-memsource**.
2. Ask: "download translations".
3. Confirm the Memsource project ID (from `state.json` or paste a new one).
4. Skill checks job status, ensures `locales/` is clean, then you (or a shell with
   your token) run download.

### Manual download

```bash
# Auth in YOUR terminal only (same as upload)

PROJECT_ID=...   # from state.json

# Require completed jobs before download
for lang in ja zh-cn ko fr es; do
  memsource job list \
    --project-id "$PROJECT_ID" \
    --target-lang "$lang" \
    -f json \
    -c uid,status,targetLang
done
# Proceed only when every job status is COMPLETED / DELIVERED (or equivalent)

# IMPORTANT: check root locales/ (the script checks the wrong paths)
git status --short --untracked-files -- locales/
# must be clean

npm run memsource-download -- -p "$PROJECT_ID"
git diff HEAD~1 --stat -- locales/
```

Then push a branch / open a PR with the locale updates.

---

## Check status only

Ask Cursor: "translation status"  
or:

```bash
for lang in ja zh-cn ko fr es; do
  memsource job list --project-id PROJECT_ID --target-lang "$lang" -f json -c uid,status,targetLang
done
```

---

## Common pitfalls

| Pitfall | What happens | Fix |
|---------|--------------|-----|
| Skip `zh-cn` symlink on upload | Chinese translations wiped in the Phrase project | Always `ln -sfn zh locales/zh-cn` before export/upload |
| Hand-build POs from English only | Existing ja/ko/fr/es/zh translations lost | Always use `npm run export-pos` |
| Leave English in msgstr | Phrase may treat those strings as already translated | Use current `export-pos` (includes `clear-english-msgstr.js`) |
| Trust download script's git clean check | Uncommitted `locales/` changes get overwritten | Run `git status -- locales/` yourself |
| Download before jobs complete | Incomplete locale overwrite | Check job status first |
| Give Memsource password/token to the agent | Credential exposure | Authenticate only in your shell |
| Forget to update `state.json` | Next download/status uses stale project ID | Update state after every upload |
| Upload without reviewing `npm run i18n` | Unexpected key churn in locale files | Always review `git diff -- locales/` first |

---

## After upload: notify localization

Use the draft the skill prints, or:

```text
Subject: [OCP VERSION] Translation Upload - networking-console-plugin Sprint SPRINT

Hi Localization Team,

New translation strings have been uploaded for networking-console-plugin
(OCP VERSION, Sprint SPRINT).

Memsource project: https://cloud.memsource.com/web/project2/show/PROJECT_ID

Languages: ja, zh-cn, ko, fr, es

Please review and translate at your convenience.

Thanks
```
