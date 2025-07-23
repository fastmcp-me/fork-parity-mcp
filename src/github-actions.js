// GitHub Actions integration and CI/CD automation for fork parity

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

class GitHubActionsIntegration {
  constructor() {
    this.workflowTemplates = {
      dailySync: this.getDailySyncWorkflow(),
      prCheck: this.getPRCheckWorkflow(),
      criticalAlert: this.getCriticalAlertWorkflow(),
      autoIntegration: this.getAutoIntegrationWorkflow(),
      securityScan: this.getSecurityScanWorkflow()
    };
  }

  /**
   * Set up GitHub Actions workflows for fork parity
   */
  setupGitHubActions(repositoryPath, options = {}) {
    const {
      enableDailySync = true,
      enablePRChecks = true,
      enableCriticalAlerts = true,
      enableAutoIntegration = false,
      enableSecurityScans = true,
      slackWebhook = null,
      discordWebhook = null,
      emailNotifications = null
    } = options;

    const workflowsDir = join(repositoryPath, '.github', 'workflows');
    
    // Create workflows directory if it doesn't exist
    if (!existsSync(workflowsDir)) {
      mkdirSync(workflowsDir, { recursive: true });
    }

    const setupResults = [];

    // Daily sync workflow
    if (enableDailySync) {
      const workflow = this.customizeWorkflow('dailySync', {
        slackWebhook,
        discordWebhook,
        emailNotifications
      });
      
      writeFileSync(
        join(workflowsDir, 'fork-parity-daily-sync.yml'),
        workflow
      );
      setupResults.push('Daily sync workflow created');
    }

    // PR check workflow
    if (enablePRChecks) {
      const workflow = this.customizeWorkflow('prCheck', {
        slackWebhook,
        discordWebhook
      });
      
      writeFileSync(
        join(workflowsDir, 'fork-parity-pr-check.yml'),
        workflow
      );
      setupResults.push('PR check workflow created');
    }

    // Critical alert workflow
    if (enableCriticalAlerts) {
      const workflow = this.customizeWorkflow('criticalAlert', {
        slackWebhook,
        discordWebhook,
        emailNotifications
      });
      
      writeFileSync(
        join(workflowsDir, 'fork-parity-critical-alert.yml'),
        workflow
      );
      setupResults.push('Critical alert workflow created');
    }

    // Auto integration workflow (experimental)
    if (enableAutoIntegration) {
      const workflow = this.customizeWorkflow('autoIntegration', {
        slackWebhook,
        discordWebhook
      });
      
      writeFileSync(
        join(workflowsDir, 'fork-parity-auto-integration.yml'),
        workflow
      );
      setupResults.push('Auto integration workflow created (experimental)');
    }

    // Security scan workflow
    if (enableSecurityScans) {
      const workflow = this.customizeWorkflow('securityScan', {
        slackWebhook,
        discordWebhook
      });
      
      writeFileSync(
        join(workflowsDir, 'fork-parity-security-scan.yml'),
        workflow
      );
      setupResults.push('Security scan workflow created');
    }

    // Create configuration file
    this.createConfigFile(repositoryPath, options);
    setupResults.push('Configuration file created');

    return {
      success: true,
      workflowsCreated: setupResults,
      nextSteps: this.getNextSteps(options)
    };
  }

  /**
   * Customize workflow with notification settings
   */
  customizeWorkflow(workflowType, options) {
    let workflow = this.workflowTemplates[workflowType];
    
    // Generate notification steps
    const notificationSteps = this.generateNotificationSteps(options);
    
    // Replace placeholder with actual notification steps
    workflow = workflow.replace('{{NOTIFICATION_STEPS}}', notificationSteps);
    
    return workflow;
  }

  /**
   * Generate CI/CD integration scripts
   */
  generateCIIntegration(ciSystem, options = {}) {
    switch (ciSystem.toLowerCase()) {
      case 'jenkins':
        return this.generateJenkinsIntegration(options);
      case 'gitlab-ci':
        return this.generateGitLabCIIntegration(options);
      case 'azure-devops':
        return this.generateAzureDevOpsIntegration(options);
      case 'circleci':
        return this.generateCircleCIIntegration(options);
      default:
        throw new Error(`Unsupported CI system: ${ciSystem}`);
    }
  }

  /**
   * Create auto-PR generation system
   */
  setupAutoPRGeneration(repositoryPath, options = {}) {
    const {
      autoMergeThreshold = 0.9,
      requireReviews = true,
      draftPRs = true,
      labelPrefix = 'fork-parity'
    } = options;

    const script = this.getAutoPRScript({
      autoMergeThreshold,
      requireReviews,
      draftPRs,
      labelPrefix
    });

    const scriptsDir = join(repositoryPath, '.github', 'scripts');
    if (!existsSync(scriptsDir)) {
      mkdirSync(scriptsDir, { recursive: true });
    }

    writeFileSync(join(scriptsDir, 'auto-pr-generation.js'), script);

    return {
      success: true,
      scriptPath: join(scriptsDir, 'auto-pr-generation.js'),
      usage: 'node .github/scripts/auto-pr-generation.js',
      configuration: options
    };
  }

  // Workflow templates
  getDailySyncWorkflow() {
    return `# Fork Parity Daily Sync
name: Fork Parity Daily Sync

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:

jobs:
  sync-and-analyze:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
      pull-requests: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm install -g @moikas/fork-parity-mcp
          npm install better-sqlite3
      
      - name: Configure Git
        run: |
          git config --global user.name "Fork Parity Bot"
          git config --global user.email "fork-parity@github-actions.local"
      
      - name: Add upstream remote
        run: |
          if ! git remote get-url upstream 2>/dev/null; then
            git remote add upstream \${{ secrets.UPSTREAM_REPO_URL || github.event.repository.parent.clone_url }}
          fi
      
      - name: Fetch upstream changes
        run: git fetch upstream
      
      - name: Run fork parity analysis
        id: analysis
        run: |
          echo "Starting fork parity sync and analysis..."
          node -e "
            import('./src/enhanced-server.js').then(async (module) => {
              const server = new module.default();
              const result = await server.syncAndAnalyze({
                repository_path: process.cwd(),
                upstream_branch: 'main'
              });
              console.log('Analysis complete:', JSON.stringify(result, null, 2));
              process.exit(0);
            }).catch(console.error);
          "
      
      - name: Generate dashboard report
        run: |
          node -e "
            import('./src/enhanced-server.js').then(async (module) => {
              const server = new module.default();
              const result = await server.generateDashboard({
                repository_path: process.cwd(),
                format: 'markdown'
              });
              require('fs').writeFileSync('parity-report.md', result.content[0].text);
            }).catch(console.error);
          "
      
      - name: Check for critical items
        id: critical-check
        run: |
          node -e "
            import('./src/enhanced-server.js').then(async (module) => {
              const server = new module.default();
              const result = await server.getActionableItems({
                repository_path: process.cwd(),
                priority_filter: 'critical',
                limit: 10
              });
              const data = JSON.parse(result.content[0].text);
              console.log('critical_count=' + data.actionable_items.length);
              if (data.actionable_items.length > 0) {
                console.log('has_critical=true');
              } else {
                console.log('has_critical=false');
              }
            }).catch(console.error);
          " >> \$GITHUB_OUTPUT
      
      - name: Upload parity report
        uses: actions/upload-artifact@v4
        with:
          name: parity-report-\${{ github.run_number }}
          path: parity-report.md
          retention-days: 30
      
      - name: Create issue for critical items
        if: steps.critical-check.outputs.has_critical == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('parity-report.md', 'utf8');
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Critical Fork Parity Items Detected - \${{ github.run_number }}',
              body: \`## 🚨 Critical Fork Parity Items Detected
              
              The daily fork parity sync has detected \${{ steps.critical-check.outputs.critical_count }} critical items requiring immediate attention.
              
              ### Full Report
              \${report}
              
              ### Next Steps
              1. Review the critical items listed above
              2. Prioritize integration or adaptation
              3. Update commit status using fork parity tools
              
              **Generated by:** Fork Parity Daily Sync
              **Run:** \${{ github.run_number }}
              **Date:** \${{ github.run_date }}
              \`,
              labels: ['fork-parity', 'critical', 'automated']
            });
      
      {{NOTIFICATION_STEPS}}
`;
  }

