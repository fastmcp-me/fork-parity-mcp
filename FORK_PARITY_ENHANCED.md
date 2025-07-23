# Enhanced Fork Parity MCP

A comprehensive fork maintenance system with intelligent triage, persistent tracking, and advanced analytics.

## 🚀 Features

### ✨ Smart Auto-Triage System
- **Automatic categorization**: Security, bugfix, feature, refactor, docs, test, chore
- **Priority assignment**: Critical, high, medium, low based on impact analysis
- **Conflict risk assessment**: Predicts integration difficulty
- **Effort estimation**: Trivial, small, medium, large, XL based on scope
- **Impact area detection**: Core, API, UI, database, auth, config, build, test, docs

### 📊 Persistent Status Tracking
- **SQLite database**: Reliable local storage with full history
- **Rich metadata**: Decision reasoning, reviewer info, adaptation notes
- **Status management**: Pending, reviewed, integrated, skipped, conflict, deferred
- **Historical tracking**: Complete audit trail of all decisions

### 📈 Dashboard & Analytics
- **Comprehensive metrics**: Integration rates, priority distribution, trends
- **Actionable items**: Filtered by priority and status
- **Visual summaries**: Text, JSON, and Markdown formats
- **Trend analysis**: Track progress over time

### 🔄 Review Workflow Support
- **Structured templates**: Consistent review process
- **Batch operations**: Efficient bulk status updates
- **Integration planning**: Effort-based sprint planning
- **Decision history**: Context preservation for team continuity

## 🛠️ Installation

```bash
npm install
```

The package includes three main components:
- `fork-parity` - CLI tool for daily operations
- `enhanced-fork-parity-server` - MCP server for Claude integration
- Demo and examples in `examples/`

## 📋 Quick Start

### 1. Initialize Repository Tracking

```bash
# Initialize fork parity tracking
fork-parity init https://github.com/upstream/repo.git

# Or specify custom branches
fork-parity init https://github.com/upstream/repo.git --upstream-branch dev --fork-branch main
```

### 2. Sync and Analyze

```bash
# Fetch upstream changes and run auto-triage
fork-parity sync

# View comprehensive dashboard
fork-parity dashboard
```

### 3. Manage Commit Status

```bash
# Update individual commit status
fork-parity status abc123 integrated --reason "Direct integration, no conflicts"

# List commits by status
fork-parity list --status pending
fork-parity list --status integrated --limit 10
```

### 4. Export and Backup

```bash
# Export as JSON
fork-parity export --format json > parity-backup.json

# Export as CSV
fork-parity export --format csv > parity-report.csv
```

## 🔧 MCP Integration

### Start the MCP Server

```bash
enhanced-fork-parity-server
```

### Available MCP Tools

#### `fork_parity_sync_and_analyze`
Sync with upstream and run comprehensive analysis
```json
{
  "repository_path": "/path/to/repo",
  "upstream_branch": "main"
}
```

#### `fork_parity_auto_triage_commits`
Automatically analyze and triage specific commits
```json
{
  "commit_hashes": ["abc123", "def456"],
  "repository_path": "/path/to/repo"
}
```

#### `fork_parity_generate_dashboard`
Generate comprehensive dashboard with metrics
```json
{
  "repository_path": "/path/to/repo",
  "format": "markdown"
}
```

#### `fork_parity_get_actionable_items`
Get prioritized list of commits requiring action
```json
{
  "repository_path": "/path/to/repo",
  "priority_filter": "high",
  "limit": 20
}
```

#### `fork_parity_update_commit_status`
Update commit status with rich metadata
```json
{
  "commit_hash": "abc123",
  "status": "integrated",
  "metadata": {
    "decision_reasoning": "Critical security fix",
    "reviewer": "security-team",
    "adaptation_notes": "No conflicts"
  }
}
```

#### `fork_parity_batch_analyze_commits`
Analyze multiple commits in batch
```json
{
  "commit_range": "HEAD~10..HEAD",
  "auto_update_db": true
}
```

#### `fork_parity_create_review_template`
Generate structured review template
```json
{
  "commit_hash": "abc123"
}
```

#### `fork_parity_generate_integration_plan`
Create integration plan with effort estimates
```json
{
  "time_horizon": "sprint"
}
```

## 🎯 Smart Triage Algorithm

### Category Detection
The system analyzes commit messages and changed files to automatically categorize commits:

- **Security**: Keywords like 'security', 'vulnerability', 'auth', 'sanitize'
- **Bugfix**: Keywords like 'fix', 'bug', 'error', 'crash', 'broken'
- **Feature**: Keywords like 'add', 'new', 'feature', 'implement'
- **Refactor**: Keywords like 'refactor', 'cleanup', 'optimize', 'improve'
- **Docs**: Keywords like 'doc', 'readme', 'documentation', 'guide'
- **Test**: Keywords like 'test', 'spec', 'coverage', 'mock'
- **Chore**: Keywords like 'chore', 'update', 'bump', 'dependency'

### Priority Assignment
Base priority is determined by category, then adjusted based on:

- **Impact areas**: Core systems get priority escalation
- **Conflict risk**: High-risk changes get escalated
- **File patterns**: Security-related files trigger escalation
- **Effort estimate**: Trivial changes may be de-escalated

### Conflict Risk Calculation
Risk factors include:
- Core area modifications (+30% risk)
- API changes (+20% risk)
- Database changes (+25% risk)
- Number of files changed
- Common file modifications (package.json, config files)

## 📊 Database Schema

### Tables
- **repositories**: Repository configuration and metadata
- **commits**: Commit information with file changes and stats
- **triage_results**: Auto-triage analysis results
- **commit_status**: Status tracking with decision history
- **integrations**: Integration history and details
- **metrics**: Analytics and trend data

