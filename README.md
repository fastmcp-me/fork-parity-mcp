# 🔄 Fork Parity MCP

[![npm version](https://badge.fury.io/js/%40moikas%2Ffork-parity-mcp.svg)](https://badge.fury.io/js/%40moikas%2Ffork-parity-mcp)
[![Node.js CI](https://github.com/moikas-code/fork-parity-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/moikas-code/fork-parity-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Track and manage fork parity with upstream repositories using Model Context Protocol (MCP)**

A powerful MCP server that helps you stay in sync with upstream repositories by tracking changes, analyzing commits, and managing integration status. Perfect for maintaining forks while keeping track of upstream developments.

## ✨ Features

- 🔍 **Smart Change Detection** - Automatically detect new upstream commits
- 📊 **Parity Status Tracking** - Track which commits have been reviewed, integrated, or skipped
- 🎯 **Commit Analysis** - Deep dive into specific commits to understand their impact
- 📋 **Adaptation Planning** - Generate actionable plans for integrating upstream changes
- 🌿 **Branch Comparison** - Compare your fork with upstream branches
- ⚙️ **Flexible Configuration** - Support for custom remote names and branches
- 🚀 **CLI Integration** - Works seamlessly with Claude and other MCP clients

## 🚀 Quick Start

### Installation

```bash
npm install -g @moikas/fork-parity-mcp
```

### Basic Setup

1. **Configure your Git remotes:**
```bash
# Add upstream remote (if not already added)
git remote add upstream https://github.com/original/repository.git

# Verify remotes
git remote -v
```

2. **Add to your MCP configuration:**
```json
{
  "mcpServers": {
    "fork-parity": {
      "command": "fork-parity-mcp",
      "env": {
        "REPO_PATH": "/path/to/your/fork"
      }
    }
  }
}
```

3. **Start tracking:**
```bash
# Fetch latest upstream changes
git fetch upstream

# You're ready to go! 🎉
```

## 📖 Usage

Once configured, you can interact with the MCP server through natural language:

### 🔍 Check for New Changes
```
"Check for new upstream changes in the last week"
"Show me commits since last month"
```

### 📊 Analyze Specific Commits
```
"Analyze commit abc123 for compatibility"
"What files were changed in commit def456?"
```

### 🎯 Compare Branches
```
"Compare our authentication module with upstream"
"Show differences in src/ directory"
```

### 📋 Plan Integration
```
"Create an adaptation plan for the latest 5 commits"
"What commits need review?"
```

### ⚙️ Manage Status
```
"Mark commit abc123 as integrated"
"Show current parity status"
```

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `check_upstream_changes` | Find new commits in upstream repository |
| `analyze_commit` | Analyze specific commit for compatibility |
| `compare_branches` | Compare fork with upstream branch |
| `get_parity_status` | Get current tracking status |
| `update_parity_status` | Update commit integration status |
| `create_adaptation_plan` | Generate integration roadmap |
| `fetch_upstream` | Fetch latest upstream changes |
| `show_config` | Display current configuration |
| `setup_upstream` | Help configure upstream remote |

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UPSTREAM_REMOTE_NAME` | `upstream` | Name of upstream remote |
| `UPSTREAM_BRANCH` | `main` | Upstream branch to track |
| `REPO_PATH` | `process.cwd()` | Path to Git repository |

### Advanced Configuration

```json
{
  "mcpServers": {
    "fork-parity": {
      "command": "fork-parity-mcp",
      "env": {
        "UPSTREAM_REMOTE_NAME": "origin-upstream",
        "UPSTREAM_BRANCH": "develop",
        "REPO_PATH": "/home/user/my-fork"
      }
    }
  }
}
```

### Multiple Projects

Track multiple forks simultaneously:

```json
{
  "mcpServers": {
    "project-a-parity": {
      "command": "fork-parity-mcp",
      "env": {
        "REPO_PATH": "/home/user/project-a"
      }
    },
    "project-b-parity": {
      "command": "fork-parity-mcp", 
      "env": {
        "REPO_PATH": "/home/user/project-b",
        "UPSTREAM_BRANCH": "development"
      }
    }
  }
}
```

## 📁 Status Tracking

The server creates a `.parity-status.json` file to track:

```json
{
  "commits": {
    "abc123": {
      "status": "integrated",
      "notes": "Applied with modifications for our auth system",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "def456": {
      "status": "skipped", 
      "notes": "Not applicable to our fork",
      "timestamp": "2024-01-15T11:00:00Z"
    }
  },
  "lastUpdated": "2024-01-15T11:00:00Z"
}
```

### Status Types

- ✅ **integrated** - Successfully merged/applied
- 🔍 **reviewed** - Analyzed but not yet integrated  
- ⏭️ **skipped** - Not applicable to your fork
- ⚠️ **conflict** - Requires manual resolution

## 🔧 Development

### Prerequisites

- Node.js 18+
- Git repository with upstream remote

### Local Development

```bash
# Clone the repository
git clone https://github.com/moikas-code/fork-parity-mcp.git
cd parity-mcp

# Install dependencies
npm install

# Run locally
node fork-parity-server.js
```

### Testing

```bash
# Run tests
npm test

# Lint code
npm run lint

# Check package
npm pack --dry-run
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- Inspired by the need to maintain fork parity in open source projects
- Thanks to the MCP community for the excellent SDK

## 📚 Related

- [MCP SDK Documentation](https://modelcontextprotocol.io/docs)
- [Claude Desktop MCP Guide](https://claude.ai/docs/mcp)
- [Git Remote Management](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)

---

<div align="center">

**[🏠 Homepage](https://github.com/moikas-code/fork-parity-mcp)** • 
**[📖 Documentation](SETUP.md)** • 
**[🐛 Report Bug](https://github.com/moikas-code/fork-parity-mcp/issues)** • 
**[✨ Request Feature](https://github.com/moikas-code/fork-parity-mcp/issues)**

Made with ❤️ for the open source community

</div>