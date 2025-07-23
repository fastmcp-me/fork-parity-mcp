#!/usr/bin/env node

import { program } from 'commander';
import ForkParityDatabase from './database.js';
import SmartTriageSystem from './triage.js';
import AdvancedAnalysisSystem from './advanced-analysis.js';
import IntegrationHelpersSystem from './integration-helpers.js';
import GitHubActionsIntegration from './github-actions.js';
import NotificationSystem from './notifications.js';
import { execSync } from 'child_process';

class ForkParityManager {
  constructor() {
    this.db = new ForkParityDatabase();
    this.triage = new SmartTriageSystem();
    this.advancedAnalysis = new AdvancedAnalysisSystem();
    this.integrationHelpers = new IntegrationHelpersSystem(this.db);
    this.githubActions = new GitHubActionsIntegration();
    this.notifications = new NotificationSystem(this.db);
  }

  async initRepository(upstreamUrl, upstreamBranch = 'main', forkBranch = 'main') {
    const currentPath = process.cwd();
    
    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    } catch {
      console.error('❌ Not in a git repository');
      process.exit(1);
    }

    // Add repository to database
    const result = this.db.addRepository(currentPath, upstreamUrl, upstreamBranch, forkBranch);
    
    // Set up upstream remote if it doesn't exist
    try {
      execSync('git remote get-url upstream', { stdio: 'ignore' });
      console.log('✅ Upstream remote already exists');
    } catch {
      try {
        execSync(`git remote add upstream ${upstreamUrl}`, { stdio: 'ignore' });
        console.log('✅ Added upstream remote');
      } catch (addError) {
        console.error('❌ Failed to add upstream remote:', addError.message);
      }
    }

    console.log(`✅ Initialized fork parity tracking for ${currentPath}`);
    console.log(`📡 Upstream: ${upstreamUrl} (${upstreamBranch})`);
    console.log(`🌿 Fork branch: ${forkBranch}`);
    
