#!/usr/bin/env node

import ForkParityDatabase from '../src/fork-parity/database.js';
import SmartTriageSystem from '../src/fork-parity/triage.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Enhanced Fork Parity MCP Demo');
console.log('================================\n');

// Create demo database in memory
const db = new ForkParityDatabase(':memory:');
const triage = new SmartTriageSystem();

// Demo data
const demoRepo = {
  path: '/demo/project',
  upstreamUrl: 'https://github.com/upstream/project.git',
  upstreamBranch: 'main',
  forkBranch: 'main'
};

const demoCommits = [
  {
    hash: 'abc123def456',
    author: 'Security Team',
    authorEmail: 'security@example.com',
    commitDate: new Date('2024-01-15').toISOString(),
    message: 'fix: security vulnerability in auth middleware',
    filesChanged: ['src/auth/middleware.js', 'tests/auth.test.js'],
    insertions: 15,
    deletions: 8
  },
  {
    hash: 'def456ghi789',
    author: 'Feature Team',
    authorEmail: 'features@example.com',
    commitDate: new Date('2024-01-14').toISOString(),
    message: 'feat: add new user dashboard with analytics',
    filesChanged: ['src/components/Dashboard.jsx', 'src/api/analytics.js', 'src/styles/dashboard.css'],
    insertions: 245,
    deletions: 12
  },
  {
    hash: 'ghi789jkl012',
    author: 'DevOps Team',
    authorEmail: 'devops@example.com',
    commitDate: new Date('2024-01-13').toISOString(),
    message: 'chore: update dependencies and fix build warnings',
    filesChanged: ['package.json', 'package-lock.json', 'webpack.config.js'],
    insertions: 23,
    deletions: 18
  },
  {
    hash: 'jkl012mno345',
    author: 'Bug Squad',
    authorEmail: 'bugs@example.com',
    commitDate: new Date('2024-01-12').toISOString(),
    message: 'fix: resolve memory leak in image processing',
    filesChanged: ['src/core/image-processor.js', 'src/utils/memory.js'],
    insertions: 34,
    deletions: 67
  },
  {
    hash: 'mno345pqr678',
    author: 'Documentation Team',
    authorEmail: 'docs@example.com',
    commitDate: new Date('2024-01-11').toISOString(),
    message: 'docs: update API documentation and add examples',
    filesChanged: ['README.md', 'docs/api.md', 'examples/basic-usage.js'],
    insertions: 156,
    deletions: 23
  }
];

