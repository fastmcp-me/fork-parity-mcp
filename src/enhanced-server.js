#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import ForkParityDatabase from './database.js';
import SmartTriageSystem from './triage.js';
import AdvancedAnalysisSystem from './advanced-analysis.js';
import IntegrationHelpersSystem from './integration-helpers.js';
import GitHubActionsIntegration from './github-actions.js';
import NotificationSystem from './notifications.js';
import { execSync } from 'child_process';

class EnhancedForkParityServer {
  constructor() {
    this.server = new Server(
      {
        name: 'enhanced-fork-parity',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.db = new ForkParityDatabase();
    this.triage = new SmartTriageSystem();
    this.advancedAnalysis = new AdvancedAnalysisSystem();
    this.integrationHelpers = new IntegrationHelpersSystem(this.db);
    this.githubActions = new GitHubActionsIntegration();
    this.notifications = new NotificationSystem(this.db);
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'fork_parity_auto_triage_commits',
            description: 'Automatically analyze and triage commits with smart categorization',
            inputSchema: {
              type: 'object',
              properties: {
                commit_hashes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of commit hashes to analyze'
                },
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                }
              }
            }
          },
          {
            name: 'fork_parity_get_detailed_status',
            description: 'Get comprehensive parity status with analytics',
            inputSchema: {
              type: 'object',
              properties: {
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                },
                since: {
                  type: 'string',
                  description: 'Show commits since date (ISO format)'
                },
                priority_filter: {
                  type: 'string',
                  enum: ['critical', 'high', 'medium', 'low'],
                  description: 'Filter by priority level'
                }
              }
            }
          },
          {
            name: 'fork_parity_generate_dashboard',
            description: 'Generate comprehensive parity dashboard with metrics',
            inputSchema: {
              type: 'object',
              properties: {
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                },
                format: {
                  type: 'string',
                  enum: ['text', 'json', 'markdown'],
                  description: 'Output format for dashboard'
                }
              }
            }
          },
          {
            name: 'fork_parity_get_actionable_items',
            description: 'Get prioritized list of commits requiring action',
            inputSchema: {
              type: 'object',
              properties: {
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                },
                priority_filter: {
                  type: 'string',
                  enum: ['critical', 'high', 'medium', 'low'],
                  description: 'Minimum priority level'
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of items to return',
                  default: 20
                }
              }
            }
          },
          {
            name: 'fork_parity_update_commit_status',
            description: 'Update commit status with rich metadata',
            inputSchema: {
              type: 'object',
              properties: {
                commit_hash: {
                  type: 'string',
                  description: 'Commit hash to update'
                },
                status: {
                  type: 'string',
                  enum: ['pending', 'reviewed', 'integrated', 'skipped', 'conflict', 'deferred'],
                  description: 'New status for the commit'
                },
                metadata: {
                  type: 'object',
                  properties: {
                    decision_reasoning: { type: 'string' },
                    reviewer: { type: 'string' },
                    adaptation_notes: { type: 'string' },
                    integration_effort_actual: { type: 'string' }
                  },
                  description: 'Additional metadata for the status update'
                },
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                }
              },
              required: ['commit_hash', 'status']
            }
          },
          {
            name: 'fork_parity_batch_analyze_commits',
            description: 'Analyze multiple commits in batch with smart triage',
            inputSchema: {
              type: 'object',
              properties: {
                commit_range: {
                  type: 'string',
                  description: 'Git commit range (e.g., "HEAD~10..HEAD")'
                },
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                },
                auto_update_db: {
                  type: 'boolean',
                  description: 'Automatically update database with results',
                  default: true
                }
              },
              required: ['commit_range']
            }
          },
          {
            name: 'fork_parity_create_review_template',
            description: 'Generate structured review template for a commit',
            inputSchema: {
              type: 'object',
              properties: {
                commit_hash: {
                  type: 'string',
                  description: 'Commit hash to create template for'
                },
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                }
              },
              required: ['commit_hash']
            }
          },
          {
            name: 'fork_parity_generate_integration_plan',
            description: 'Create integration plan with effort estimates',
            inputSchema: {
              type: 'object',
              properties: {
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                },
                time_horizon: {
                  type: 'string',
                  enum: ['sprint', 'month', 'quarter'],
                  description: 'Planning time horizon',
                  default: 'sprint'
                }
              }
            }
          },
          {
            name: 'fork_parity_sync_and_analyze',
            description: 'Sync with upstream and run comprehensive analysis',
            inputSchema: {
              type: 'object',
              properties: {
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                },
                upstream_branch: {
                  type: 'string',
                  description: 'Upstream branch to sync with',
                  default: 'main'
                }
              }
            }
          },
          {
            name: 'fork_parity_advanced_analysis',
            description: 'Run advanced analysis including dependency chains, breaking changes, and security assessment',
            inputSchema: {
              type: 'object',
              properties: {
                commit_hash: {
                  type: 'string',
                  description: 'Commit hash to analyze'
                },
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                },
                analysis_types: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['dependency', 'breaking-changes', 'security', 'performance']
                  },
                  description: 'Types of analysis to perform',
                  default: ['dependency', 'breaking-changes', 'security', 'performance']
                }
              },
              required: ['commit_hash']
            }
          },
          {
            name: 'fork_parity_conflict_analysis',
            description: 'Analyze potential conflicts and generate resolution suggestions',
            inputSchema: {
              type: 'object',
              properties: {
                commit_hash: {
                  type: 'string',
                  description: 'Commit hash to analyze for conflicts'
                },
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                }
              },
              required: ['commit_hash']
            }
          },
          {
            name: 'fork_parity_migration_plan',
            description: 'Create detailed migration plan for integrating changes',
            inputSchema: {
              type: 'object',
              properties: {
                commit_hashes: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Array of commit hashes to create migration plan for'
                },
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                }
              },
              required: ['commit_hashes']
            }
          },
          {
            name: 'fork_parity_setup_github_actions',
            description: 'Set up GitHub Actions workflows for automated fork parity management',
            inputSchema: {
              type: 'object',
              properties: {
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                },
                workflows: {
                  type: 'object',
                  properties: {
                    daily_sync: { type: 'boolean', default: true },
                    pr_checks: { type: 'boolean', default: true },
                    critical_alerts: { type: 'boolean', default: true },
                    auto_integration: { type: 'boolean', default: false },
                    security_scans: { type: 'boolean', default: true }
                  },
                  description: 'Workflows to enable'
                },
                notifications: {
                  type: 'object',
                  properties: {
                    slack_webhook: { type: 'string' },
                    discord_webhook: { type: 'string' },
                    email_notifications: { type: 'string' }
                  },
                  description: 'Notification configuration'
                }
              }
            }
          },
          {
            name: 'fork_parity_setup_notifications',
            description: 'Configure notification channels for fork parity alerts',
            inputSchema: {
              type: 'object',
              properties: {
                config_path: {
                  type: 'string',
                  description: 'Path to notification configuration file'
                },
                channels: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      type: { type: 'string', enum: ['slack', 'discord', 'email', 'teams', 'webhook'] },
                      config: { type: 'object' }
                    }
                  },
                  description: 'Notification channels to configure'
                }
              }
            }
          },
          {
            name: 'fork_parity_send_notification',
            description: 'Send a notification through configured channels',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['critical', 'daily', 'integration', 'security'],
                  description: 'Type of notification to send'
                },
                data: {
                  type: 'object',
                  description: 'Data for the notification'
                },
                repository_path: {
                  type: 'string',
                  description: 'Path to repository (defaults to current directory)'
                }
              },
              required: ['type', 'data']
            }
          },
          {
            name: 'fork_parity_learn_adaptation',
            description: 'Learn and store adaptation patterns from successful integrations',
            inputSchema: {
              type: 'object',
              properties: {
                commit_hash: {
                  type: 'string',
                  description: 'Commit hash that was adapted'
                },
                adaptation_data: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    source_pattern: { type: 'string' },
                    target_pattern: { type: 'string' },
                    context: { type: 'object' },
                    success: { type: 'boolean' },
                    effort: { type: 'string' },
                    notes: { type: 'string' }
                  },
                  description: 'Adaptation pattern data'
                }
              },
              required: ['commit_hash', 'adaptation_data']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'fork_parity_auto_triage_commits':
            return await this.autoTriageCommits(args);
          
          case 'fork_parity_get_detailed_status':
            return await this.getDetailedStatus(args);
          
          case 'fork_parity_generate_dashboard':
            return await this.generateDashboard(args);
          
          case 'fork_parity_get_actionable_items':
            return await this.getActionableItems(args);
          
          case 'fork_parity_update_commit_status':
            return await this.updateCommitStatus(args);
          
          case 'fork_parity_batch_analyze_commits':
            return await this.batchAnalyzeCommits(args);
          
          case 'fork_parity_create_review_template':
            return await this.createReviewTemplate(args);
          
          case 'fork_parity_generate_integration_plan':
            return await this.generateIntegrationPlan(args);
          
          case 'fork_parity_sync_and_analyze':
            return await this.syncAndAnalyze(args);
          
          case 'fork_parity_advanced_analysis':
            return await this.runAdvancedAnalysis(args);
          
          case 'fork_parity_conflict_analysis':
            return await this.analyzeConflicts(args);
          
          case 'fork_parity_migration_plan':
            return await this.createMigrationPlan(args);
          
          case 'fork_parity_setup_github_actions':
            return await this.setupGitHubActions(args);
          
          case 'fork_parity_setup_notifications':
            return await this.setupNotifications(args);
          
          case 'fork_parity_send_notification':
            return await this.sendNotification(args);
          
          case 'fork_parity_learn_adaptation':
            return await this.learnAdaptation(args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing ${name}: ${error.message}`
        );
      }
    });
  }

  async autoTriageCommits(args) {
    const { commit_hashes, repository_path = process.cwd() } = args;
    const repo = this.db.getRepository(repository_path);
    
    if (!repo) {
      throw new Error('Repository not initialized. Run fork_parity_sync_and_analyze first.');
    }

    const results = [];
    
    for (const hash of commit_hashes) {
      const commit = this.db.getCommit(repo.id, hash);
      if (!commit) {
        results.push({ hash, error: 'Commit not found in database' });
        continue;
      }

      const commitData = {
        hash: commit.hash,
        message: commit.message,
        author: commit.author,
        filesChanged: JSON.parse(commit.files_changed || '[]'),
        insertions: commit.insertions,
        deletions: commit.deletions
      };

      const triageResult = this.triage.analyzeCommit(commitData);
      
      // Update database
      const commitId = this.db.getCommitId(repo.id, hash);
      this.db.addTriageResult(commitId, triageResult);
      
      results.push({
        hash,
        triage: triageResult
      });
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          repository: repository_path,
          analyzed_commits: results.length,
          results
        }, null, 2)
      }]
    };
  }

  async getDetailedStatus(args) {
    const { repository_path = process.cwd(), since, priority_filter } = args;
    const repo = this.db.getRepository(repository_path);
    
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    const options = {};
    if (since) options.since = since;
    if (priority_filter) options.priority = priority_filter;

    const dashboard = this.db.getParityDashboard(repo.id, options);
    
    // Add trend analysis
    const trends = this.calculateTrends(repo.id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          repository: {
            path: repo.path,
            upstream_url: repo.upstream_url,
            upstream_branch: repo.upstream_branch
          },
          summary: dashboard.summary,
          actionable_items: dashboard.actionableItems,
          trends,
          generated_at: dashboard.generatedAt
        }, null, 2)
      }]
    };
  }

  async generateDashboard(args) {
    const { repository_path = process.cwd(), format = 'text' } = args;
    const repo = this.db.getRepository(repository_path);
    
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    const dashboard = this.db.getParityDashboard(repo.id);
    
    let output;
    if (format === 'json') {
      output = JSON.stringify(dashboard, null, 2);
    } else if (format === 'markdown') {
      output = this.formatDashboardMarkdown(dashboard, repo);
    } else {
      output = this.formatDashboardText(dashboard, repo);
    }

    return {
      content: [{
        type: 'text',
        text: output
      }]
    };
  }

  async getActionableItems(args) {
    const { repository_path = process.cwd(), priority_filter = 'medium', limit = 20 } = args;
    const repo = this.db.getRepository(repository_path);
    
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    const stmt = this.db.db.prepare(`
      SELECT c.hash, c.message, c.author, c.commit_date, 
             tr.priority, tr.category, tr.reasoning, tr.effort_estimate,
             cs.status
      FROM commits c
      JOIN triage_results tr ON c.id = tr.commit_id
      LEFT JOIN commit_status cs ON c.id = cs.commit_id
      WHERE c.repository_id = ? 
        AND tr.priority IN (${this.getPriorityFilter(priority_filter)})
        AND (cs.status IS NULL OR cs.status = 'pending')
      ORDER BY 
        CASE tr.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        c.commit_date DESC
      LIMIT ?
    `);

    const items = stmt.all(repo.id, limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          repository: repository_path,
          filter: { priority_filter, limit },
          actionable_items: items,
          count: items.length
        }, null, 2)
      }]
    };
  }

  async updateCommitStatus(args) {
    const { commit_hash, status, metadata = {}, repository_path = process.cwd() } = args;
    const repo = this.db.getRepository(repository_path);
    
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    const commitId = this.db.getCommitId(repo.id, commit_hash);
    if (!commitId) {
      throw new Error(`Commit ${commit_hash} not found`);
    }

    const enrichedMetadata = {
      ...metadata,
      reviewer: metadata.reviewer || process.env.USER || 'unknown',
      reviewDate: new Date().toISOString()
    };

    this.db.updateCommitStatus(commitId, status, enrichedMetadata);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          commit_hash,
          status,
          metadata: enrichedMetadata,
          updated_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  async batchAnalyzeCommits(args) {
    const { commit_range, repository_path = process.cwd(), auto_update_db = true } = args;
    
    try {
      // Get commits in range
      const logOutput = execSync(
        `git log ${commit_range} --pretty=format:"%H|%an|%ae|%ad|%s" --date=iso --name-only`,
        { encoding: 'utf8', cwd: repository_path }
      );

      const commits = this.parseGitLog(logOutput);
      const analyzed = this.triage.batchAnalyze(commits);

      if (auto_update_db) {
        const repo = this.db.getRepository(repository_path);
        if (repo) {
          for (const analysis of analyzed) {
            const commitData = commits.find(c => c.hash === analysis.hash);
            if (commitData) {
              try {
                const commitResult = this.db.addCommit(repo.id, commitData);
                const commitId = commitResult.lastInsertRowid;
                this.db.addTriageResult(commitId, analysis.triage);
              } catch {
                // Commit might already exist
              }
            }
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            commit_range,
            analyzed_count: analyzed.length,
            results: analyzed,
            database_updated: auto_update_db
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to analyze commits: ${error.message}`);
    }
  }

  async createReviewTemplate(args) {
    const { commit_hash, repository_path = process.cwd() } = args;
    const repo = this.db.getRepository(repository_path);
    
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    const commit = this.db.getCommit(repo.id, commit_hash);
    if (!commit) {
      throw new Error(`Commit ${commit_hash} not found`);
    }

    const template = this.generateReviewTemplate(commit);

    return {
      content: [{
        type: 'text',
        text: template
      }]
    };
  }

  async generateIntegrationPlan(args) {
    const { repository_path = process.cwd(), time_horizon = 'sprint' } = args;
    const repo = this.db.getRepository(repository_path);
    
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    // Get pending commits
    const stmt = this.db.db.prepare(`
      SELECT c.*, tr.priority, tr.category, tr.effort_estimate, tr.conflict_risk
      FROM commits c
      JOIN triage_results tr ON c.id = tr.commit_id
      LEFT JOIN commit_status cs ON c.id = cs.commit_id
      WHERE c.repository_id = ? 
        AND (cs.status IS NULL OR cs.status = 'pending')
      ORDER BY 
        CASE tr.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        tr.conflict_risk ASC
    `);

    const pendingCommits = stmt.all(repo.id);
    const plan = this.triage.generateIntegrationPlan(pendingCommits);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          time_horizon,
          integration_plan: plan,
          generated_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  async syncAndAnalyze(args) {
    const { repository_path = process.cwd(), upstream_branch = 'main' } = args;
    
    try {
      // Ensure repository is initialized
      let repo = this.db.getRepository(repository_path);
      if (!repo) {
        // Try to auto-initialize if upstream remote exists
        try {
          const upstreamUrl = execSync('git remote get-url upstream', { 
            encoding: 'utf8', 
            cwd: repository_path 
          }).trim();
          
          this.db.addRepository(repository_path, upstreamUrl, upstream_branch);
          repo = this.db.getRepository(repository_path);
        } catch {
          throw new Error('Repository not initialized and no upstream remote found');
        }
      }

      // Fetch upstream
      execSync('git fetch upstream', { cwd: repository_path });
      
      // Get new commits
      const logOutput = execSync(
        `git log ${repo.fork_branch}..upstream/${upstream_branch} --pretty=format:"%H|%an|%ae|%ad|%s" --date=iso --name-only`,
        { encoding: 'utf8', cwd: repository_path }
      );

      const commits = this.parseGitLog(logOutput);
      const analyzed = this.triage.batchAnalyze(commits);

      // Update database
      let addedCount = 0;
      for (const analysis of analyzed) {
        const commitData = commits.find(c => c.hash === analysis.hash);
        if (commitData) {
          try {
            const commitResult = this.db.addCommit(repo.id, commitData);
            const commitId = commitResult.lastInsertRowid;
            this.db.addTriageResult(commitId, analysis.triage);
            addedCount++;
          } catch {
            // Commit might already exist
          }
        }
      }

      // Generate summary
      const dashboard = this.db.getParityDashboard(repo.id);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            sync_result: {
              commits_found: commits.length,
              commits_added: addedCount,
              upstream_branch
            },
            dashboard_summary: dashboard.summary,
            actionable_items: dashboard.actionableItems.slice(0, 10),
            synced_at: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  async runAdvancedAnalysis(args) {
    const { commit_hash, repository_path = process.cwd(), analysis_types = ['dependency', 'breaking-changes', 'security', 'performance'] } = args;
    
    const repo = this.db.getRepository(repository_path);
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    const commit = this.db.getCommit(repo.id, commit_hash);
    if (!commit) {
      throw new Error(`Commit ${commit_hash} not found`);
    }

    const commitData = {
      hash: commit.hash,
      message: commit.message,
      author: commit.author,
      filesChanged: JSON.parse(commit.files_changed || '[]'),
      insertions: commit.insertions,
      deletions: commit.deletions
    };

    const results = {};

    if (analysis_types.includes('dependency')) {
      results.dependencyAnalysis = this.advancedAnalysis.analyzeDependencyChain(commitData, repository_path);
    }

    if (analysis_types.includes('breaking-changes')) {
      results.breakingChanges = this.advancedAnalysis.identifyBreakingChanges(commitData, repository_path);
    }

    if (analysis_types.includes('security')) {
      results.securityAnalysis = this.advancedAnalysis.assessSecurityImpact(commitData, repository_path);
    }

    if (analysis_types.includes('performance')) {
      results.performanceAnalysis = this.advancedAnalysis.predictPerformanceImpact(commitData, repository_path);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          commit_hash,
          analysis_types,
          results,
          analyzed_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  async analyzeConflicts(args) {
    const { commit_hash, repository_path = process.cwd() } = args;
    
    const repo = this.db.getRepository(repository_path);
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    const commit = this.db.getCommit(repo.id, commit_hash);
    if (!commit) {
      throw new Error(`Commit ${commit_hash} not found`);
    }

    const commitData = {
      hash: commit.hash,
      message: commit.message,
      filesChanged: JSON.parse(commit.files_changed || '[]')
    };

    const conflictAnalysis = await this.integrationHelpers.analyzeConflicts(commitData, repository_path);
    const resolutionSuggestions = this.integrationHelpers.generateConflictResolutions(conflictAnalysis);
    const similarityAnalysis = this.integrationHelpers.analyzeCodeSimilarity(commitData, repository_path);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          commit_hash,
          conflict_analysis: conflictAnalysis,
          resolution_suggestions: resolutionSuggestions,
          similarity_analysis: similarityAnalysis,
          analyzed_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  async createMigrationPlan(args) {
    const { commit_hashes, repository_path = process.cwd() } = args;
    
    const repo = this.db.getRepository(repository_path);
    if (!repo) {
      throw new Error('Repository not initialized');
    }

    const migrationPlans = [];

    for (const commit_hash of commit_hashes) {
      const commit = this.db.getCommit(repo.id, commit_hash);
      if (!commit) {
        migrationPlans.push({
          commit_hash,
          error: 'Commit not found'
        });
        continue;
      }

      const commitData = {
        hash: commit.hash,
        message: commit.message,
        filesChanged: JSON.parse(commit.files_changed || '[]')
      };

      // Run comprehensive analysis
      const analysisResults = {
        dependencyAnalysis: this.advancedAnalysis.analyzeDependencyChain(commitData, repository_path),
        breakingChanges: this.advancedAnalysis.identifyBreakingChanges(commitData, repository_path),
        securityAnalysis: this.advancedAnalysis.assessSecurityImpact(commitData, repository_path),
        performanceAnalysis: this.advancedAnalysis.predictPerformanceImpact(commitData, repository_path),
        conflicts: await this.integrationHelpers.analyzeConflicts(commitData, repository_path)
      };

      const migrationPlan = this.integrationHelpers.createMigrationPlan(commitData, analysisResults, repository_path);
      
      migrationPlans.push({
        commit_hash,
        migration_plan: migrationPlan
      });
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          repository_path,
          migration_plans: migrationPlans,
          created_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  async setupGitHubActions(args) {
    const { repository_path = process.cwd(), workflows = {}, notifications = {} } = args;
    
    const options = {
      enableDailySync: workflows.daily_sync !== false,
      enablePRChecks: workflows.pr_checks !== false,
      enableCriticalAlerts: workflows.critical_alerts !== false,
      enableAutoIntegration: workflows.auto_integration === true,
      enableSecurityScans: workflows.security_scans !== false,
      slackWebhook: notifications.slack_webhook,
      discordWebhook: notifications.discord_webhook,
      emailNotifications: notifications.email_notifications
    };

    const result = this.githubActions.setupGitHubActions(repository_path, options);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          repository_path,
          setup_result: result,
          setup_at: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  async setupNotifications(args) {
    const { config_path, channels = [] } = args;
    
    try {
      if (config_path) {
        this.notifications.setupFromConfig(config_path);
      }

      for (const channel of channels) {
        this.notifications.registerChannel(channel.name, channel.config);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            channels_configured: channels.length,
            config_path: config_path || null,
            configured_at: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Notification setup failed: ${error.message}`);
    }
  }

  async sendNotification(args) {
    const { type, data, repository_path = process.cwd() } = args;
    
    try {
      const results = await this.notifications.sendNotifications(type, data, { repository_path });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            notification_type: type,
            results,
            sent_at: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Notification failed: ${error.message}`);
    }
  }

  async learnAdaptation(args) {
    const { commit_hash, adaptation_data } = args;
    
    try {
      const pattern = this.integrationHelpers.learnAdaptationPattern(commit_hash, adaptation_data);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            pattern_id: pattern?.id,
            commit_hash,
            learned_at: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Learning adaptation failed: ${error.message}`);
    }
  }

  // Helper methods
  parseGitLog(logOutput) {
    const commits = [];
    const lines = logOutput.split('\n').filter(line => line.trim());
    
    let currentCommit = null;
    let filesChanged = [];
    
    for (const line of lines) {
      if (line.includes('|')) {
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
          insertions: 0,
          deletions: 0
        };
      } else if (line.trim() && currentCommit) {
        filesChanged.push(line.trim());
      }
    }
    
    if (currentCommit) {
      currentCommit.filesChanged = [...filesChanged];
      commits.push(currentCommit);
    }
    
    return commits;
  }

  getPriorityFilter(priority) {
    const priorities = {
      'critical': '\'critical\'',
      'high': '\'critical\', \'high\'',
      'medium': '\'critical\', \'high\', \'medium\'',
      'low': '\'critical\', \'high\', \'medium\', \'low\''
    };
    return priorities[priority] || priorities['medium'];
  }

  calculateTrends(repositoryId) {
    // Simple trend calculation - could be enhanced
    const stmt = this.db.db.prepare(`
      SELECT 
        DATE(c.commit_date) as date,
        COUNT(*) as commits,
        COUNT(CASE WHEN cs.status = 'integrated' THEN 1 END) as integrated
      FROM commits c
      LEFT JOIN commit_status cs ON c.id = cs.commit_id
      WHERE c.repository_id = ? AND c.commit_date >= date('now', '-30 days')
      GROUP BY DATE(c.commit_date)
      ORDER BY date DESC
    `);
    
    return stmt.all(repositoryId);
  }

  formatDashboardText(dashboard, repo) {
    const lines = [];
    lines.push('📊 Fork Parity Dashboard');
    lines.push('========================\n');
    lines.push(`Repository: ${repo.path}`);
    lines.push(`Upstream: ${repo.upstream_url}\n`);
    lines.push('📈 Summary:');
    lines.push(`   Total commits: ${dashboard.summary.total_commits}`);
    lines.push(`   ✅ Integrated: ${dashboard.summary.integrated_count}`);
    lines.push(`   ⏳ Pending: ${dashboard.summary.pending_count}`);
    lines.push(`   🚨 Critical: ${dashboard.summary.critical_count}`);
    lines.push(`   ⚠️  High: ${dashboard.summary.high_count}\n`);
    
    if (dashboard.actionableItems.length > 0) {
      lines.push('🎯 Actionable Items:');
      dashboard.actionableItems.slice(0, 10).forEach(item => {
        const priority = item.priority === 'critical' ? '🚨' : '⚠️';
        lines.push(`   ${priority} ${item.hash.substring(0, 8)} - ${item.message.substring(0, 60)}...`);
      });
    }
    
    return lines.join('\n');
  }

  formatDashboardMarkdown(dashboard, repo) {
    const lines = [];
    lines.push('# 📊 Fork Parity Dashboard\n');
    lines.push(`**Repository:** ${repo.path}`);
    lines.push(`**Upstream:** ${repo.upstream_url}\n`);
    lines.push('## 📈 Summary\n');
    lines.push(`- **Total commits:** ${dashboard.summary.total_commits}`);
    lines.push(`- **✅ Integrated:** ${dashboard.summary.integrated_count}`);
    lines.push(`- **⏳ Pending:** ${dashboard.summary.pending_count}`);
    lines.push(`- **🚨 Critical:** ${dashboard.summary.critical_count}`);
    lines.push(`- **⚠️ High:** ${dashboard.summary.high_count}\n`);
    
    if (dashboard.actionableItems.length > 0) {
      lines.push('## 🎯 Actionable Items\n');
      lines.push('| Priority | Hash | Message |');
      lines.push('|----------|------|---------|');
      dashboard.actionableItems.slice(0, 10).forEach(item => {
        const priority = item.priority === 'critical' ? '🚨 Critical' : '⚠️ High';
        lines.push(`| ${priority} | \`${item.hash.substring(0, 8)}\` | ${item.message.substring(0, 50)}... |`);
      });
    }
    
    return lines.join('\n');
  }

  generateReviewTemplate(commit) {
    const template = `# Commit Review Template

## Commit Information
- **Hash:** ${commit.hash}
- **Author:** ${commit.author}
- **Date:** ${commit.commit_date}
- **Message:** ${commit.message}

## Triage Analysis
- **Priority:** ${commit.priority || 'Not analyzed'}
- **Category:** ${commit.category || 'Not analyzed'}
- **Reasoning:** ${commit.reasoning || 'Not available'}

## Review Checklist
- [ ] Code changes reviewed and understood
- [ ] Potential conflicts identified
- [ ] Integration approach determined
- [ ] Testing requirements assessed
- [ ] Documentation needs evaluated

## Integration Decision
- [ ] **Integrate directly** - No changes needed
- [ ] **Adapt and integrate** - Requires modifications
- [ ] **Skip** - Not applicable to our fork
- [ ] **Defer** - Integrate in future release

## Notes
<!-- Add your review notes here -->

## Adaptation Plan
<!-- If adapting, describe the changes needed -->

---
*Generated by Enhanced Fork Parity MCP*`;

    return template;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Enhanced Fork Parity MCP server running on stdio');
  }
}

const server = new EnhancedForkParityServer();
server.run().catch(console.error);