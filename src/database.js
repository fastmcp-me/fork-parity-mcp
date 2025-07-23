import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

class ForkParityDatabase {
  constructor(dbPath = null) {
    // Default to .fork-parity directory in project root
    if (!dbPath) {
      const projectRoot = process.cwd();
      const parityDir = join(projectRoot, '.fork-parity');
      if (!existsSync(parityDir)) {
        mkdirSync(parityDir, { recursive: true });
      }
      dbPath = join(parityDir, 'parity.db');
    }
    
    this.db = new Database(dbPath);
    this.initializeSchema();
  }

  initializeSchema() {
    // Repository configuration
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS repositories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        upstream_url TEXT,
        upstream_branch TEXT DEFAULT 'main',
        fork_branch TEXT DEFAULT 'main',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Commit tracking with rich metadata
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS commits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repository_id INTEGER NOT NULL,
        hash TEXT NOT NULL,
        author TEXT,
        author_email TEXT,
        commit_date DATETIME,
        message TEXT,
        files_changed TEXT, -- JSON array of changed files
        insertions INTEGER DEFAULT 0,
        deletions INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repository_id) REFERENCES repositories (id),
        UNIQUE(repository_id, hash)
      )
    `);

    // Triage results from auto-analysis
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS triage_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commit_id INTEGER NOT NULL,
        priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')) NOT NULL,
        category TEXT CHECK(category IN ('security', 'bugfix', 'feature', 'refactor', 'docs', 'test', 'chore')) NOT NULL,
        impact_areas TEXT, -- JSON array of impact areas
        conflict_risk REAL CHECK(conflict_risk >= 0 AND conflict_risk <= 1),
        effort_estimate TEXT CHECK(effort_estimate IN ('trivial', 'small', 'medium', 'large', 'xl')),
        reasoning TEXT,
        confidence REAL CHECK(confidence >= 0 AND confidence <= 1),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (commit_id) REFERENCES commits (id),
        UNIQUE(commit_id)
      )
    `);

    // Status tracking with decision history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS commit_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commit_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending', 'reviewed', 'integrated', 'skipped', 'conflict', 'deferred')) NOT NULL,
        decision_reasoning TEXT,
        reviewer TEXT,
        review_date DATETIME,
        adaptation_notes TEXT,
        integration_effort_actual TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (commit_id) REFERENCES commits (id)
      )
    `);

    // Integration history for tracking what was actually done
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commit_id INTEGER NOT NULL,
        integration_type TEXT CHECK(integration_type IN ('direct', 'adapted', 'cherry-pick', 'manual')) NOT NULL,
        target_branch TEXT,
        integration_commit_hash TEXT,
        conflicts_resolved TEXT, -- JSON array of conflict details
        adaptation_changes TEXT, -- Description of changes made
        integration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (commit_id) REFERENCES commits (id)
      )
    `);

    // Metrics and analytics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repository_id INTEGER NOT NULL,
        metric_type TEXT NOT NULL,
        metric_value REAL,
        metric_data TEXT, -- JSON for complex metrics
        period_start DATETIME,
        period_end DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (repository_id) REFERENCES repositories (id)
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_commits_repo_hash ON commits(repository_id, hash);
      CREATE INDEX IF NOT EXISTS idx_commits_date ON commits(commit_date);
      CREATE INDEX IF NOT EXISTS idx_triage_priority ON triage_results(priority);
      CREATE INDEX IF NOT EXISTS idx_status_status ON commit_status(status);
      CREATE INDEX IF NOT EXISTS idx_metrics_type_date ON metrics(metric_type, created_at);
    `);

    // Create triggers for updated_at timestamps
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_repositories_timestamp 
      AFTER UPDATE ON repositories
      BEGIN
        UPDATE repositories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_commit_status_timestamp 
      AFTER UPDATE ON commit_status
      BEGIN
        UPDATE commit_status SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);
  }

  // Repository management
  addRepository(path, upstreamUrl, upstreamBranch = 'main', forkBranch = 'main') {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO repositories (path, upstream_url, upstream_branch, fork_branch)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(path, upstreamUrl, upstreamBranch, forkBranch);
  }

  getRepository(path) {
    const stmt = this.db.prepare('SELECT * FROM repositories WHERE path = ?');
    return stmt.get(path);
  }

  // Commit management
  addCommit(repositoryId, commitData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO commits 
      (repository_id, hash, author, author_email, commit_date, message, files_changed, insertions, deletions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      repositoryId,
      commitData.hash,
      commitData.author,
      commitData.authorEmail,
      commitData.commitDate,
      commitData.message,
      JSON.stringify(commitData.filesChanged || []),
      commitData.insertions || 0,
      commitData.deletions || 0
    );
  }

  getCommit(repositoryId, hash) {
    const stmt = this.db.prepare(`
      SELECT c.*, tr.*, cs.status, cs.decision_reasoning, cs.reviewer, cs.review_date
      FROM commits c
      LEFT JOIN triage_results tr ON c.id = tr.commit_id
      LEFT JOIN commit_status cs ON c.id = cs.commit_id
      WHERE c.repository_id = ? AND c.hash = ?
    `);
    return stmt.get(repositoryId, hash);
  }

  // Triage management
  addTriageResult(commitId, triageData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO triage_results
      (commit_id, priority, category, impact_areas, conflict_risk, effort_estimate, reasoning, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      commitId,
      triageData.priority,
      triageData.category,
      JSON.stringify(triageData.impactAreas || []),
      triageData.conflictRisk,
      triageData.effortEstimate,
      triageData.reasoning,
      triageData.confidence
    );
  }

  // Status management
  updateCommitStatus(commitId, status, metadata = {}) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO commit_status
      (commit_id, status, decision_reasoning, reviewer, review_date, adaptation_notes, integration_effort_actual)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      commitId,
      status,
      metadata.decisionReasoning,
      metadata.reviewer,
      metadata.reviewDate || new Date().toISOString(),
      metadata.adaptationNotes,
      metadata.integrationEffortActual
    );
  }

  // Analytics and reporting
  getParityDashboard(repositoryId, options = {}) {
    const { since, priority, status } = options;
    
    let whereClause = 'WHERE c.repository_id = ?';
    let params = [repositoryId];
    
    if (since) {
      whereClause += ' AND c.commit_date >= ?';
      params.push(since);
    }
    
    if (priority) {
      whereClause += ' AND tr.priority = ?';
      params.push(priority);
    }
    
    if (status) {
      whereClause += ' AND cs.status = ?';
      params.push(status);
    }

    // Get summary statistics
    const summaryStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_commits,
        COUNT(CASE WHEN cs.status = 'integrated' THEN 1 END) as integrated_count,
        COUNT(CASE WHEN cs.status = 'skipped' THEN 1 END) as skipped_count,
        COUNT(CASE WHEN cs.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN tr.priority = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN tr.priority = 'high' THEN 1 END) as high_count,
        AVG(tr.conflict_risk) as avg_conflict_risk
      FROM commits c
      LEFT JOIN triage_results tr ON c.id = tr.commit_id
      LEFT JOIN commit_status cs ON c.id = cs.commit_id
      ${whereClause}
    `);

    const summary = summaryStmt.get(...params);

    // Get actionable items (high priority, pending status)
    const actionableStmt = this.db.prepare(`
      SELECT c.hash, c.message, c.author, c.commit_date, tr.priority, tr.category, tr.reasoning
      FROM commits c
      JOIN triage_results tr ON c.id = tr.commit_id
      LEFT JOIN commit_status cs ON c.id = cs.commit_id
      WHERE c.repository_id = ? 
        AND tr.priority IN ('critical', 'high')
        AND (cs.status IS NULL OR cs.status = 'pending')
      ORDER BY 
        CASE tr.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          ELSE 3 
        END,
        c.commit_date DESC
      LIMIT 20
    `);

    const actionableItems = actionableStmt.all(repositoryId);

    return {
      summary,
      actionableItems,
      generatedAt: new Date().toISOString()
    };
  }

  getCommitsByStatus(repositoryId, status, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT c.*, tr.priority, tr.category, cs.status, cs.decision_reasoning
      FROM commits c
      LEFT JOIN triage_results tr ON c.id = tr.commit_id
      LEFT JOIN commit_status cs ON c.id = cs.commit_id
      WHERE c.repository_id = ? AND cs.status = ?
      ORDER BY c.commit_date DESC
      LIMIT ?
    `);
    
    return stmt.all(repositoryId, status, limit);
  }

  // Batch operations
  batchUpdateStatus(commitIds, status, metadata = {}) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO commit_status
      (commit_id, status, decision_reasoning, reviewer, review_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const transaction = this.db.transaction((ids) => {
      for (const commitId of ids) {
        stmt.run(
          commitId,
          status,
          metadata.decisionReasoning,
          metadata.reviewer,
          metadata.reviewDate || new Date().toISOString()
        );
      }
    });
    
    return transaction(commitIds);
  }

  // Database maintenance
  vacuum() {
    this.db.exec('VACUUM');
  }

  backup(backupPath) {
    return this.db.backup(backupPath);
  }

  close() {
    this.db.close();
  }

  // Helper method to get commit ID
  getCommitId(repositoryId, hash) {
    const stmt = this.db.prepare('SELECT id FROM commits WHERE repository_id = ? AND hash = ?');
    const result = stmt.get(repositoryId, hash);
    return result?.id;
  }
}

export default ForkParityDatabase;