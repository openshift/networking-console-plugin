# How to use the i18n Memsource skill (networking-console-plugin)

This guide is for teammates who need to send new UI strings to Phrase/Memsource
or pull finished translations back into the repo.

You do **not** need to migrate the i18n toolchain. Keep using the existing
`i18n-scripts/` + `i18next-parser` setup.

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

### 3. Create `~/.memsourcerc`

```bash
source ${HOME}/git/memsource-cli-client/.memsource/bin/activate
export MEMSOURCE_URL="https://cloud.memsource.com/web"
export MEMSOURCE_USERNAME=<your-username>
export MEMSOURCE_PASSWORD="<your-password>"
```

The Cursor skill authenticates for you (captures `MEMSOURCE_TOKEN`). You should
not need to run `memsource auth login` yourself when using the skill.

Also install `jq` if missing: `brew install jq`.

---

## Upload flow (send strings for translation)

### Using Cursor (recommended)

1. Open this repo in Cursor.
2. Attach the **i18n-memsource** skill (or ask: "upload translations using the i18n-memsource skill").
3. When asked, provide the **OCP VERSION** (for example `4.20`). Sprint auto-increments from `state.json`.
4. Review the locale diff and PO validation summary.
5. Approve the upload when the summary looks correct.

The skill will:

1. Authenticate to Memsource
2. Run `npm run i18n`
3. Create a temporary `locales/zh-cn` → `zh` symlink (required — see below)
4. Run `npm run export-pos` and validate POs
5. Ask for your approval
6. Run `npm run memsource-upload -- -v VERSION -s SPRINT`
7. Clean up the symlink and update `state.json`
8. Give you a draft email for the localization team

### Manual upload (without Cursor)

```bash
cd networking-console-plugin

# Auth (export token so npm scripts work)
source ~/.memsourcerc
export PATH="$(dirname "$(python3 -c "import shutil; print(shutil.which('memsource') or '')")"):$PATH"
# If memsource is not on PATH, find it under ~/Library/Python
export MEMSOURCE_TOKEN=$(memsource auth login \
  --user-name "$MEMSOURCE_USERNAME" \
  --password "$MEMSOURCE_PASSWORD" \
  -f json \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

npm run i18n
git diff --stat -- locales/   # review before continuing

# CRITICAL: without this, Chinese existing translations are lost on upload
ln -sfn zh locales/zh-cn

rm -rf po-files
npm run export-pos
# spot-check po-files/*/

npm run memsource-upload -- -v 4.20 -s 1

rm -f locales/zh-cn
rm -rf po-files locales/tmp
```

Record the Memsource project ID / URL from the upload output.

---

## Why the `zh-cn` symlink matters

- Memsource language code: `zh-cn`
- Repo locale directory: `locales/zh/`

`i18n-to-po` looks for `locales/zh-cn/` when building Chinese POs. If that path
is missing, **all Chinese msgstr values are empty** and prior translations are
not carried forward. The skill creates `locales/zh-cn` → `zh` before export and
removes it after upload. Download already remaps `zh-cn` → `zh`.

---

## How existing translations are preserved

PO export does **not** upload English into every language blindly. For each language:

1. Take English keys as the source of truth (`msgid`)
2. Clear values
3. Copy back any existing translation from `locales/<lang>/plugin__networking-console-plugin.json` into `msgstr`
4. Leave new keys with empty `msgstr` for translators

That is why you must run `npm run export-pos` (never hand-edit English-only POs).

---

## Download flow (pull finished translations)

### Using Cursor

1. Attach **i18n-memsource**.
2. Ask: "download translations".
3. Confirm the Memsource project ID (from `state.json` or paste a new one).
4. Skill checks job status, ensures `locales/` is clean, runs download, shows the diff, and can open a PR.

### Manual download

```bash
# Same auth as upload…

# IMPORTANT: check root locales/ (the script checks the wrong paths)
git status --short --untracked-files -- locales/
# must be clean

npm run memsource-download -- -p PROJECT_ID
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
| Trust download script's git clean check | Uncommitted `locales/` changes get overwritten | Run `git status -- locales/` yourself |
| Forget `MEMSOURCE_TOKEN` | `npm run memsource-*` fails auth | Export token after `memsource auth login` as shown above |
| Upload without reviewing `npm run i18n` | Unexpected key churn in locale files | Always review `git diff -- locales/` first |

---

## After upload: notify localization

Use the draft the skill prints, or:

```
Subject: [OCP VERSION] Translation Upload - networking-console-plugin Sprint SPRINT

Hi Localization Team,

New translation strings have been uploaded for networking-console-plugin
(OCP VERSION, Sprint SPRINT).

Memsource project: https://cloud.memsource.com/web/project2/show/PROJECT_ID

Languages: ja, zh-cn, ko, fr, es

Please review and translate at your convenience.

Thanks
```
