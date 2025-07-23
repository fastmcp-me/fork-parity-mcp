# Fork Parity MCP Server Setup Guide

## Prerequisites

1. **Node.js** and npm installed
2. **Git repository** that is a fork of another project
3. **Proper Git remotes** configured

## Git Remote Configuration

Your repository should have these remotes configured:

```bash
# Your fork (where you push changes) - this is typically 'origin'
git remote add origin https://github.com/yourusername/your-fork.git

# The original repository (what you want to track for parity)
git remote add upstream https://github.com/original/repository.git

# Verify your remotes
git remote -v
```

**Expected output:**
```
origin    https://github.com/yourusername/your-fork.git (fetch)
origin    https://github.com/yourusername/your-fork.git (push)
upstream  https://github.com/original/repository.git (fetch)
upstream  https://github.com/original/repository.git (push)
```

## Installation

1. **Install MCP SDK:**
```bash
npm install @modelcontextprotocol/sdk
```

2. **Save the MCP server code** to a file (e.g., `fork-parity-server.js`)

3. **Make it executable:**
```bash
chmod +x fork-parity-server.js
```

## Configuration Options

The MCP server supports these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `UPSTREAM_REMOTE_NAME` | `upstream` | Name of the remote pointing to the original repository |
| `UPSTREAM_BRANCH` | `main` | Branch on the upstream remote to track |
| `REPO_PATH` | `process.cwd()` | Path to your local Git repository |

### Example Configurations

#### Standard GitHub Fork Setup

```json
{
  "mcpServers": {
    "fork-parity": {
      "command": "node",
      "args": ["/path/to/fork-parity-server.js"],
      "env": {
        "UPSTREAM_REMOTE_NAME": "upstream",
        "UPSTREAM_BRANCH": "main",
        "REPO_PATH": "/home/user/my-fork"
      }
    }
  }
}
```

#### Custom Remote Names

If you named your remotes differently:

```json
{
  "mcpServers": {
    "fork-parity": {
      "command": "node", 
      "args": ["/path/to/fork-parity-server.js"],
      "env": {
        "UPSTREAM_REMOTE_NAME": "original",
        "UPSTREAM_BRANCH": "develop",
        "REPO_PATH": "/home/user/my-project"
      }
    }
  }
}
```

#### Multiple Projects

You can run different instances for different forks:

```json
{
  "mcpServers": {
    "project-a-parity": {
      "command": "node",
      "args": ["/path/to/fork-parity-server.js"],
      "env": {
        "UPSTREAM_REMOTE_NAME": "upstream",
        "UPSTREAM_BRANCH": "main",
        "REPO_PATH": "/home/user/project-a"
      }
    },
    "project-b-parity": {
      "command": "node",
      "args": ["/path/to/fork-parity-server.js"],
      "env": {
        "UPSTREAM_REMOTE_NAME": "source",
        "UPSTREAM_BRANCH": "development", 
        "REPO_PATH": "/home/user/project-b"
      }
    }
  }
}
```

## Initial Setup Commands

Once configured, run these commands to set up your tracking:

```bash
# Make sure you have the latest from upstream
git fetch upstream

# Verify your configuration works
git log upstream/main --oneline -5

# Optional: Create a tracking branch
git checkout -b upstream-sync upstream/main
git checkout main  # Switch back to your main branch
```

## Usage Examples

After setup, you can ask the AI assistant:

- **"Check for new upstream changes in the last week"**
- **"Analyze commit abc123 for compatibility with our fork"**
- **"Show me the differences in the authentication module between our fork and upstream"**
- **"Create an adaptation plan for the latest 5 commits"**
- **"What's our current parity status?"**

## Files Created

The MCP server will create a `.parity-status.json` file in your repository to track:

- Which upstream commits you've reviewed
- Integration status of each commit
- Notes and timestamps for each decision

Add this to your `.gitignore` if you don't want to commit parity tracking:

```gitignore
.parity-status.json
```

## Troubleshooting

### "Remote not found" errors

- Verify remote exists: `git remote -v`
- Check remote name matches your `UPSTREAM_REMOTE_NAME`
- Ensure you can fetch: `git fetch upstream`

### "Branch not found" errors

- Check upstream has the branch: `git ls-remote upstream`
- Verify branch name matches your `UPSTREAM_BRANCH`
- Try fetching first: `git fetch upstream`

### Permission errors

- Ensure MCP server file is executable
- Check file paths are correct and accessible
- Verify Node.js can access the repository directory