  getPRCheckWorkflow() {
    return `# Fork Parity PR Check
name: Fork Parity PR Check

on:
  pull_request:
    types: [opened, synchronize, reopened]
  pull_request_target:
    types: [opened, synchronize, reopened]

jobs:
  check-parity:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      checks: write
    steps:
      - name: Checkout PR
        uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.head.sha }}
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm install -g @moikas/fork-parity-mcp
          npm install better-sqlite3
      
      - name: Configure Git
        run: |
          git config --global user.name "Fork Parity Bot"
          git config --global user.email "fork-parity@github-actions.local"
      
      - name: Add upstream remote
        run: |
          if ! git remote get-url upstream 2>/dev/null; then
            git remote add upstream \${{ secrets.UPSTREAM_REPO_URL || github.event.repository.parent.clone_url }}
          fi
          git fetch upstream
      
      - name: Analyze PR commits
        id: pr-analysis
        run: |
          echo "Analyzing PR commits for fork parity impact..."
          
          # Get list of commits in this PR
          COMMITS=\$(git rev-list --reverse \${{ github.event.pull_request.base.sha }}..\${{ github.event.pull_request.head.sha }})
          
          node -e "
            const commits = '\$COMMITS'.split('\n').filter(c => c.trim());
            
            import('./src/enhanced-server.js').then(async (module) => {
              const server = new module.default();
              
              // Analyze each commit
              const analyses = [];
              for (const commit of commits) {
                try {
                  const result = await server.autoTriageCommits({
                    commit_hashes: [commit],
                    repository_path: process.cwd()
                  });
                  analyses.push(JSON.parse(result.content[0].text));
                } catch (error) {
                  console.log('Error analyzing commit', commit, ':', error.message);
                }
              }
              
              // Generate summary
              const summary = {
                total_commits: commits.length,
                analyzed_commits: analyses.length,
                critical_items: analyses.filter(a => a.results?.some(r => r.triage?.priority === 'critical')).length,
                high_items: analyses.filter(a => a.results?.some(r => r.triage?.priority === 'high')).length,
                analyses: analyses
              };
              
              console.log('PR_ANALYSIS=' + JSON.stringify(summary));
              
              // Set outputs
              console.log('critical_count=' + summary.critical_items);
              console.log('high_count=' + summary.high_items);
              console.log('total_analyzed=' + summary.analyzed_commits);
              
            }).catch(console.error);
          " >> \$GITHUB_OUTPUT
      
      - name: Check for upstream conflicts
        id: conflict-check
        run: |
          echo "Checking for potential upstream conflicts..."
          
          # Check if any commits might conflict with upstream
          CONFLICT_RISK=\$(git merge-tree \$(git merge-base HEAD upstream/main) HEAD upstream/main | wc -l)
          
          if [ "\$CONFLICT_RISK" -gt 0 ]; then
            echo "conflict_risk=high" >> \$GITHUB_OUTPUT
            echo "conflict_details=Potential merge conflicts detected with upstream" >> \$GITHUB_OUTPUT
          else
            echo "conflict_risk=low" >> \$GITHUB_OUTPUT
            echo "conflict_details=No obvious conflicts with upstream" >> \$GITHUB_OUTPUT
          fi
      
      - name: Generate PR comment
        uses: actions/github-script@v7
        with:
          script: |
            const analysis = JSON.parse('\${{ steps.pr-analysis.outputs.PR_ANALYSIS }}' || '{}');
            const conflictRisk = '\${{ steps.conflict-check.outputs.conflict_risk }}';
            const criticalCount = '\${{ steps.pr-analysis.outputs.critical_count }}' || '0';
            const highCount = '\${{ steps.pr-analysis.outputs.high_count }}' || '0';
            
            let status = '✅ Good';
            let statusColor = 'green';
            
            if (parseInt(criticalCount) > 0) {
              status = '🚨 Critical Issues';
              statusColor = 'red';
            } else if (parseInt(highCount) > 0 || conflictRisk === 'high') {
              status = '⚠️ Needs Review';
              statusColor = 'yellow';
            }
            
            const body = \`## 🔄 Fork Parity Analysis
            
            **Status:** \${status}
            
            ### Summary
            - **Commits Analyzed:** \${{ steps.pr-analysis.outputs.total_analyzed }}
            - **Critical Priority:** \${criticalCount}
            - **High Priority:** \${highCount}
            - **Upstream Conflict Risk:** \${conflictRisk}
            
            ### Recommendations
            \${parseInt(criticalCount) > 0 ? '🚨 **Critical items detected** - Review immediately before merge' : ''}
            \${parseInt(highCount) > 0 ? '⚠️ **High priority items** - Consider reviewing before merge' : ''}
            \${conflictRisk === 'high' ? '⚠️ **Potential conflicts** - May conflict with upstream changes' : ''}
            \${status === '✅ Good' ? '✅ **No issues detected** - Safe to proceed' : ''}
            
            ### Next Steps
            1. Review the analysis results above
            2. Address any critical or high-priority items
            3. Consider impact on fork parity maintenance
            
            <details>
            <summary>Detailed Analysis</summary>
            
            \`\`\`json
            \${JSON.stringify(analysis, null, 2)}
            \`\`\`
            
            </details>
            
            ---
            *Generated by Fork Parity MCP • [Learn more](https://github.com/moikas-code/fork-parity-mcp)*
            \`;
            
            // Find existing comment
            const comments = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });
            
            const existingComment = comments.data.find(comment => 
              comment.user.login === 'github-actions[bot]' && 
              comment.body.includes('Fork Parity Analysis')
            );
            
            if (existingComment) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existingComment.id,
                body: body
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: body
              });
            }
      
      - name: Set check status
        uses: actions/github-script@v7
        with:
          script: |
            const criticalCount = parseInt('\${{ steps.pr-analysis.outputs.critical_count }}' || '0');
            const conflictRisk = '\${{ steps.conflict-check.outputs.conflict_risk }}';
            
            let conclusion = 'success';
            let title = 'Fork parity check passed';
            let summary = 'No critical issues detected';
            
            if (criticalCount > 0) {
              conclusion = 'failure';
              title = 'Fork parity check failed';
              summary = \`\${criticalCount} critical issue(s) detected\`;
            } else if (conflictRisk === 'high') {
              conclusion = 'neutral';
              title = 'Fork parity check - review recommended';
              summary = 'Potential upstream conflicts detected';
            }
            
            await github.rest.checks.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: 'Fork Parity Analysis',
              head_sha: '\${{ github.event.pull_request.head.sha }}',
              status: 'completed',
              conclusion: conclusion,
              output: {
                title: title,
                summary: summary,
                text: 'See PR comment for detailed analysis results'
              }
            });
      
      {{NOTIFICATION_STEPS}}
`;
  }

