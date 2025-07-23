# 🔄 Fork Parity MCP v2.0.0

[![npm version](https://badge.fury.io/js/%40moikas%2Ffork-parity-mcp.svg)](https://badge.fury.io/js/%40moikas%2Ffork-parity-mcp)
[![Node.js CI](https://github.com/moikas-code/fork-parity-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/moikas-code/fork-parity-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Enterprise-grade fork parity management with AI-powered analysis and automated workflows**

A comprehensive MCP server that revolutionizes how you maintain fork parity with upstream repositories. Features intelligent commit analysis, automated conflict detection, GitHub Actions integration, and advanced notification systems. Built for teams and organizations managing complex fork relationships.

## ✨ Features

### 🧠 **AI-Powered Analysis**
- 🔍 **Smart Commit Triage** - Automatically categorize commits by impact and priority
- 🎯 **Advanced Analysis** - Deep dependency chain analysis, breaking change detection
- 🛡️ **Security Assessment** - Automated security impact evaluation
- ⚡ **Performance Impact** - Predict performance implications of upstream changes

### 🚀 **Automation & Integration**
- 🤖 **GitHub Actions Workflows** - Complete CI/CD integration with automated checks
- 📊 **Real-time Dashboards** - Comprehensive parity status with actionable insights
- 🔔 **Multi-channel Notifications** - Slack, Discord, email, and webhook support
- 📋 **Migration Planning** - Automated conflict resolution and integration roadmaps

### 🎛️ **Enterprise Features**
- 📈 **Analytics & Metrics** - Track integration velocity and technical debt
- 🔄 **Batch Processing** - Handle multiple commits with intelligent prioritization
- 🎨 **Customizable Workflows** - Adapt to your team's specific processes
- 🌐 **Multi-repository Support** - Manage multiple forks from a single interface

### 🛠️ **Developer Experience**
- 💡 **Learning System** - Adapts to your integration patterns over time
- 🔧 **Conflict Simulation** - Preview merge conflicts before integration
- 📝 **Review Templates** - Structured commit review and documentation
- 🎯 **Impact Analysis** - Understand downstream effects of changes

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
      "command": "node",
      "args": ["/path/to/fork-parity-mcp/src/enhanced-server.js"],
      "env": {
        "REPO_PATH": "/path/to/your/fork"
      }
    }
  }
}
```

3. **Optional: Set up GitHub Actions automation:**
```bash
# Generate workflow files
fork-parity setup-github-actions --workflows=daily_sync,pr_checks,critical_alerts
```

4. **Start tracking:**
```bash
# Fetch latest upstream changes
git fetch upstream

# You're ready to go! 🎉
```

## 📖 Usage Examples

### 🧠 **AI-Powered Analysis**
```
"Auto-triage the last 20 upstream commits"
"Run advanced analysis on commit abc123 including security assessment"
"Batch analyze commits from the last sprint"
```

### 📊 **Dashboard & Monitoring**
```
"Generate a comprehensive parity dashboard"
"Show me actionable items with high priority"
"Get detailed status since last month"
```

### 🔄 **Integration Planning**
```
"Create an integration plan for the next quarter"
"Generate migration plan for commits abc123, def456, ghi789"
"Analyze potential conflicts for commit xyz890"
```

### 🤖 **Automation**
```
"Sync with upstream and run full analysis"
"Set up GitHub Actions with daily sync and PR checks"
"Configure Slack notifications for critical alerts"
```

### 📝 **Review & Documentation**
```
"Create a review template for commit abc123"
"Update commit def456 status to integrated with adaptation notes"
"Learn from this successful integration pattern"
```

## 🛠️ Available Tools (15 Total)

### 🧠 **Analysis & Triage**
| Tool | Description |
|------|-------------|
| `fork_parity_auto_triage_commits` | AI-powered commit categorization and prioritization |
| `fork_parity_advanced_analysis` | Deep dependency, security, and performance analysis |
| `fork_parity_batch_analyze_commits` | Process multiple commits with intelligent triage |

### 📊 **Status & Monitoring**
| Tool | Description |
|------|-------------|
| `fork_parity_get_detailed_status` | Comprehensive parity status with analytics |
| `fork_parity_generate_dashboard` | Real-time dashboard with metrics and insights |
| `fork_parity_get_actionable_items` | Prioritized list of commits requiring action |

### 🔄 **Integration & Planning**
| Tool | Description |
|------|-------------|
| `fork_parity_update_commit_status` | Update commit status with rich metadata |
| `fork_parity_create_review_template` | Generate structured review templates |
| `fork_parity_generate_integration_plan` | Create integration roadmap with effort estimates |
| `fork_parity_migration_plan` | Detailed migration planning for complex changes |

### 🤖 **Automation & Workflows**
| Tool | Description |
|------|-------------|
| `fork_parity_sync_and_analyze` | Automated upstream sync with analysis |
| `fork_parity_setup_github_actions` | Configure GitHub Actions workflows |
| `fork_parity_conflict_analysis` | Advanced conflict detection and resolution |

### 🔔 **Notifications & Learning**
| Tool | Description |
|------|-------------|
| `fork_parity_setup_notifications` | Configure multi-channel notification system |
| `fork_parity_learn_adaptation` | Machine learning from successful integrations |

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
- ⏸️ **deferred** - Postponed for future integration
- 🔄 **pending** - Awaiting analysis or review

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

# Run the enhanced server
node src/enhanced-server.js

# Or run the CLI
node src/cli.js --help
```

### Testing

```bash
# Check syntax
npm run check-syntax

# Lint code (ESLint configured)
npx eslint src/*.js --ignore-pattern="*-old.js"

# Test server startup
node src/enhanced-server.js

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

## 🆕 What's New in v2.0.0

- 🧠 **AI-Powered Commit Triage** - Intelligent categorization and prioritization
- 🔍 **Advanced Analysis Engine** - Deep dependency chains, security assessment, performance impact
- 🤖 **GitHub Actions Integration** - Complete workflow automation with customizable templates
- 📊 **Real-time Dashboards** - Comprehensive analytics and actionable insights
- 🔔 **Multi-channel Notifications** - Slack, Discord, email, and webhook support
- 🎯 **Conflict Simulation** - Preview and resolve conflicts before integration
- 📈 **Learning System** - Adapts to your integration patterns over time
- 🚀 **Enterprise Features** - Batch processing, migration planning, and team workflows

## 🙏 Acknowledgments

- Built with [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- Inspired by the need to maintain fork parity in open source projects
- Thanks to the MCP community for the excellent SDK
- Special thanks to contributors who helped reach v2.0.0 production readiness

## 📚 Related

- [MCP SDK Documentation](https://modelcontextprotocol.io/docs)
- [Claude Desktop MCP Guide](https://claude.ai/docs/mcp)
- [Git Remote Management](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Complete Implementation Guide](COMPLETE_IMPLEMENTATION.md)

---

<div align="center">

**[🏠 Homepage](https://github.com/moikas-code/fork-parity-mcp)** • 
**[📖 Setup Guide](SETUP.md)** • 
**[🚀 Implementation Details](COMPLETE_IMPLEMENTATION.md)** • 
**[🐛 Report Bug](https://github.com/moikas-code/fork-parity-mcp/issues)** • 
**[✨ Request Feature](https://github.com/moikas-code/fork-parity-mcp/issues)**

Made with ❤️ for the open source community • **v2.0.0 Production Ready** 🎉

</div>