### Key Features
- **ACID compliance**: Reliable data integrity
- **Indexed queries**: Fast lookups and filtering
- **Automatic timestamps**: Track all changes
- **JSON storage**: Flexible metadata storage
- **Backup support**: Built-in backup and restore

## 🔄 Workflow Examples

### Daily Maintenance
```bash
# Morning routine
fork-parity sync
fork-parity dashboard

# Review high-priority items
fork-parity list --status pending | grep -E "(critical|high)"

# Update statuses as you work
fork-parity status abc123 integrated --reason "Applied with minor conflicts"
```

### Sprint Planning
```bash
# Get integration plan
fork-parity dashboard

# Export for team review
fork-parity export --format json > sprint-planning.json

# Batch update reviewed items
# (Use MCP tools for more advanced batch operations)
```

### Release Preparation
```bash
# Check integration status
fork-parity dashboard

# Identify any critical pending items
fork-parity list --status pending | grep critical

# Generate final report
fork-parity export --format csv > release-parity-report.csv
```

## 🎨 Dashboard Formats

### Text Format (Default)
```
📊 Fork Parity Dashboard
========================

Repository: /path/to/project
Upstream: https://github.com/upstream/repo.git

📈 Summary:
   Total commits: 25
   ✅ Integrated: 18 (72%)
   ⏳ Pending: 5
   🚨 Critical: 2
   ⚠️  High: 3

🎯 Actionable Items:
   🚨 abc123de - fix: security vulnerability in auth
   ⚠️  def456gh - feat: new user dashboard
```

### Markdown Format
```markdown
# 📊 Fork Parity Dashboard

**Repository:** /path/to/project
**Upstream:** https://github.com/upstream/repo.git

## 📈 Summary

- **Total commits:** 25
- **✅ Integrated:** 18
- **⏳ Pending:** 5
- **🚨 Critical:** 2
- **⚠️ High:** 3

## 🎯 Actionable Items

| Priority | Hash | Message |
|----------|------|---------|
| 🚨 Critical | `abc123de` | fix: security vulnerability in auth... |
| ⚠️ High | `def456gh` | feat: new user dashboard... |
```

### JSON Format
```json
{
  "repository": {
    "path": "/path/to/project",
    "upstream_url": "https://github.com/upstream/repo.git"
  },
  "summary": {
    "total_commits": 25,
    "integrated_count": 18,
    "pending_count": 5,
    "critical_count": 2,
    "high_count": 3
  },
  "actionable_items": [...]
}
```

## 🧪 Demo

Run the interactive demo to see all features in action:

```bash
npm run fork-parity:demo
```

The demo creates a sample repository with various commit types and demonstrates:
- Smart triage analysis
- Status management
- Dashboard generation
- Integration planning
- Batch operations
- Export capabilities

## 🔧 Advanced Configuration

### Database Location
By default, the database is stored in `.fork-parity/parity.db` in your project root. You can customize this:

```javascript
import ForkParityDatabase from './src/fork-parity/database.js';
const db = new ForkParityDatabase('/custom/path/parity.db');
```

### Custom Triage Rules
Extend the triage system with custom patterns:

```javascript
import SmartTriageSystem from './src/fork-parity/triage.js';
const triage = new SmartTriageSystem();

// Add custom patterns
triage.patterns.custom = {
  keywords: ['custom', 'special'],
  priority: 'high',
  confidence: 0.8
};
```

## 🤝 Integration with Existing Tools

### GitHub Actions
```yaml
name: Fork Parity Check
on: [push, pull_request]
jobs:
  parity-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check parity status
        run: |
          fork-parity sync
          fork-parity dashboard
          # Fail if critical items are pending
          if fork-parity list --status pending | grep -q critical; then
            echo "Critical upstream changes pending integration"
            exit 1
          fi
```

### Slack/Discord Notifications
```bash
# In your CI/CD pipeline
CRITICAL_COUNT=$(fork-parity dashboard --format json | jq '.summary.critical_count')
if [ "$CRITICAL_COUNT" -gt 0 ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"⚠️ $CRITICAL_COUNT critical upstream changes need attention\"}" \
    $SLACK_WEBHOOK_URL
fi
```

## 📈 Metrics and Analytics

The system tracks various metrics automatically:
- Integration rate over time
- Priority distribution trends
- Conflict resolution success rate
- Effort estimation accuracy
- Review cycle time

Access metrics through the database or MCP tools for custom reporting.

## 🔒 Security Considerations

- Database is stored locally and never transmitted
- No external API calls or data sharing
- Git operations use your existing authentication
- All data remains within your development environment

## 🐛 Troubleshooting

### Common Issues

**"Repository not initialized"**
```bash
fork-parity init <upstream-url>
```

**"No upstream remote found"**
```bash
git remote add upstream <upstream-url>
fork-parity sync
```

**Database corruption**
```bash
fork-parity cleanup  # Runs VACUUM
# Or delete .fork-parity/parity.db to start fresh
```

### Debug Mode
Set `DEBUG=fork-parity` environment variable for verbose logging.

## 🚀 Future Enhancements

- **Machine learning**: Improve triage accuracy over time
- **Dependency analysis**: Track dependency chain impacts
- **Visual dashboards**: Web-based interface
- **Team collaboration**: Shared decision tracking
- **Integration automation**: Auto-apply simple changes
- **Conflict prediction**: Advanced merge conflict detection

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📞 Support

- GitHub Issues: Report bugs and feature requests
- Documentation: This README and inline code comments
- Demo: Run `npm run fork-parity:demo` for examples