  getCriticalAlertWorkflow() {
    return `name: Fork Parity Critical Alert

on:
  schedule:
    # Check every 4 hours during business days
    - cron: '0 */4 * * 1-5'
  workflow_dispatch:

jobs:
  critical-alert:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Check for critical items
      id: critical-check
      run: |
        if [ -f ".fork-parity/parity.db" ]; then
          DASHBOARD_OUTPUT=$(fork-parity dashboard --format json)
          CRITICAL_COUNT=$(echo "\$DASHBOARD_OUTPUT" | jq '.summary.critical_count')
          
          if [ "\$CRITICAL_COUNT" -gt 0 ]; then
            echo "has_critical=true" >> $GITHUB_OUTPUT
            echo "critical_count=\$CRITICAL_COUNT" >> $GITHUB_OUTPUT
            echo "dashboard=\$DASHBOARD_OUTPUT" >> $GITHUB_OUTPUT
          else
            echo "has_critical=false" >> $GITHUB_OUTPUT
          fi
        else
          echo "has_critical=false" >> $GITHUB_OUTPUT
        fi

    - name: Send critical alert
      if: steps.critical-check.outputs.has_critical == 'true'
      run: |
        echo "🚨 CRITICAL ALERT: \${{ steps.critical-check.outputs.critical_count }} critical upstream changes detected!"
        
        # Send to multiple notification channels
        if [ -n "\${{ secrets.SLACK_WEBHOOK_URL }}" ]; then
          curl -X POST -H 'Content-type: application/json' \\
            --data "{\\"text\\":\\"🚨 CRITICAL: \${{ steps.critical-check.outputs.critical_count }} critical upstream changes in \${{ github.repository }} require immediate attention!\\"}" \\
            \${{ secrets.SLACK_WEBHOOK_URL }}
        fi
        
        if [ -n "\${{ secrets.DISCORD_WEBHOOK_URL }}" ]; then
          curl -X POST -H 'Content-type: application/json' \\
            --data "{\\"content\\":\\"🚨 **CRITICAL ALERT**\\\\n\${{ steps.critical-check.outputs.critical_count }} critical upstream changes in \${{ github.repository }} require immediate attention!\\\\n\\\\nRun \\\`fork-parity dashboard\\\` to see details.\\"}" \\
            \${{ secrets.DISCORD_WEBHOOK_URL }}
        fi

    - name: Create urgent issue
      if: steps.critical-check.outputs.has_critical == 'true'
      uses: actions/github-script@v7
      with:
        script: |
          const dashboard = JSON.parse('\${{ steps.critical-check.outputs.dashboard }}');
          const criticalItems = dashboard.actionableItems.filter(item => item.priority === 'critical');
          
          let body = \`## 🚨 URGENT: Critical Upstream Changes\\n\\n\`;
          body += \`**\${criticalItems.length} critical security/breaking changes** detected from upstream.\\n\\n\`;
          body += \`### Critical Items:\\n\\n\`;
          
          for (const item of criticalItems.slice(0, 5)) {
            body += \`- 🚨 **[\${item.hash.substring(0, 8)}]** \${item.message}\\n\`;
            body += \`  - Author: \${item.author}\\n\`;
            body += \`  - Category: \${item.category}\\n\\n\`;
          }
          
          body += \`### Immediate Actions Required:\\n\`;
          body += \`1. 🔍 Review each critical item above\\n\`;
          body += \`2. 🛡️ Assess security implications\\n\`;
          body += \`3. 🔧 Plan integration strategy\\n\`;
          body += \`4. ✅ Update status: \\\`fork-parity status <hash> <status>\\\`\\n\`;
          body += \`5. 🚀 Deploy fixes if needed\\n\\n\`;
          body += \`**This issue will auto-close when all critical items are addressed.**\`;
          
          github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: \`🚨 URGENT: \${criticalItems.length} Critical Upstream Changes\`,
            body: body,
            labels: ['fork-parity', 'critical', 'urgent', 'security'],
            assignees: ['\${{ github.repository_owner }}']
          });`;
  }

  getAutoIntegrationWorkflow() {
    return `name: Fork Parity Auto Integration (Experimental)

on:
  schedule:
    # Run twice daily
    - cron: '0 6,18 * * *'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run (no actual integration)'
        required: false
        default: 'true'
        type: boolean

jobs:
  auto-integration:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        token: \${{ secrets.GITHUB_TOKEN }}

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Sync with upstream
      run: fork-parity sync

    - name: Identify auto-integration candidates
      id: candidates
      run: |
        # Get low-risk, trivial changes
        CANDIDATES=$(fork-parity list --status pending --format json | jq '[.[] | select(.priority == "low" and .effort_estimate == "trivial" and .conflict_risk < 0.3)]')
        echo "candidates=\$CANDIDATES" >> $GITHUB_OUTPUT
        
        CANDIDATE_COUNT=$(echo "\$CANDIDATES" | jq 'length')
        echo "candidate_count=\$CANDIDATE_COUNT" >> $GITHUB_OUTPUT

    - name: Auto-integrate safe changes
      if: steps.candidates.outputs.candidate_count > 0 && github.event.inputs.dry_run != 'true'
      run: |
        echo "Found \${{ steps.candidates.outputs.candidate_count }} auto-integration candidates"
        
        # Create integration branch
        git checkout -b "auto-integration-\$(date +%Y%m%d-%H%M%S)"
        
        # Process each candidate
        echo '\${{ steps.candidates.outputs.candidates }}' | jq -r '.[].hash' | while read hash; do
          echo "Auto-integrating \$hash..."
          
          # Attempt cherry-pick
          if git cherry-pick "\$hash"; then
            echo "✅ Successfully integrated \$hash"
            fork-parity status "\$hash" integrated --reason "Auto-integrated (low risk, trivial change)"
          else
            echo "❌ Failed to integrate \$hash, reverting"
            git cherry-pick --abort
            fork-parity status "\$hash" conflict --reason "Auto-integration failed, manual review needed"
          fi
        done
        
        # Push integration branch
        git push origin HEAD

    - name: Create integration PR
      if: steps.candidates.outputs.candidate_count > 0 && github.event.inputs.dry_run != 'true'
      uses: actions/github-script@v7
      with:
        script: |
          const candidates = JSON.parse('\${{ steps.candidates.outputs.candidates }}');
          
          let body = \`## 🤖 Automated Fork Parity Integration\\n\\n\`;
          body += \`This PR contains \${candidates.length} low-risk upstream changes that were automatically integrated.\\n\\n\`;
          body += \`### Integrated Changes:\\n\\n\`;
          
          for (const candidate of candidates) {
            body += \`- ✅ [\${candidate.hash.substring(0, 8)}] \${candidate.message}\\n\`;
            body += \`  - Priority: \${candidate.priority}\\n\`;
            body += \`  - Effort: \${candidate.effort_estimate}\\n\`;
            body += \`  - Risk: \${Math.round(candidate.conflict_risk * 100)}%\\n\\n\`;
          }
          
          body += \`### Safety Checks:\\n\`;
          body += \`- ✅ All changes are low priority\\n\`;
          body += \`- ✅ All changes are trivial effort\\n\`;
          body += \`- ✅ All changes have <30% conflict risk\\n\`;
          body += \`- ✅ Automated testing will run on this PR\\n\\n\`;
          body += \`**Review and merge when ready. Auto-generated by Fork Parity.**\`;
          
          const branchName = \`auto-integration-\${new Date().toISOString().slice(0,10).replace(/-/g,'')}\`;
          
          github.rest.pulls.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: \`🤖 Auto-integrate \${candidates.length} low-risk upstream changes\`,
            head: branchName,
            base: 'main',
            body: body,
            labels: ['fork-parity', 'auto-integration', 'low-risk']
          });

    - name: Report dry run results
      if: github.event.inputs.dry_run == 'true'
      run: |
        echo "🧪 DRY RUN: Would have integrated \${{ steps.candidates.outputs.candidate_count }} changes"
        echo "Candidates:"
        echo '\${{ steps.candidates.outputs.candidates }}' | jq -r '.[] | "- [\(.hash[0:8])] \(.message)"'`;
  }