async function runDemo() {
  console.log('1️⃣  Setting up demo repository...');
  const repoResult = db.addRepository(
    demoRepo.path,
    demoRepo.upstreamUrl,
    demoRepo.upstreamBranch,
    demoRepo.forkBranch
  );
  const repositoryId = repoResult.lastInsertRowid;
  console.log(`   ✅ Repository added with ID: ${repositoryId}\n`);

  console.log('2️⃣  Adding commits and running smart triage...');
  for (const commit of demoCommits) {
    // Add commit to database
    const commitResult = db.addCommit(repositoryId, commit);
    const commitId = commitResult.lastInsertRowid;
    
    // Run smart triage
    const triageResult = triage.analyzeCommit(commit);
    db.addTriageResult(commitId, triageResult);
    
    console.log(`   📝 ${commit.hash.substring(0, 8)} - ${triageResult.priority} priority (${triageResult.category})`);
    console.log(`      Reason: ${triageResult.reasoning}`);
  }
  console.log();

  console.log('3️⃣  Generating dashboard...');
  const dashboard = db.getParityDashboard(repositoryId);
  
  console.log('   📊 Summary Statistics:');
  console.log(`      Total commits: ${dashboard.summary.total_commits}`);
  console.log(`      Integrated: ${dashboard.summary.integrated_count}`);
  console.log(`      Pending: ${dashboard.summary.pending_count}`);
  console.log(`      Critical: ${dashboard.summary.critical_count}`);
  console.log(`      High priority: ${dashboard.summary.high_count}`);
  console.log(`      Avg conflict risk: ${Math.round((dashboard.summary.avg_conflict_risk || 0) * 100)}%\n`);

  console.log('4️⃣  Actionable items (high priority, pending):');
  if (dashboard.actionableItems.length > 0) {
    dashboard.actionableItems.forEach(item => {
      const priority = item.priority === 'critical' ? '🚨' : '⚠️';
      console.log(`   ${priority} ${item.hash.substring(0, 8)} - ${item.category}`);
      console.log(`      ${item.message}`);
      console.log(`      Author: ${item.author} | Date: ${new Date(item.commit_date).toLocaleDateString()}`);
    });
  } else {
    console.log('   ✅ No high-priority pending items!');
  }
  console.log();

  console.log('5️⃣  Updating commit statuses...');
  // Mark security fix as integrated
  const securityCommitId = db.getCommitId(repositoryId, 'abc123def456');
  db.updateCommitStatus(securityCommitId, 'integrated', {
    decisionReasoning: 'Critical security fix, integrated immediately',
    reviewer: 'demo-user',
    adaptationNotes: 'No conflicts, direct integration'
  });
  console.log('   ✅ Security fix marked as integrated');

  // Mark feature as reviewed but deferred
  const featureCommitId = db.getCommitId(repositoryId, 'def456ghi789');
  db.updateCommitStatus(featureCommitId, 'deferred', {
    decisionReasoning: 'Feature conflicts with our custom dashboard, defer to next release',
    reviewer: 'demo-user',
    adaptationNotes: 'Will need significant adaptation'
  });
  console.log('   ⏸️  Feature marked as deferred');

  // Skip documentation update
  const docsCommitId = db.getCommitId(repositoryId, 'mno345pqr678');
  db.updateCommitStatus(docsCommitId, 'skipped', {
    decisionReasoning: 'Documentation changes not relevant to our fork',
    reviewer: 'demo-user'
  });
  console.log('   ⏭️  Documentation update skipped\n');

  console.log('6️⃣  Updated dashboard after status changes:');
  const updatedDashboard = db.getParityDashboard(repositoryId);
  console.log(`   Integrated: ${updatedDashboard.summary.integrated_count}`);
  console.log(`   Pending: ${updatedDashboard.summary.pending_count}`);
  console.log(`   Actionable items: ${updatedDashboard.actionableItems.length}\n`);

  console.log('7️⃣  Integration plan generation...');
  const pendingCommits = db.getCommitsByStatus(repositoryId, 'pending');
  if (pendingCommits.length > 0) {
    const integrationPlan = triage.generateIntegrationPlan(pendingCommits);
    
    console.log('   📋 Integration Plan:');
    console.log(`      Immediate (${integrationPlan.immediate.length} items):`);
    integrationPlan.immediate.forEach(item => {
      console.log(`         🚨 ${item.hash.substring(0, 8)} - ${item.triage.category}`);
    });
    
    console.log(`      Next Sprint (${integrationPlan.nextSprint.length} items):`);
    integrationPlan.nextSprint.forEach(item => {
      console.log(`         📋 ${item.hash.substring(0, 8)} - ${item.triage.category}`);
    });
    
    console.log(`      Total estimated effort: ${integrationPlan.summary.estimatedEffort} points`);
  } else {
    console.log('   ✅ No pending commits to plan!');
  }
  console.log();

  console.log('8️⃣  Batch operations demo...');
  const allCommitIds = demoCommits.map(commit => db.getCommitId(repositoryId, commit.hash)).filter(Boolean);
  
  // Demonstrate batch status update (mark remaining as reviewed)
  const pendingIds = allCommitIds.filter(id => {
    const stmt = db.db.prepare('SELECT status FROM commit_status WHERE commit_id = ?');
    const result = stmt.get(id);
    return !result || result.status === 'pending';
  });
  
  if (pendingIds.length > 0) {
    db.batchUpdateStatus(pendingIds, 'reviewed', {
      decisionReasoning: 'Batch review completed',
      reviewer: 'demo-user'
    });
    console.log(`   ✅ Batch updated ${pendingIds.length} commits to reviewed status`);
  }
  console.log();

  console.log('9️⃣  Export capabilities demo...');
  const exportData = {
    repository: demoRepo,
    commits: demoCommits.map(commit => {
      const dbCommit = db.getCommit(repositoryId, commit.hash);
      return {
        ...commit,
        triage: {
          priority: dbCommit.priority,
          category: dbCommit.category,
          reasoning: dbCommit.reasoning
        },
        status: dbCommit.status || 'pending'
      };
    }),
    dashboard: updatedDashboard,
    exportedAt: new Date().toISOString()
  };
  
  console.log('   📤 Sample export data (JSON):');
  console.log(JSON.stringify(exportData, null, 2).substring(0, 500) + '...\n');

  console.log('🔟 Database maintenance...');
  db.vacuum();
  console.log('   ✅ Database optimized\n');

  console.log('✨ Demo completed successfully!');
  console.log('\n📚 Next steps:');
  console.log('   • Run `fork-parity init <upstream-url>` to set up your repository');
  console.log('   • Use `fork-parity sync` to fetch and analyze upstream changes');
  console.log('   • View `fork-parity dashboard` for comprehensive status overview');
  console.log('   • Update statuses with `fork-parity status <hash> <status>`');
  console.log('   • Export data with `fork-parity export --format json`');
  
  console.log('\n🔧 MCP Integration:');
  console.log('   • Start MCP server: `enhanced-fork-parity-server`');
  console.log('   • Use tools like `fork_parity_sync_and_analyze` in Claude');
  console.log('   • Generate dashboards with `fork_parity_generate_dashboard`');
  console.log('   • Get actionable items with `fork_parity_get_actionable_items`');

  // Close database
  db.close();
}

runDemo().catch(console.error);