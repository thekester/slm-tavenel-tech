# Connect an agent to Hostinger

Hostinger provides a remote MCP server at `https://mcp.hostinger.com`. OAuth avoids copying an API key into every agent configuration.

In hPanel, configure the **Hostinger Connector** for the hosting account and enable the products the agent needs, such as **Websites** and **Domains**. DNS tools are included in **Domains**. Then authorize the agent with OAuth.

## Codex

```sh
codex mcp add hostinger --url https://mcp.hostinger.com
codex mcp list
```

See the [Codex MCP server documentation](https://developers.openai.com/learn/docs-mcp).

## Claude Code

```sh
claude mcp add --transport http hostinger https://mcp.hostinger.com
claude mcp list
```

## VS Code

Add this entry to `.vscode/mcp.json`:

```json
{
  "servers": {
    "hostinger": {
      "type": "http",
      "url": "https://mcp.hostinger.com"
    }
  }
}
```

Complete the OAuth flow if the agent opens an authorization window. See the [Hostinger MCP server documentation](https://www.hostinger.com/support/11079316-hostinger-api-mcp-server/).

## Local MCP with an API key

The local `hostinger-api-mcp` package can read a token from an environment variable instead of storing it in the MCP configuration:

```json
{
  "servers": {
    "hostinger": {
      "command": "npx",
      "args": ["-y", "hostinger-api-mcp"],
      "env": {
        "APITOKEN": "${env:HOSTINGER_API_TOKEN}"
      }
    }
  }
}
```

Set `HOSTINGER_API_TOKEN` in the user environment on each machine and restart the agent. Never place the token value in `mcp.json`, `AGENTS.md`, or a Git repository.