  getSecurityScanWorkflow() {
    return `name: Fork Parity Security Scan

on:
  schedule:
    # Run security scan weekly
    - cron: '0 2 * * 1'
  workflow_dispatch:

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run security analysis
      id: security-scan
      run: |
        if [ -f ".fork-parity/parity.db" ]; then
          # Get commits with security impact
          SECURITY_ITEMS=$(fork-parity list --status pending --format json | jq '[.[] | select(.category == "security" or .priority == "critical")]')
          SECURITY_COUNT=$(echo "\$SECURITY_ITEMS" | jq 'length')
          
          echo "security_items=\$SECURITY_ITEMS" >> $GITHUB_OUTPUT
          echo "security_count=\$SECURITY_COUNT" >> $GITHUB_OUTPUT
          echo "has_security_items=\$([ \$SECURITY_COUNT -gt 0 ] && echo true || echo false)" >> $GITHUB_OUTPUT
        else
          echo "has_security_items=false" >> $GITHUB_OUTPUT
        fi

    - name: Run npm audit
      id: npm-audit
      run: |
        if npm audit --audit-level=moderate --json > audit-results.json 2>/dev/null; then
          echo "npm_vulnerabilities=0" >> $GITHUB_OUTPUT
        else
          VULN_COUNT=$(cat audit-results.json | jq '.metadata.vulnerabilities.total // 0')
          echo "npm_vulnerabilities=\$VULN_COUNT" >> $GITHUB_OUTPUT
        fi

    - name: Create security report
      if: steps.security-scan.outputs.has_security_items == 'true' || steps.npm-audit.outputs.npm_vulnerabilities > 0
      uses: actions/github-script@v7
      with:
        script: |
          let body = \`## 🛡️ Security Scan Report\\n\\n\`;
          
          const securityCount = '\${{ steps.security-scan.outputs.security_count }}';
          const npmVulns = '\${{ steps.npm-audit.outputs.npm_vulnerabilities }}';
          
          if (securityCount > 0) {
            body += \`### 🚨 Upstream Security Items: \${securityCount}\\n\\n\`;
            const securityItems = JSON.parse('\${{ steps.security-scan.outputs.security_items }}');
            
            for (const item of securityItems.slice(0, 5)) {
              body += \`- **[\${item.hash.substring(0, 8)}]** \${item.message}\\n\`;
              body += \`  - Priority: \${item.priority}\\n\`;
              body += \`  - Category: \${item.category}\\n\\n\`;
            }
          }
          
          if (npmVulns > 0) {
            body += \`### 📦 NPM Vulnerabilities: \${npmVulns}\\n\\n\`;
            body += \`Run \\\`npm audit\\\` for details and \\\`npm audit fix\\\` to resolve.\\n\\n\`;
          }
          
          body += \`### Recommended Actions:\\n\`;
          body += \`1. 🔍 Review all security-related upstream changes\\n\`;
          body += \`2. 🛡️ Prioritize security fixes for integration\\n\`;
          body += \`3. 🧪 Test security fixes in staging environment\\n\`;
          body += \`4. 📋 Update security documentation\\n\`;
          body += \`5. 🚀 Deploy security fixes promptly\\n\\n\`;
          body += \`*This report is generated weekly. Address items promptly.*\`;
          
          github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: \`🛡️ Weekly Security Scan: \${parseInt(securityCount) + parseInt(npmVulns)} items\`,
            body: body,
            labels: ['fork-parity', 'security', 'weekly-scan']
          });

    - name: Upload security artifacts
      uses: actions/upload-artifact@v4
      with:
        name: security-scan-\${{ github.run_number }}
        path: |
          audit-results.json
        retention-days: 90`;
  }

  // CI/CD Integration generators
  generateJenkinsIntegration(options) {
    return `pipeline {
    agent any
    
    triggers {
        cron('H 9 * * *') // Daily at 9 AM
    }
    
    environment {
        SLACK_WEBHOOK = credentials('slack-webhook-url')
        DISCORD_WEBHOOK = credentials('discord-webhook-url')
    }
    
    stages {
        stage('Setup') {
            steps {
                checkout scm
                sh 'npm ci'
            }
        }
        
        stage('Fork Parity Sync') {
            steps {
                sh '''
                    if ! git remote get-url upstream > /dev/null 2>&1; then
                        git remote add upstream \${UPSTREAM_REPO_URL}
                    fi
                    git fetch upstream
                    fork-parity sync
                '''
            }
        }
        
        stage('Check Critical Items') {
            steps {
                script {
                    def dashboard = sh(
                        script: 'fork-parity dashboard --format json',
                        returnStdout: true
                    ).trim()
                    
                    def dashboardJson = readJSON text: dashboard
                    def criticalCount = dashboardJson.summary.critical_count
                    
                    if (criticalCount > 0) {
                        currentBuild.result = 'UNSTABLE'
                        
                        // Send notifications
                        if (env.SLACK_WEBHOOK) {
                            sh """
                                curl -X POST -H 'Content-type: application/json' \\
                                  --data '{"text":"🚨 \${criticalCount} critical upstream changes in \${env.JOB_NAME}"}' \\
                                  \${SLACK_WEBHOOK}
                            """
                        }
                        
                        error("Critical upstream changes detected: \${criticalCount}")
                    }
                }
            }
        }
        
        stage('Generate Report') {
            steps {
                sh 'fork-parity export --format json > parity-report.json'
                archiveArtifacts artifacts: 'parity-report.json', fingerprint: true
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            script {
                if (env.SLACK_WEBHOOK) {
                    sh """
                        curl -X POST -H 'Content-type: application/json' \\
                          --data '{"text":"❌ Fork parity check failed in \${env.JOB_NAME}"}' \\
                          \${SLACK_WEBHOOK}
                    """
                }
            }
        }
    }
}`;
  }

  generateGitLabCIIntegration(options) {
    return `# GitLab CI integration for Fork Parity
stages:
  - sync
  - analyze
  - notify

variables:
  NODE_VERSION: "18"

fork_parity_sync:
  stage: sync
  image: node:\${NODE_VERSION}
  before_script:
    - npm ci
    - |
      if ! git remote get-url upstream > /dev/null 2>&1; then
        git remote add upstream \$UPSTREAM_REPO_URL
      fi
  script:
    - git fetch upstream
    - fork-parity sync
    - fork-parity dashboard --format json > dashboard.json
  artifacts:
    reports:
      junit: dashboard.json
    paths:
      - dashboard.json
    expire_in: 1 week
  rules:
    - if: \$CI_PIPELINE_SOURCE == "schedule"
    - if: \$CI_PIPELINE_SOURCE == "web"

analyze_critical:
  stage: analyze
  image: node:\${NODE_VERSION}
  dependencies:
    - fork_parity_sync
  script:
    - |
      CRITICAL_COUNT=\$(cat dashboard.json | jq '.summary.critical_count')
      if [ "\$CRITICAL_COUNT" -gt 0 ]; then
        echo "🚨 \$CRITICAL_COUNT critical upstream changes detected"
        exit 1
      fi
  allow_failure: true

notify_slack:
  stage: notify
  image: curlimages/curl:latest
  dependencies:
    - fork_parity_sync
  script:
    - |
      CRITICAL_COUNT=\$(cat dashboard.json | jq '.summary.critical_count')
      if [ "\$CRITICAL_COUNT" -gt 0 ] && [ -n "\$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \\
          --data "{\\"text\\":\\"🚨 \$CRITICAL_COUNT critical upstream changes in \$CI_PROJECT_NAME\\"}" \\
          \$SLACK_WEBHOOK_URL
      fi
  rules:
    - if: \$CI_PIPELINE_SOURCE == "schedule"
      when: always`;
  }

