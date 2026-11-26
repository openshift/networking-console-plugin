# Jenkins Failure Diagnosis MCP — Setup

## 1. Install Dependencies

From the repository root (or using the path to this skill inside your clone):

```bash
cd .claude/skills/jenkins-e2e-cy-failures/mcp-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Get Your Jenkins API Token

1. Log in to your Jenkins instance
2. Click your username (top right) → Configure
3. Under **API Token**, click "Add new Token"
4. Name it (e.g. `cursor-mcp`), click Generate, and copy the value

## 3. Configure in Cursor

Add the following to your Cursor MCP settings. For a **project-local** server, use `.cursor/mcp.json` in this repository (merge with existing `mcpServers` entries).

Use an absolute path, or `${workspaceFolder}` if your Cursor build expands it in MCP config:

```json
{
  "mcpServers": {
    "jenkins-failure-diagnosis": {
      "command": "${workspaceFolder}/.claude/skills/jenkins-e2e-cy-failures/mcp-server/.venv/bin/python",
      "args": ["${workspaceFolder}/.claude/skills/jenkins-e2e-cy-failures/mcp-server/server.py"],
      "env": {
        "JENKINS_URL": "https://jenkins.your-company.com",
        "JENKINS_USER": "your-username",
        "JENKINS_TOKEN": "your-api-token",
        "JENKINS_VERIFY_SSL": "true",
        "ROOTCOZ_URL": "https://rootcoz.example.com",
        "ROOTCOZ_API_KEY": "your-rootcoz-api-key",
        "ROOTCOZ_VERIFY_SSL": "false"
      }
    }
  }
}
```

If `${workspaceFolder}` is not expanded, replace it with the full path to this repository (e.g. `/Users/you/dev/kubevirt-ui-pw`).

Set `JENKINS_VERIFY_SSL` to `false` if your corporate Jenkins uses a self-signed certificate.

### RootCoz (optional)

RootCoz uses the same env vars as the **`user-rootcoz`** MCP server. Because each MCP server runs in a separate process, copy these into the `jenkins-failure-diagnosis` env block in `~/.cursor/mcp.json` (same values as `user-rootcoz`):

- `ROOTCOZ_URL`
- `ROOTCOZ_API_KEY`
- `ROOTCOZ_VERIFY_SSL` (optional, default `false`)

When set, generated reports include RootCoz **Key Takeaway** and **Peer Analysis** for builds with a completed analysis. If omitted, reports are generated without RootCoz data.

## Secrets policy

The env block above holds **API tokens only** (`JENKINS_TOKEN`, `ROOTCOZ_API_KEY`, and
`RP_TOKEN` when ReportPortal defect editing is used). They stay in the MCP server process and are
never rendered into reports.

The cluster kubeadmin password is **not** part of this configuration and is not read from Jenkins
artifacts. When the agent needs it, the user types it in the conversation (see the skill's
`Arguments` section); it is used transiently and must never be committed to the repository.

Generated reports contain no credentials; `generate_failure_report` refuses to write one if a live
`RP_TOKEN` or `BRIDGE_KUBEADMIN_PASSWORD` value ever shows up in the HTML.

## 4. Verify

Restart Cursor (or reload the window) after changing `server.py` or env vars so the MCP server picks up updates. The MCP tools should appear when you ask the agent to diagnose a Jenkins build. You can verify by asking:

> "Use the get_build_info tool to check https://jenkins.example.com/job/my-job/123"

## Troubleshooting

- **"Missing Jenkins credentials"** — Ensure all three env vars are set in `mcp.json`
- **401 Unauthorized** — Token may be expired; regenerate in Jenkins
- **Connection refused** — Check `JENKINS_URL` is reachable from your machine; check VPN
- **SSL errors** — Set `JENKINS_VERIFY_SSL=false` or add your corporate CA to the system trust store