    return result;
  }

  async syncUpstream() {
    const currentPath = process.cwd();
    const repo = this.db.getRepository(currentPath);
    
    if (!repo) {
      console.error('❌ Repository not initialized. Run: fork-parity init <upstream-url>');
      process.exit(1);
    }

    console.log('🔄 Fetching upstream changes...');
    
    try {
      // Fetch upstream
      execSync('git fetch upstream', { stdio: 'inherit' });
      
      // Get new commits
      const upstreamBranch = repo.upstream_branch || 'main';
      const forkBranch = repo.fork_branch || 'main';
      
      const logOutput = execSync(
        `git log ${forkBranch}..upstream/${upstreamBranch} --pretty=format:"%H|%an|%ae|%ad|%s" --date=iso --name-only`,
        { encoding: 'utf8' }
      );

      const commits = this.parseGitLog(logOutput);
      console.log(`📊 Found ${commits.length} new commits`);

      // Add commits to database and run triage
      let addedCount = 0;
      for (const commit of commits) {
        try {
          const commitResult = this.db.addCommit(repo.id, commit);
          const commitId = commitResult.lastInsertRowid;
          
          // Run auto-triage
          const triageResult = this.triage.analyzeCommit(commit);
          this.db.addTriageResult(commitId, triageResult);
          
          addedCount++;
        } catch {
          // Commit might already exist, skip
          console.log(`⚠️  Skipped duplicate commit: ${commit.hash.substring(0, 8)}`);
        }
      }

      console.log(`✅ Added ${addedCount} new commits with auto-triage`);
      
      // Show quick summary
      this.showQuickSummary(repo.id);
      
    } catch (error) {
      console.error('❌ Failed to sync upstream:', error.message);
      process.exit(1);
    }
  }

  parseGitLog(logOutput) {
    const commits = [];
    const lines = logOutput.split('\n').filter(line => line.trim());
    
    let currentCommit = null;
    let filesChanged = [];
    
    for (const line of lines) {
      if (line.includes('|')) {
        // This is a commit info line
        if (currentCommit) {
          currentCommit.filesChanged = [...filesChanged];
          commits.push(currentCommit);
          filesChanged = [];
        }
        
        const [hash, author, authorEmail, commitDate, message] = line.split('|');
        currentCommit = {
          hash,
          author,
          authorEmail,
          commitDate: new Date(commitDate).toISOString(),
          message,
          insertions: 0, // We'll need to get this separately if needed
          deletions: 0
        };
      } else if (line.trim() && currentCommit) {
        // This is a file name
        filesChanged.push(line.trim());
      }
    }
    
    // Don't forget the last commit
    if (currentCommit) {
      currentCommit.filesChanged = [...filesChanged];
      commits.push(currentCommit);
    }
    
    return commits;
  }

  showQuickSummary(repositoryId) {
    const dashboard = this.db.getParityDashboard(repositoryId);
    
    console.log('\n📊 Quick Summary:');
    console.log(`   Total commits: ${dashboard.summary.total_commits}`);
    console.log(`   ✅ Integrated: ${dashboard.summary.integrated_count}`);
    console.log(`   ⏳ Pending: ${dashboard.summary.pending_count}`);
    console.log(`   ⚠️  Critical: ${dashboard.summary.critical_count}`);
    console.log(`   🔥 High priority: ${dashboard.summary.high_count}`);
    
    if (dashboard.actionableItems.length > 0) {
      console.log('\n🎯 Top actionable items:');
      dashboard.actionableItems.slice(0, 5).forEach(item => {
        const priority = item.priority === 'critical' ? '🚨' : '⚠️';
        console.log(`   ${priority} ${item.hash.substring(0, 8)} - ${item.message.substring(0, 60)}...`);
      });
    }
  }

  async showDashboard(options = {}) {
    const currentPath = process.cwd();
    const repo = this.db.getRepository(currentPath);
    
    if (!repo) {
      console.error('❌ Repository not initialized. Run: fork-parity init <upstream-url>');
      process.exit(1);
    }

    const dashboard = this.db.getParityDashboard(repo.id, options);
    
    console.log('📊 Fork Parity Dashboard');
    console.log('========================\n');
    
    // Summary statistics
    console.log('📈 Summary:');
    console.log(`   Total commits tracked: ${dashboard.summary.total_commits}`);
    console.log(`   ✅ Integrated: ${dashboard.summary.integrated_count} (${Math.round(dashboard.summary.integrated_count / dashboard.summary.total_commits * 100)}%)`);
    console.log(`   ⏭️  Skipped: ${dashboard.summary.skipped_count}`);
    console.log(`   ⏳ Pending: ${dashboard.summary.pending_count}`);
    console.log(`   ⚠️  Avg conflict risk: ${Math.round((dashboard.summary.avg_conflict_risk || 0) * 100)}%\n`);
    
    // Priority breakdown
    console.log('🎯 Priority Breakdown:');
    console.log(`   🚨 Critical: ${dashboard.summary.critical_count}`);
    console.log(`   ⚠️  High: ${dashboard.summary.high_count}`);
    console.log(`   📋 Medium: ${dashboard.summary.total_commits - dashboard.summary.critical_count - dashboard.summary.high_count}\n`);
    
    // Actionable items
    if (dashboard.actionableItems.length > 0) {
      console.log('🎯 Actionable Items (High Priority, Pending):');
      console.log('Hash     | Priority | Category | Message');
      console.log('---------|----------|----------|--------');
      
      dashboard.actionableItems.forEach(item => {
        const hash = item.hash.substring(0, 8);
        const priority = item.priority.padEnd(8);
        const category = item.category.padEnd(8);
        const message = item.message.substring(0, 50);
        console.log(`${hash} | ${priority} | ${category} | ${message}...`);
      });
    } else {
      console.log('✅ No high-priority pending items!');
    }
    
    console.log(`\n📅 Generated: ${new Date(dashboard.generatedAt).toLocaleString()}`);
  }

  async updateStatus(commitHash, status, reasoning = '') {
    const currentPath = process.cwd();
    const repo = this.db.getRepository(currentPath);
    
    if (!repo) {
      console.error('❌ Repository not initialized');
      process.exit(1);
    }

    const commitId = this.db.getCommitId(repo.id, commitHash);
    if (!commitId) {
      console.error(`❌ Commit ${commitHash} not found`);
      process.exit(1);
    }

    const metadata = {
      decisionReasoning: reasoning,
      reviewer: process.env.USER || 'unknown',
      reviewDate: new Date().toISOString()
    };

    this.db.updateCommitStatus(commitId, status, metadata);
    
    const statusEmoji = {
      'integrated': '✅',
      'skipped': '⏭️',
      'conflict': '⚠️',
      'deferred': '⏸️',
      'reviewed': '👀'
    };

    console.log(`${statusEmoji[status] || '📝'} Updated ${commitHash.substring(0, 8)} to ${status}`);
    if (reasoning) {
      console.log(`   Reason: ${reasoning}`);
    }
  }

  async listCommits(status = null, limit = 20) {
    const currentPath = process.cwd();
    const repo = this.db.getRepository(currentPath);
    
    if (!repo) {
      console.error('❌ Repository not initialized');
      process.exit(1);
    }

    let commits;
    if (status) {
      commits = this.db.getCommitsByStatus(repo.id, status, limit);
    } else {
      // Get all commits with their status
      const stmt = this.db.db.prepare(`
        SELECT c.*, tr.priority, tr.category, cs.status, cs.decision_reasoning
        FROM commits c
        LEFT JOIN triage_results tr ON c.id = tr.commit_id
        LEFT JOIN commit_status cs ON c.id = cs.commit_id
        WHERE c.repository_id = ?
        ORDER BY c.commit_date DESC
        LIMIT ?
      `);
      commits = stmt.all(repo.id, limit);
    }

    if (commits.length === 0) {
      console.log('No commits found');
      return;
    }

    console.log(`📋 Commits${status ? ` (${status})` : ''}:`);
    console.log('Hash     | Status    | Priority | Category | Message');
    console.log('---------|-----------|----------|----------|--------');
    
    commits.forEach(commit => {
      const hash = commit.hash.substring(0, 8);
      const status = (commit.status || 'pending').padEnd(9);
      const priority = (commit.priority || 'unknown').padEnd(8);
      const category = (commit.category || 'unknown').padEnd(8);
      const message = commit.message.substring(0, 40);
      console.log(`${hash} | ${status} | ${priority} | ${category} | ${message}...`);
    });
  }

  async exportData(format = 'json') {
    const currentPath = process.cwd();
    const repo = this.db.getRepository(currentPath);
    
    if (!repo) {
      console.error('❌ Repository not initialized');
      process.exit(1);
    }

    // Export all data for the repository
    const stmt = this.db.db.prepare(`
      SELECT 
        c.*,
        tr.priority, tr.category, tr.impact_areas, tr.conflict_risk, 
        tr.effort_estimate, tr.reasoning, tr.confidence,
        cs.status, cs.decision_reasoning, cs.reviewer, cs.review_date
      FROM commits c
      LEFT JOIN triage_results tr ON c.id = tr.commit_id
      LEFT JOIN commit_status cs ON c.id = cs.commit_id
      WHERE c.repository_id = ?
      ORDER BY c.commit_date DESC
    `);
    
    const data = stmt.all(repo.id);
    
    if (format === 'json') {
      console.log(JSON.stringify({
        repository: repo,
        commits: data,
        exportedAt: new Date().toISOString()
      }, null, 2));
    } else if (format === 'csv') {
      // Simple CSV export
      console.log('hash,author,date,message,priority,category,status,reasoning');
      data.forEach(commit => {
        const row = [
          commit.hash,
          commit.author,
          commit.commit_date,
          `"${commit.message.replace(/"/g, '""')}"`,
          commit.priority || '',
          commit.category || '',
          commit.status || 'pending',
          `"${(commit.decision_reasoning || '').replace(/"/g, '""')}"`
        ].join(',');
        console.log(row);
      });
    }
  }

  async cleanup() {
    console.log('🧹 Running database maintenance...');
    this.db.vacuum();
    console.log('✅ Database optimized');
  }

  async runAdvancedAnalysis(commitHash, analysisTypes) {
    const currentPath = process.cwd();
    const repo = this.db.getRepository(currentPath);
    
    if (!repo) {
      console.error('❌ Repository not initialized');
      process.exit(1);
    }

    const commit = this.db.getCommit(repo.id, commitHash);
    if (!commit) {
      console.error(`❌ Commit ${commitHash} not found`);
      process.exit(1);
    }

    console.log(`🔍 Running advanced analysis on ${commitHash.substring(0, 8)}...`);

    const commitData = {
      hash: commit.hash,
      message: commit.message,
      author: commit.author,
      filesChanged: JSON.parse(commit.files_changed || '[]'),
      insertions: commit.insertions,
      deletions: commit.deletions
    };

    const results = {};

    if (analysisTypes.includes('dependency')) {
      console.log('   📊 Analyzing dependency chains...');
      results.dependencyAnalysis = this.advancedAnalysis.analyzeDependencyChain(commitData, currentPath);
    }

    if (analysisTypes.includes('breaking-changes')) {
      console.log('   💥 Identifying breaking changes...');
      results.breakingChanges = this.advancedAnalysis.identifyBreakingChanges(commitData, currentPath);
    }

    if (analysisTypes.includes('security')) {
      console.log('   🛡️ Assessing security impact...');
      results.securityAnalysis = this.advancedAnalysis.assessSecurityImpact(commitData, currentPath);
    }

    if (analysisTypes.includes('performance')) {
      console.log('   ⚡ Predicting performance impact...');
      results.performanceAnalysis = this.advancedAnalysis.predictPerformanceImpact(commitData, currentPath);
    }

    console.log('\n📋 Analysis Results:');
    console.log('==================');

    if (results.dependencyAnalysis) {
      const dep = results.dependencyAnalysis;
      console.log('\n🔗 Dependency Analysis:');
      console.log(`   Affected files: ${dep.affectedFiles.length}`);
      console.log(`   Impact radius: ${dep.impactRadius}`);
      console.log(`   Complexity: ${dep.complexity}`);
      if (dep.criticalPaths.length > 0) {
        console.log(`   Critical paths: ${dep.criticalPaths.length}`);
      }
    }

    if (results.breakingChanges) {
      const breaking = results.breakingChanges;
      console.log('\n💥 Breaking Changes:');
      console.log(`   Has breaking changes: ${breaking.hasBreakingChanges ? '⚠️ YES' : '✅ NO'}`);
      if (breaking.hasBreakingChanges) {
        console.log(`   Severity: ${breaking.severity}`);
        console.log(`   Changes detected: ${breaking.changes.length}`);
        console.log(`   Recommendation: ${breaking.recommendation}`);
      }
    }

    if (results.securityAnalysis) {
      const security = results.securityAnalysis;
      console.log('\n🛡️ Security Analysis:');
      console.log(`   Has security impact: ${security.hasSecurityImpact ? '⚠️ YES' : '✅ NO'}`);
      if (security.hasSecurityImpact) {
        console.log(`   Overall risk: ${security.overallRisk}`);
        console.log(`   Issues found: ${security.issues.length}`);
      }
    }

    if (results.performanceAnalysis) {
      const perf = results.performanceAnalysis;
      console.log('\n⚡ Performance Analysis:');
      console.log(`   Has performance impact: ${perf.hasPerformanceImpact ? '⚠️ YES' : '✅ NO'}`);
      if (perf.hasPerformanceImpact) {
        console.log(`   Overall impact: ${perf.overallImpact}`);
        console.log(`   Issues found: ${perf.issues.length}`);
      }
    }
  }

  async analyzeConflicts(commitHash) {
    const currentPath = process.cwd();
    const repo = this.db.getRepository(currentPath);
    
    if (!repo) {
      console.error('❌ Repository not initialized');
      process.exit(1);
    }

    const commit = this.db.getCommit(repo.id, commitHash);
    if (!commit) {
      console.error(`❌ Commit ${commitHash} not found`);
      process.exit(1);
    }

    console.log(`🔍 Analyzing conflicts for ${commitHash.substring(0, 8)}...`);

    const commitData = {
      hash: commit.hash,
      message: commit.message,
      filesChanged: JSON.parse(commit.files_changed || '[]')
    };

    const conflictAnalysis = await this.integrationHelpers.analyzeConflicts(commitData, currentPath);
    const resolutionSuggestions = this.integrationHelpers.generateConflictResolutions(conflictAnalysis);

    console.log('\n⚔️ Conflict Analysis Results:');
    console.log('============================');
    
    console.log(`Has conflicts: ${conflictAnalysis.hasConflicts ? '⚠️ YES' : '✅ NO'}`);
    
    if (conflictAnalysis.hasConflicts) {
      console.log(`Conflicts found: ${conflictAnalysis.conflicts.length}`);
      console.log(`Estimated resolution time: ${conflictAnalysis.estimatedResolutionTime}`);
      
      console.log('\n🛠️ Resolution Suggestions:');
      for (const suggestion of conflictAnalysis.resolutionSuggestions) {
        console.log(`   • ${suggestion.file}: ${suggestion.suggestion}`);
        console.log(`     Priority: ${suggestion.priority}, Time: ${suggestion.estimatedTime}`);
      }

      if (resolutionSuggestions.resolutions.length > 0) {
        console.log('\n🎯 Detailed Resolutions:');
        for (const resolution of resolutionSuggestions.resolutions) {
          console.log(`   📁 ${resolution.file} (${resolution.type}):`);
          for (const suggestion of resolution.suggestions) {
            console.log(`      • ${suggestion.method}: ${suggestion.description}`);
            console.log(`        Confidence: ${Math.round(suggestion.confidence * 100)}%`);
          }
        }
      }
    }
  }

  async createMigrationPlan(commitHashes) {
    const currentPath = process.cwd();
    const repo = this.db.getRepository(currentPath);
    
    if (!repo) {
      console.error('❌ Repository not initialized');
      process.exit(1);
    }

    console.log(`📋 Creating migration plan for ${commitHashes.length} commits...`);

    for (const commitHash of commitHashes) {
      const commit = this.db.getCommit(repo.id, commitHash);
      if (!commit) {
        console.log(`⚠️ Skipping ${commitHash}: not found`);
        continue;
      }

      console.log(`\n🔍 Analyzing ${commitHash.substring(0, 8)}: ${commit.message.substring(0, 60)}...`);

      const commitData = {
        hash: commit.hash,
        message: commit.message,
        filesChanged: JSON.parse(commit.files_changed || '[]')
      };

      // Run comprehensive analysis
      const analysisResults = {
        dependencyAnalysis: this.advancedAnalysis.analyzeDependencyChain(commitData, currentPath),
        breakingChanges: this.advancedAnalysis.identifyBreakingChanges(commitData, currentPath),
        securityAnalysis: this.advancedAnalysis.assessSecurityImpact(commitData, currentPath),
        performanceAnalysis: this.advancedAnalysis.predictPerformanceImpact(commitData, currentPath),
        conflicts: await this.integrationHelpers.analyzeConflicts(commitData, currentPath)
      };

      const migrationPlan = this.integrationHelpers.createMigrationPlan(commitData, analysisResults, currentPath);

      console.log(`\n📊 Migration Plan for ${commitHash.substring(0, 8)}:`);
      console.log(`   Total estimated time: ${migrationPlan.totalEstimatedTime}`);
      console.log(`   Risk assessment: ${migrationPlan.riskAssessment}`);
      console.log(`   Phases: ${migrationPlan.phases.length}`);

      for (const phase of migrationPlan.phases) {
        console.log(`\n   📋 Phase: ${phase.name} (${phase.estimatedTime})`);
        for (const task of phase.tasks.slice(0, 3)) {
          console.log(`      • ${task}`);
        }
        if (phase.tasks.length > 3) {
          console.log(`      ... and ${phase.tasks.length - 3} more tasks`);
        }
      }

      if (migrationPlan.prerequisites.length > 0) {
        console.log('\n   ⚠️ Prerequisites:');
        for (const prereq of migrationPlan.prerequisites) {
          console.log(`      • ${prereq}`);
        }
      }
    }
  }

  async setupGitHubActions(options) {
    const currentPath = process.cwd();
    
    console.log('🚀 Setting up GitHub Actions workflows...');

    const workflows = {
      daily_sync: options.dailySync,
      pr_checks: options.prChecks,
      critical_alerts: options.criticalAlerts,
      auto_integration: options.autoIntegration,
      security_scans: options.securityScans
    };

    const notifications = {
      slack_webhook: options.slackWebhook,
      discord_webhook: options.discordWebhook,
      email_notifications: options.emailNotifications
    };

    const result = this.githubActions.setupGitHubActions(currentPath, {
      enableDailySync: workflows.daily_sync,
      enablePRChecks: workflows.pr_checks,
      enableCriticalAlerts: workflows.critical_alerts,
      enableAutoIntegration: workflows.auto_integration,
      enableSecurityScans: workflows.security_scans,
      slackWebhook: notifications.slack_webhook,
      discordWebhook: notifications.discord_webhook,
      emailNotifications: notifications.email_notifications
    });

    console.log('✅ GitHub Actions setup completed!');
    console.log('\n📋 Workflows created:');
    for (const workflow of result.workflowsCreated) {
      console.log(`   • ${workflow}`);
    }

    console.log('\n📝 Next steps:');
    for (const step of result.nextSteps) {
      console.log(`   • ${step}`);
    }
  }

  async setupNotifications(options) {
    console.log('🔔 Setting up notification channels...');

    if (options.createTemplate) {
      const templatePath = join(process.cwd(), 'fork-parity-notifications.json');
      this.notifications.createConfigTemplate(templatePath);
      console.log(`✅ Created notification config template: ${templatePath}`);
      console.log('📝 Edit the template and run with --config option');
      return;
    }

    if (options.config) {
      try {
        this.notifications.setupFromConfig(options.config);
        console.log(`✅ Loaded notification configuration from ${options.config}`);
      } catch (error) {
        console.error(`❌ Failed to load config: ${error.message}`);
        process.exit(1);
      }
    }

    console.log('🔔 Notification system ready');
  }

  async sendNotification(type, data) {
    console.log(`📤 Sending ${type} notification...`);

    try {
      const results = await this.notifications.sendNotifications(type, data);
      
      console.log('📊 Notification results:');
      for (const result of results) {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${status} ${result.channel}: ${result.success ? 'sent' : result.error}`);
      }
    } catch (error) {
      console.error(`❌ Notification failed: ${error.message}`);
      process.exit(1);
    }
  }

  async learnAdaptation(commitHash, options) {
    console.log(`🧠 Learning adaptation pattern for ${commitHash.substring(0, 8)}...`);

    const adaptationData = {
      type: options.type || 'manual',
      sourcePattern: options.source || '',
      targetPattern: options.target || '',
      context: {
        effort: options.effort,
        notes: options.notes
      },
      success: options.success,
      effort: options.effort,
      notes: options.notes
    };

    try {
      const pattern = this.integrationHelpers.learnAdaptationPattern(commitHash, adaptationData);
      
      if (pattern) {
        console.log(`✅ Learned adaptation pattern: ${pattern.id}`);
        console.log(`   Type: ${pattern.patternType}`);
        console.log(`   Success: ${pattern.success ? 'Yes' : 'No'}`);
        console.log(`   Effort: ${pattern.effort}`);
      } else {
        console.log('⚠️ Failed to store adaptation pattern');
      }
    } catch (error) {
      console.error(`❌ Learning failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI setup
program
  .name('fork-parity')
  .description('Enhanced fork parity tracking with smart triage')
  .version('1.0.0');

program
  .command('init <upstream-url>')
  .description('Initialize fork parity tracking')
  .option('-u, --upstream-branch <branch>', 'Upstream branch to track', 'main')
  .option('-f, --fork-branch <branch>', 'Fork branch to compare', 'main')
  .action(async (upstreamUrl, options) => {
    const manager = new ForkParityManager();
    await manager.initRepository(upstreamUrl, options.upstreamBranch, options.forkBranch);
  });

program
  .command('sync')
  .description('Sync with upstream and run auto-triage')
  .action(async () => {
    const manager = new ForkParityManager();
    await manager.syncUpstream();
  });

program
  .command('dashboard')
  .description('Show parity dashboard')
  .option('-s, --since <date>', 'Show commits since date')
  .option('-p, --priority <priority>', 'Filter by priority')
  .action(async (options) => {
    const manager = new ForkParityManager();
    await manager.showDashboard(options);
  });

program
  .command('status <commit-hash> <status>')
  .description('Update commit status')
  .option('-r, --reason <reason>', 'Reason for status change')
  .action(async (commitHash, status, options) => {
    const manager = new ForkParityManager();
    await manager.updateStatus(commitHash, status, options.reason);
  });

program
  .command('list')
  .description('List commits')
  .option('-s, --status <status>', 'Filter by status')
  .option('-l, --limit <number>', 'Limit number of results', '20')
  .action(async (options) => {
    const manager = new ForkParityManager();
    await manager.listCommits(options.status, parseInt(options.limit));
  });

program
  .command('export')
  .description('Export data')
  .option('-f, --format <format>', 'Export format (json|csv)', 'json')
  .action(async (options) => {
    const manager = new ForkParityManager();
    await manager.exportData(options.format);
  });

program
  .command('cleanup')
  .description('Run database maintenance')
  .action(async () => {
    const manager = new ForkParityManager();
    await manager.cleanup();
  });

program
  .command('analyze <commit-hash>')
  .description('Run advanced analysis on a commit')
  .option('-t, --types <types>', 'Analysis types (dependency,breaking-changes,security,performance)', 'dependency,breaking-changes,security,performance')
  .action(async (commitHash, options) => {
    const manager = new ForkParityManager();
    await manager.runAdvancedAnalysis(commitHash, options.types.split(','));
  });

program
  .command('conflicts <commit-hash>')
  .description('Analyze potential conflicts and get resolution suggestions')
  .action(async (commitHash) => {
    const manager = new ForkParityManager();
    await manager.analyzeConflicts(commitHash);
  });

program
  .command('migration-plan <commit-hashes...>')
  .description('Create detailed migration plan for commits')
  .action(async (commitHashes) => {
    const manager = new ForkParityManager();
    await manager.createMigrationPlan(commitHashes);
  });

program
  .command('setup-github-actions')
  .description('Set up GitHub Actions workflows')
  .option('--daily-sync', 'Enable daily sync workflow', true)
  .option('--pr-checks', 'Enable PR check workflow', true)
  .option('--critical-alerts', 'Enable critical alert workflow', true)
  .option('--auto-integration', 'Enable auto integration workflow', false)
  .option('--security-scans', 'Enable security scan workflow', true)
  .option('--slack-webhook <url>', 'Slack webhook URL')
  .option('--discord-webhook <url>', 'Discord webhook URL')
  .action(async (options) => {
    const manager = new ForkParityManager();
    await manager.setupGitHubActions(options);
  });

program
  .command('setup-notifications')
  .description('Set up notification channels')
  .option('-c, --config <path>', 'Path to notification config file')
  .option('--create-template', 'Create notification config template')
  .action(async (options) => {
    const manager = new ForkParityManager();
    await manager.setupNotifications(options);
  });

program
  .command('notify <type>')
  .description('Send test notification')
  .option('-d, --data <json>', 'Notification data as JSON')
  .action(async (type, options) => {
    const manager = new ForkParityManager();
    const data = options.data ? JSON.parse(options.data) : {};
    await manager.sendNotification(type, data);
  });

program
  .command('learn-adaptation <commit-hash>')
  .description('Learn adaptation pattern from successful integration')
  .option('-t, --type <type>', 'Adaptation type')
  .option('-s, --source <pattern>', 'Source pattern')
  .option('-T, --target <pattern>', 'Target pattern')
  .option('-n, --notes <notes>', 'Notes about the adaptation')
  .option('--success', 'Mark as successful adaptation', true)
  .option('--effort <effort>', 'Effort level (trivial,small,medium,large)', 'medium')
  .action(async (commitHash, options) => {
    const manager = new ForkParityManager();
    await manager.learnAdaptation(commitHash, options);
  });

// Handle the case where no command is provided
if (process.argv.length === 2) {
  program.help();
}

program.parse();