  generateAzureDevOpsIntegration(options) {
    return `# Azure DevOps Pipeline for Fork Parity
trigger: none

schedules:
- cron: "0 9 * * *"
  displayName: Daily fork parity sync
  branches:
    include:
    - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '\$(nodeVersion)'
  displayName: 'Install Node.js'

- script: npm ci
  displayName: 'Install dependencies'

- script: |
    if ! git remote get-url upstream > /dev/null 2>&1; then
      git remote add upstream \$(UPSTREAM_REPO_URL)
    fi
    git fetch upstream
    fork-parity sync
  displayName: 'Sync with upstream'

- script: |
    fork-parity dashboard --format json > \$(Agent.TempDirectory)/dashboard.json
    CRITICAL_COUNT=\$(cat \$(Agent.TempDirectory)/dashboard.json | jq '.summary.critical_count')
    echo "##vso[task.setvariable variable=criticalCount]\$CRITICAL_COUNT"
  displayName: 'Generate dashboard'

- task: PublishTestResults@2
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '\$(Agent.TempDirectory)/dashboard.json'
    testRunTitle: 'Fork Parity Dashboard'
  condition: always()

- script: |
    if [ "\$(criticalCount)" -gt 0 ]; then
      echo "🚨 \$(criticalCount) critical upstream changes detected"
      exit 1
    fi
  displayName: 'Check critical items'
  condition: always()

- task: InvokeRESTAPI@1
  inputs:
    connectionType: 'connectedServiceName'
    serviceConnection: 'slack-webhook'
    method: 'POST'
    headers: |
      Content-Type: application/json
    body: |
      {
        "text": "🚨 \$(criticalCount) critical upstream changes in \$(Build.Repository.Name)"
      }
  condition: and(always(), gt(variables['criticalCount'], 0))
  displayName: 'Notify Slack'`;
  }

  generateCircleCIIntegration(options) {
    return `# CircleCI configuration for Fork Parity
version: 2.1

orbs:
  node: circleci/node@5.0.0
  slack: circleci/slack@4.10.1

jobs:
  fork-parity-sync:
    executor: node/default
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Setup upstream remote
          command: |
            if ! git remote get-url upstream > /dev/null 2>&1; then
              git remote add upstream \$UPSTREAM_REPO_URL
            fi
      - run:
          name: Sync with upstream
          command: |
            git fetch upstream
            fork-parity sync
      - run:
          name: Generate dashboard
          command: |
            fork-parity dashboard --format json > dashboard.json
            CRITICAL_COUNT=\$(cat dashboard.json | jq '.summary.critical_count')
            echo "export CRITICAL_COUNT=\$CRITICAL_COUNT" >> \$BASH_ENV
      - run:
          name: Check critical items
          command: |
            if [ "\$CRITICAL_COUNT" -gt 0 ]; then
              echo "🚨 \$CRITICAL_COUNT critical upstream changes detected"
              exit 1
            fi
      - slack/notify:
          event: fail
          custom: |
            {
              "text": "🚨 \$CRITICAL_COUNT critical upstream changes in \$CIRCLE_PROJECT_REPONAME",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "🚨 *Critical upstream changes detected*\\n\\n*Project:* \$CIRCLE_PROJECT_REPONAME\\n*Critical items:* \$CRITICAL_COUNT\\n*Build:* <\$CIRCLE_BUILD_URL|#\$CIRCLE_BUILD_NUM>"
                  }
                }
              ]
            }
      - store_artifacts:
          path: dashboard.json
          destination: parity-reports

workflows:
  daily-sync:
    triggers:
      - schedule:
          cron: "0 9 * * *"
          filters:
            branches:
              only:
                - main
    jobs:
      - fork-parity-sync`;
  }

  // Auto-PR generation script
  getAutoPRScript(options) {
    return `#!/usr/bin/env node

// Auto-PR generation script for Fork Parity
// This script identifies safe changes and creates PRs automatically

const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');

const config = ${JSON.stringify(options, null, 2)};

class AutoPRGenerator {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    this.repo = {
      owner: process.env.GITHUB_REPOSITORY.split('/')[0],
      repo: process.env.GITHUB_REPOSITORY.split('/')[1]
    };
  }

  async run() {
    try {
      console.log('🤖 Starting auto-PR generation...');
      
      // Get safe integration candidates
      const candidates = await this.getSafeIntegrationCandidates();
      
      if (candidates.length === 0) {
        console.log('✅ No safe integration candidates found');
        return;
      }
      
      console.log(\`📋 Found \${candidates.length} safe integration candidates\`);
      
      // Group candidates by similarity
      const groups = this.groupSimilarChanges(candidates);
      
      // Create PRs for each group
      for (const group of groups) {
        await this.createIntegrationPR(group);
      }
      
      console.log('✅ Auto-PR generation completed');
      
    } catch (error) {
      console.error('❌ Auto-PR generation failed:', error.message);
      process.exit(1);
    }
  }

  async getSafeIntegrationCandidates() {
    const output = execSync('fork-parity list --status pending --format json', { encoding: 'utf8' });
    const pendingCommits = JSON.parse(output);
    
    // Filter for safe integration candidates
    return pendingCommits.filter(commit => {
      return (
        commit.priority === 'low' &&
        commit.effort_estimate === 'trivial' &&
        commit.conflict_risk < config.autoMergeThreshold &&
        !this.hasRiskyPatterns(commit)
      );
    });
  }

  hasRiskyPatterns(commit) {
    const riskyPatterns = [
      /breaking/i,
      /security/i,
      /auth/i,
      /database/i,
      /migration/i,
      /config/i
    ];
    
    return riskyPatterns.some(pattern => pattern.test(commit.message));
  }

  groupSimilarChanges(candidates) {
    const groups = [];
    const maxGroupSize = 5;
    
    // Simple grouping by category and file type
    const categoryGroups = {};
    
    for (const candidate of candidates) {
      const key = \`\${candidate.category}-\${this.getFileType(candidate.files_changed)}\`;
      
      if (!categoryGroups[key]) {
        categoryGroups[key] = [];
      }
      
      if (categoryGroups[key].length < maxGroupSize) {
        categoryGroups[key].push(candidate);
      }
    }
    
    // Convert to array and filter out single-item groups
    for (const [key, group] of Object.entries(categoryGroups)) {
      if (group.length >= 2) {
        groups.push({
          type: key,
          commits: group
        });
      }
    }
    
    return groups;
  }

  getFileType(filesChanged) {
    if (!filesChanged || filesChanged.length === 0) return 'unknown';
    
    const extensions = filesChanged.map(file => {
      const ext = file.split('.').pop();
      return ext;
    });
    
    const mostCommon = extensions.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );
    
    return mostCommon;
  }

  async createIntegrationPR(group) {
    const branchName = \`auto-integration/\${group.type}-\${Date.now()}\`;
    const commits = group.commits;
    
    try {
      console.log(\`📝 Creating PR for \${commits.length} \${group.type} changes...\`);
      
      // Create branch
      execSync(\`git checkout -b \${branchName}\`);
      
      // Cherry-pick commits
      let successfulIntegrations = 0;
      const integratedCommits = [];
      
      for (const commit of commits) {
        try {
          execSync(\`git cherry-pick \${commit.hash}\`, { stdio: 'ignore' });
          integratedCommits.push(commit);
          successfulIntegrations++;
          
          // Update status
          execSync(\`fork-parity status \${commit.hash} integrated --reason "Auto-integrated via PR"\`);
          
        } catch (error) {
          console.log(\`⚠️ Failed to integrate \${commit.hash}, skipping\`);
          execSync('git cherry-pick --abort', { stdio: 'ignore' });
          
          // Update status
          execSync(\`fork-parity status \${commit.hash} conflict --reason "Auto-integration failed"\`);
        }
      }
      
      if (successfulIntegrations === 0) {
        console.log('❌ No commits could be integrated, aborting PR');
        execSync('git checkout -');
        execSync(\`git branch -D \${branchName}\`);
        return;
      }
      
      // Push branch
      execSync(\`git push origin \${branchName}\`);
      
      // Create PR
      const prBody = this.generatePRBody(integratedCommits, group.type);
      
      const pr = await this.octokit.rest.pulls.create({
        ...this.repo,
        title: \`🤖 Auto-integrate \${successfulIntegrations} \${group.type} changes\`,
        head: branchName,
        base: 'main',
        body: prBody,
        draft: config.draftPRs
      });
      
      // Add labels
      await this.octokit.rest.issues.addLabels({
        ...this.repo,
        issue_number: pr.data.number,
        labels: [
          \`\${config.labelPrefix}-auto\`,
          \`\${config.labelPrefix}-\${group.type}\`,
          'low-risk'
        ]
      });
      
      // Request reviews if configured
      if (config.requireReviews && process.env.DEFAULT_REVIEWERS) {
        const reviewers = process.env.DEFAULT_REVIEWERS.split(',');
        await this.octokit.rest.pulls.requestReviewers({
          ...this.repo,
          pull_number: pr.data.number,
          reviewers: reviewers
        });
      }
      
      console.log(\`✅ Created PR #\${pr.data.number}: \${pr.data.html_url}\`);
      
      // Switch back to main branch
      execSync('git checkout -');
      
    } catch (error) {
      console.error(\`❌ Failed to create PR for \${group.type}:\`, error.message);
      
      // Cleanup
      try {
        execSync('git checkout -');
        execSync(\`git branch -D \${branchName}\`);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }
  }

  generatePRBody(commits, groupType) {
    let body = \`## 🤖 Automated Integration\\n\\n\`;
    body += \`This PR automatically integrates \${commits.length} low-risk \${groupType} changes from upstream.\\n\\n\`;
    
    body += \`### Integrated Changes\\n\\n\`;
    for (const commit of commits) {
      body += \`- ✅ [\${commit.hash.substring(0, 8)}] \${commit.message}\\n\`;
      body += \`  - Author: \${commit.author}\\n\`;
      body += \`  - Risk: \${Math.round(commit.conflict_risk * 100)}%\\n\\n\`;
    }
    
    body += \`### Safety Verification\\n\\n\`;
    body += \`- ✅ All changes are low priority\\n\`;
    body += \`- ✅ All changes are trivial effort\\n\`;
    body += \`- ✅ All changes have <\${Math.round(config.autoMergeThreshold * 100)}% conflict risk\\n\`;
    body += \`- ✅ No risky patterns detected\\n\`;
    body += \`- ✅ Grouped by similarity for easier review\\n\\n\`;
    
    body += \`### Testing\\n\\n\`;
    body += \`- [ ] Automated tests pass\\n\`;
    body += \`- [ ] Manual smoke testing completed\\n\`;
    body += \`- [ ] No regressions detected\\n\\n\`;
    
    body += \`---\\n\`;
    body += \`*This PR was automatically generated by Fork Parity. Review and merge when ready.*\`;
    
    return body;
  }
}

// Run the auto-PR generator
if (require.main === module) {
  const generator = new AutoPRGenerator();
  generator.run();
}

module.exports = AutoPRGenerator;`;
  }

  // Helper methods
  customizeWorkflow(workflowType, options) {
    let workflow = this.workflowTemplates[workflowType];
    
    // Replace placeholders with actual values
    if (options.slackWebhook) {
      workflow = workflow.replace(/env\.SLACK_WEBHOOK_URL/g, 'secrets.SLACK_WEBHOOK_URL');
    }
    
    if (options.discordWebhook) {
      workflow = workflow.replace(/env\.DISCORD_WEBHOOK_URL/g, 'secrets.DISCORD_WEBHOOK_URL');
    }
    
    return workflow;
  }

  createConfigFile(repositoryPath, options) {
    const config = {
      version: '1.0.0',
      fork_parity: {
        workflows: {
          daily_sync: options.enableDailySync || false,
          pr_checks: options.enablePRChecks || false,
          critical_alerts: options.enableCriticalAlerts || false,
          auto_integration: options.enableAutoIntegration || false,
          security_scans: options.enableSecurityScans || false
        },
        notifications: {
          slack_webhook: options.slackWebhook ? 'SLACK_WEBHOOK_URL' : null,
          discord_webhook: options.discordWebhook ? 'DISCORD_WEBHOOK_URL' : null,
          email: options.emailNotifications || null
        },
        auto_integration: {
          enabled: options.enableAutoIntegration || false,
          max_risk_threshold: 0.3,
          require_reviews: true,
          create_draft_prs: true
        }
      }
    };
    
    const configPath = join(repositoryPath, '.github', 'fork-parity-config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  getNextSteps(options) {
    const steps = [
      'Add repository secrets for webhooks (SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL)',
      'Set UPSTREAM_REPO_URL secret with your upstream repository URL',
      'Configure branch protection rules if using auto-integration',
      'Test workflows by running them manually first'
    ];
    
    if (options.enableAutoIntegration) {
      steps.push('Set DEFAULT_REVIEWERS environment variable for auto-PRs');
      steps.push('Install @octokit/rest dependency for auto-PR generation');
    }
    
    return steps;
  }
  /**
   * Generate notification steps for workflows
   */
  generateNotificationSteps(options) {
    const steps = [];
    
    // Slack notification
    if (options.slackWebhook) {
      steps.push(`
      - name: Send Slack notification
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: \${{ job.status }}
          webhook_url: \${{ secrets.SLACK_WEBHOOK }}
          channel: '#fork-parity'
          username: 'Fork Parity Bot'
          icon_emoji: ':fork_and_knife:'
          fields: repo,message,commit,author,action,eventName,ref,workflow
          text: |
            Fork Parity Update: \${{ job.status }}
            Repository: \${{ github.repository }}
            Workflow: \${{ github.workflow }}
            Run: \${{ github.run_number }}
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK }}
      `);
    }
    
    // Discord notification
    if (options.discordWebhook) {
      steps.push(`
      - name: Send Discord notification
        if: always()
        uses: Ilshidur/action-discord@master
        with:
          args: |
            🔄 **Fork Parity Update**
            **Status:** \${{ job.status }}
            **Repository:** \${{ github.repository }}
            **Workflow:** \${{ github.workflow }}
            **Run:** \${{ github.run_number }}
            **Commit:** \${{ github.sha }}
        env:
          DISCORD_WEBHOOK: \${{ secrets.DISCORD_WEBHOOK }}
      `);
    }
    
    // Email notification
    if (options.emailNotifications) {
      steps.push(`
      - name: Send email notification
        if: failure() || (success() && contains(github.event.head_commit.message, '[notify]'))
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 587
          username: \${{ secrets.EMAIL_USERNAME }}
          password: \${{ secrets.EMAIL_PASSWORD }}
          subject: 'Fork Parity Update - \${{ github.repository }}'
          to: \${{ secrets.EMAIL_RECIPIENTS }}
          from: 'Fork Parity Bot <noreply@github.com>'
          body: |
            Fork Parity Workflow Completed
            
            Repository: \${{ github.repository }}
            Workflow: \${{ github.workflow }}
            Status: \${{ job.status }}
            Run Number: \${{ github.run_number }}
            Commit: \${{ github.sha }}
            
            View details: \${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}
      `);
    }
    
    return steps.join('\n');
  }

  getCriticalAlertWorkflow() {
    return `# Fork Parity Critical Alert
name: Fork Parity Critical Alert

on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:

jobs:
  critical-check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm install -g @moikas/fork-parity-mcp
          npm install better-sqlite3
      
      - name: Add upstream remote
        run: |
          if ! git remote get-url upstream 2>/dev/null; then
            git remote add upstream \${{ secrets.UPSTREAM_REPO_URL || github.event.repository.parent.clone_url }}
          fi
          git fetch upstream
      
      - name: Check for critical items
        id: critical-check
        run: |
          node -e "
            import('./src/enhanced-server.js').then(async (module) => {
              const server = new module.default();
              
              // Sync first
              await server.syncAndAnalyze({
                repository_path: process.cwd(),
                upstream_branch: 'main'
              });
              
              // Get critical items
              const result = await server.getActionableItems({
                repository_path: process.cwd(),
                priority_filter: 'critical',
                limit: 20
              });
              
              const data = JSON.parse(result.content[0].text);
              console.log('critical_count=' + data.actionable_items.length);
              
              if (data.actionable_items.length > 0) {
                console.log('has_critical=true');
                console.log('critical_items=' + JSON.stringify(data.actionable_items));
              } else {
                console.log('has_critical=false');
              }
            }).catch(console.error);
          " >> \$GITHUB_OUTPUT
      
      - name: Create critical alert issue
        if: steps.critical-check.outputs.has_critical == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const criticalItems = JSON.parse('\${{ steps.critical-check.outputs.critical_items }}' || '[]');
            const count = '\${{ steps.critical-check.outputs.critical_count }}';
            
            const itemsList = criticalItems.map(item => 
              \`- **\${item.hash.substring(0, 8)}**: \${item.message.substring(0, 80)}...\`
            ).join('\n');
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: \`🚨 CRITICAL: \${count} Fork Parity Items Require Immediate Attention\`,
              body: \`## 🚨 Critical Fork Parity Alert
              
              **\${count} critical items** have been detected that require immediate attention.
              
              ### Critical Items:
              \${itemsList}
              
              ### Immediate Actions Required:
              1. **Review each critical item** - These may be security fixes or breaking changes
              2. **Prioritize integration** - Critical items should be integrated ASAP
              3. **Test thoroughly** - Ensure proper testing before deployment
              4. **Update status** - Mark items as reviewed/integrated when complete
              
              ### How to Address:
              \`\`\`bash
              # Use fork parity tools to analyze and integrate
              fork-parity analyze-commit <commit-hash>
              fork-parity update-status <commit-hash> reviewed
              \`\`\`
              
              **⚠️ This is an automated alert. Critical items detected at:** \${{ github.run_date }}
              **🔗 Workflow run:** \${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}
              \`,
              labels: ['fork-parity', 'critical', 'urgent', 'automated'],
              assignees: ['\${{ github.repository_owner }}']
            });
      
      {{NOTIFICATION_STEPS}}
`;
  }

  getAutoIntegrationWorkflow() {
    return `# Fork Parity Auto Integration (Experimental)
name: Fork Parity Auto Integration

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM UTC
  workflow_dispatch:
    inputs:
      max_commits:
        description: 'Maximum commits to auto-integrate'
        required: false
        default: '5'
      risk_level:
        description: 'Maximum risk level to auto-integrate'
        required: false
        default: 'low'
        type: choice
        options:
          - low
          - medium

jobs:
  auto-integrate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: \${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm install -g @moikas/fork-parity-mcp
          npm install better-sqlite3
      
      - name: Configure Git
        run: |
          git config --global user.name "Fork Parity Auto-Integration"
          git config --global user.email "fork-parity-auto@github-actions.local"
      
      - name: Add upstream remote
        run: |
          if ! git remote get-url upstream 2>/dev/null; then
            git remote add upstream \${{ secrets.UPSTREAM_REPO_URL || github.event.repository.parent.clone_url }}
          fi
          git fetch upstream
      
      - name: Find auto-integration candidates
        id: candidates
        run: |
          MAX_COMMITS=\${{ github.event.inputs.max_commits || '5' }}
          RISK_LEVEL=\${{ github.event.inputs.risk_level || 'low' }}
          
          node -e "
            import('./src/enhanced-server.js').then(async (module) => {
              const server = new module.default();
              
              // Sync and get actionable items
              await server.syncAndAnalyze({
                repository_path: process.cwd(),
                upstream_branch: 'main'
              });
              
              const result = await server.getActionableItems({
                repository_path: process.cwd(),
                priority_filter: 'low',
                limit: parseInt('\$MAX_COMMITS')
              });
              
              const data = JSON.parse(result.content[0].text);
              
              // Filter for auto-integration candidates
              const candidates = data.actionable_items.filter(item => {
                // Only integrate low-risk, simple changes
                return item.priority === 'low' && 
                       (item.category === 'docs' || item.category === 'test' || item.category === 'chore') &&
                       item.effort_estimate === 'trivial';
              });
              
              console.log('candidates=' + JSON.stringify(candidates));
              console.log('candidate_count=' + candidates.length);
              
            }).catch(console.error);
          " >> \$GITHUB_OUTPUT
      
      - name: Create auto-integration branch
        if: steps.candidates.outputs.candidate_count > 0
        run: |
          BRANCH_NAME="auto-integration-\$(date +%Y%m%d-%H%M%S)"
          git checkout -b "\$BRANCH_NAME"
          echo "branch_name=\$BRANCH_NAME" >> \$GITHUB_OUTPUT
        id: branch
      
      - name: Integrate candidates
        if: steps.candidates.outputs.candidate_count > 0
        run: |
          CANDIDATES='\${{ steps.candidates.outputs.candidates }}'
          
          node -e "
            const candidates = JSON.parse('\$CANDIDATES');
            const { execSync } = require('child_process');
            
            let integratedCount = 0;
            const integratedCommits = [];
            
            for (const candidate of candidates) {
              try {
                console.log(\`Integrating commit \${candidate.hash}...\`);
                
                // Cherry-pick the commit
                execSync(\`git cherry-pick \${candidate.hash}\`, { 
                  stdio: 'inherit',
                  cwd: process.cwd()
                });
                
                integratedCommits.push(candidate);
                integratedCount++;
                
                console.log(\`✅ Successfully integrated \${candidate.hash}\`);
                
              } catch (error) {
                console.log(\`❌ Failed to integrate \${candidate.hash}: \${error.message}\`);
                
                // Abort cherry-pick if it failed
                try {
                  execSync('git cherry-pick --abort', { cwd: process.cwd() });
                } catch {}
                
                break; // Stop on first failure
              }
            }
            
            console.log(\`Integrated \${integratedCount} commits successfully\`);
            console.log('integrated_count=' + integratedCount);
            console.log('integrated_commits=' + JSON.stringify(integratedCommits));
          " >> \$GITHUB_OUTPUT
        id: integration
      
      - name: Create pull request
        if: steps.integration.outputs.integrated_count > 0
        uses: actions/github-script@v7
        with:
          script: |
            const integratedCommits = JSON.parse('\${{ steps.integration.outputs.integrated_commits }}' || '[]');
            const count = '\${{ steps.integration.outputs.integrated_count }}';
            const branchName = '\${{ steps.branch.outputs.branch_name }}';
            
            const commitsList = integratedCommits.map(commit => 
              \`- \${commit.hash.substring(0, 8)}: \${commit.message}\`
            ).join('\n');
            
            const pr = await github.rest.pulls.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: \`🤖 Auto-integration: \${count} low-risk upstream commits\`,
              head: branchName,
              base: 'main',
              body: \`## 🤖 Automated Fork Parity Integration
              
              This PR automatically integrates **\${count} low-risk commits** from upstream.
              
              ### Integrated Commits:
              \${commitsList}
              
              ### Safety Checks:
              - ✅ All commits are low priority
              - ✅ Only docs, tests, and chore changes
              - ✅ Estimated effort: trivial
              - ✅ No conflicts detected
              
              ### Review Guidelines:
              1. **Quick review recommended** - These are low-risk changes
              2. **Run tests** - Ensure no regressions
              3. **Merge when ready** - Safe to merge after basic validation
              
              **🔗 Generated by:** Fork Parity Auto-Integration
              **📅 Date:** \${{ github.run_date }}
              \`,
              draft: false
            });
            
            // Add labels
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: pr.data.number,
              labels: ['fork-parity', 'auto-integration', 'low-risk']
            });
            
            console.log(\`Created PR #\${pr.data.number}: \${pr.data.html_url}\`);
      
      {{NOTIFICATION_STEPS}}
`;
  }

  getSecurityScanWorkflow() {
    return `# Fork Parity Security Scan
name: Fork Parity Security Scan

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - 'package*.json'
      - 'yarn.lock'
      - 'pnpm-lock.yaml'

jobs:
  security-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      issues: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm install -g @moikas/fork-parity-mcp
          npm install better-sqlite3
          npm audit --audit-level=moderate || true
      
      - name: Add upstream remote
        run: |
          if ! git remote get-url upstream 2>/dev/null; then
            git remote add upstream \${{ secrets.UPSTREAM_REPO_URL || github.event.repository.parent.clone_url }}
          fi
          git fetch upstream
      
      - name: Run security analysis
        id: security-scan
        run: |
          node -e "
            import('./src/enhanced-server.js').then(async (module) => {
              const server = new module.default();
              
              // Get recent commits for security analysis
              const result = await server.getActionableItems({
                repository_path: process.cwd(),
                priority_filter: 'high',
                limit: 50
              });
              
              const data = JSON.parse(result.content[0].text);
              
              // Filter for security-related items
              const securityItems = data.actionable_items.filter(item => 
                item.category === 'security' || 
                item.message.toLowerCase().includes('security') ||
                item.message.toLowerCase().includes('vulnerability') ||
                item.message.toLowerCase().includes('cve')
              );
              
              console.log('security_count=' + securityItems.length);
              
              if (securityItems.length > 0) {
                console.log('has_security_issues=true');
                console.log('security_items=' + JSON.stringify(securityItems));
              } else {
                console.log('has_security_issues=false');
              }
              
            }).catch(console.error);
          " >> \$GITHUB_OUTPUT
      
      - name: Run npm audit
        id: npm-audit
        run: |
          npm audit --json > audit-results.json || true
          
          VULNERABILITIES=\$(cat audit-results.json | jq '.metadata.vulnerabilities.total // 0')
          CRITICAL=\$(cat audit-results.json | jq '.metadata.vulnerabilities.critical // 0')
          HIGH=\$(cat audit-results.json | jq '.metadata.vulnerabilities.high // 0')
          
          echo "total_vulnerabilities=\$VULNERABILITIES" >> \$GITHUB_OUTPUT
          echo "critical_vulnerabilities=\$CRITICAL" >> \$GITHUB_OUTPUT
          echo "high_vulnerabilities=\$HIGH" >> \$GITHUB_OUTPUT
          
          if [ "\$CRITICAL" -gt 0 ] || [ "\$HIGH" -gt 0 ]; then
            echo "has_vulnerabilities=true" >> \$GITHUB_OUTPUT
          else
            echo "has_vulnerabilities=false" >> \$GITHUB_OUTPUT
          fi
      
      - name: Create security alert issue
        if: steps.security-scan.outputs.has_security_issues == 'true' || steps.npm-audit.outputs.has_vulnerabilities == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const securityItems = JSON.parse('\${{ steps.security-scan.outputs.security_items }}' || '[]');
            const securityCount = '\${{ steps.security-scan.outputs.security_count }}' || '0';
            const totalVulns = '\${{ steps.npm-audit.outputs.total_vulnerabilities }}' || '0';
            const criticalVulns = '\${{ steps.npm-audit.outputs.critical_vulnerabilities }}' || '0';
            const highVulns = '\${{ steps.npm-audit.outputs.high_vulnerabilities }}' || '0';
            
            let body = \`## 🔒 Security Scan Results\n\n\`;
            
            if (parseInt(securityCount) > 0) {
              body += \`### 🚨 Security-Related Upstream Commits (\${securityCount})\n\n\`;
              securityItems.forEach(item => {
                body += \`- **\${item.hash.substring(0, 8)}**: \${item.message.substring(0, 80)}...\n\`;
              });
              body += \`\n\`;
            }
            
            if (parseInt(totalVulns) > 0) {
              body += \`### 📦 Dependency Vulnerabilities\n\n\`;
              body += \`- **Total:** \${totalVulns}\n\`;
              body += \`- **Critical:** \${criticalVulns}\n\`;
              body += \`- **High:** \${highVulns}\n\n\`;
              body += \`Run \`npm audit fix\` to address these vulnerabilities.\n\n\`;
            }
            
            body += \`### Recommended Actions\n\n\`;
            body += \`1. **Review security commits** - Prioritize integration of security fixes\n\`;
            body += \`2. **Update dependencies** - Run \`npm audit fix\` to resolve vulnerabilities\n\`;
            body += \`3. **Test thoroughly** - Ensure security updates don't break functionality\n\`;
            body += \`4. **Monitor regularly** - Set up automated security scanning\n\n\`;
            body += \`**🔗 Scan run:** \${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}\n\`;
            body += \`**📅 Date:** \${{ github.run_date }}\`;
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: \`🔒 Security Scan Alert - \${parseInt(securityCount) + parseInt(totalVulns)} issues detected\`,
              body: body,
              labels: ['security', 'fork-parity', 'automated']
            });
      
      - name: Upload audit results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: security-audit-results
          path: audit-results.json
          retention-days: 30
      
      {{NOTIFICATION_STEPS}}
`;
  }
}

export default GitHubActionsIntegration;