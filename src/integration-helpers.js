// Integration helpers for conflict resolution, adaptation patterns, and migration planning

import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname, basename, extname } from 'path';

class IntegrationHelpersSystem {
  constructor(database) {
    this.db = database;
    
    // Common conflict patterns and their resolutions
    this.conflictPatterns = {
      imports: {
        pattern: /^<<<<<<< HEAD\n(import.*\n)*=======\n(import.*\n)*>>>>>>> /gm,
        resolver: 'mergeImports',
        description: 'Import statement conflicts'
      },
      dependencies: {
        pattern: /^<<<<<<< HEAD\n.*"dependencies".*\n.*=======\n.*"dependencies".*\n.*>>>>>>> /gm,
        resolver: 'mergeDependencies',
        description: 'Package dependency conflicts'
      },
      config: {
        pattern: /^<<<<<<< HEAD\n.*config.*\n.*=======\n.*config.*\n.*>>>>>>> /gm,
        resolver: 'mergeConfig',
        description: 'Configuration conflicts'
      },
      functions: {
        pattern: /^<<<<<<< HEAD\n(.*function.*\{[\s\S]*?\})\n=======\n(.*function.*\{[\s\S]*?\})\n>>>>>>> /gm,
        resolver: 'analyzeFunctionConflict',
        description: 'Function implementation conflicts'
      }
    };

    // Adaptation patterns learned from previous integrations
    this.adaptationPatterns = new Map();
    this.loadAdaptationPatterns();
  }

  /**
   * Create detailed migration plan
   */
  createMigrationPlan(commitData, analysisResults, repositoryPath) {
    const plan = {
      phases: [],
      estimatedEffort: 'medium',
      risks: [],
      prerequisites: [],
      timeline: {},
      rollbackPlan: {},
      testingStrategy: {}
    };

    try {
      // Phase 1: Preparation
      const preparationPhase = {
        name: 'Preparation',
        order: 1,
        tasks: [
          'Create feature branch for integration',
          'Backup current state',
          'Review commit changes thoroughly'
        ],
        estimatedTime: '1-2 hours',
        dependencies: []
      };

      // Add specific preparation tasks based on analysis
      if (analysisResults.dependencyAnalysis?.packageChanges?.length > 0) {
        preparationPhase.tasks.push('Review dependency changes and compatibility');
        preparationPhase.tasks.push('Update local development environment');
      }

      if (analysisResults.securityAnalysis?.requiresSecurityReview) {
        preparationPhase.tasks.push('Schedule security review');
        preparationPhase.prerequisites = ['Security team approval'];
      }

      plan.phases.push(preparationPhase);

      // Phase 2: Integration
      const integrationPhase = {
        name: 'Integration',
        order: 2,
        tasks: [],
        estimatedTime: '2-4 hours',
        dependencies: ['Preparation']
      };

      // Determine integration approach
      if (analysisResults.conflicts?.hasConflicts) {
        integrationPhase.tasks.push('Resolve merge conflicts manually');
        integrationPhase.tasks.push('Apply adaptation patterns');
        integrationPhase.estimatedTime = '4-8 hours';
        
        plan.risks.push({
          type: 'conflict_resolution',
          description: 'Manual conflict resolution required',
          severity: 'medium',
          mitigation: 'Use automated resolution suggestions where possible'
        });
      } else {
        integrationPhase.tasks.push('Apply commit via cherry-pick or merge');
        integrationPhase.tasks.push('Verify no unintended changes');
      }

      // Add breaking change handling
      if (analysisResults.breakingChanges?.hasBreakingChanges) {
        integrationPhase.tasks.push('Implement breaking change adaptations');
        integrationPhase.tasks.push('Update dependent code');
        integrationPhase.estimatedTime = '6-12 hours';
        
        plan.risks.push({
          type: 'breaking_changes',
          description: 'Breaking changes require code adaptations',
          severity: 'high',
          mitigation: 'Follow established adaptation patterns'
        });
      }

      plan.phases.push(integrationPhase);

      // Phase 3: Testing
      const testingPhase = {
        name: 'Testing',
        order: 3,
        tasks: [
          'Run existing test suite',
          'Perform manual testing of affected areas',
          'Verify no regressions introduced'
        ],
        estimatedTime: '2-4 hours',
        dependencies: ['Integration']
      };

      // Add specific testing based on analysis
      if (analysisResults.performanceAnalysis?.requiresPerformanceTest) {
        testingPhase.tasks.push('Run performance benchmarks');
        testingPhase.tasks.push('Compare performance metrics');
        testingPhase.estimatedTime = '4-6 hours';
      }

      if (analysisResults.securityAnalysis?.requiresSecurityReview) {
        testingPhase.tasks.push('Run security scans');
        testingPhase.tasks.push('Verify security controls');
      }

      plan.phases.push(testingPhase);

      // Phase 4: Deployment
      const deploymentPhase = {
        name: 'Deployment',
        order: 4,
        tasks: [
          'Deploy to staging environment',
          'Perform smoke tests',
          'Monitor for issues'
        ],
        estimatedTime: '1-2 hours',
        dependencies: ['Testing']
      };

      if (analysisResults.breakingChanges?.migrationRequired) {
        deploymentPhase.tasks.unshift('Execute database migrations');
        deploymentPhase.tasks.push('Verify migration success');
        
        plan.prerequisites.push('Database backup completed');
        plan.risks.push({
          type: 'migration_failure',
          description: 'Database migration could fail',
          severity: 'critical',
          mitigation: 'Test migration on staging first, have rollback plan ready'
        });
      }

      plan.phases.push(deploymentPhase);

      // Calculate total effort
      const totalHours = plan.phases.reduce((total, phase) => {
        const hours = this.parseTimeEstimate(phase.estimatedTime);
        return total + hours;
      }, 0);

      if (totalHours <= 8) {
        plan.estimatedEffort = 'small';
      } else if (totalHours <= 16) {
        plan.estimatedEffort = 'medium';
      } else if (totalHours <= 32) {
        plan.estimatedEffort = 'large';
      } else {
        plan.estimatedEffort = 'xl';
      }

      // Create timeline
      plan.timeline = {
        totalEstimatedTime: `${totalHours} hours`,
        phases: plan.phases.map(phase => ({
          name: phase.name,
          estimatedTime: phase.estimatedTime,
          dependencies: phase.dependencies
        }))
      };

      // Create rollback plan
      plan.rollbackPlan = {
        triggers: [
          'Critical bugs discovered',
          'Performance degradation > 20%',
          'Security vulnerabilities introduced'
        ],
        steps: [
          'Revert commit from main branch',
          'Redeploy previous version',
          'Verify system stability',
          'Notify stakeholders'
        ],
        estimatedTime: '30 minutes'
      };

      // Create testing strategy
      plan.testingStrategy = {
        automated: [
          'Unit tests',
          'Integration tests',
          'End-to-end tests'
        ],
        manual: [
          'User acceptance testing',
          'Exploratory testing',
          'Performance testing'
        ],
        criteria: [
          'All tests pass',
          'No performance regression',
          'Security scans clean'
        ]
      };

    } catch (error) {
      plan.error = `Migration planning failed: ${error.message}`;
      plan.estimatedEffort = 'unknown';
    }

    return plan;
  }

  /**
   * Generate conflict resolution suggestions
   */
  generateConflictResolutions(conflictData) {
    const resolutions = [];

    for (const conflict of conflictData.conflicts) {
      const resolution = {
        file: conflict.file,
        type: conflict.type,
        suggestions: []
      };

      // Apply pattern-based resolution
      for (const [patternName, pattern] of Object.entries(this.conflictPatterns)) {
        if (conflict.content && pattern.pattern.test(conflict.content)) {
          const suggestion = this[pattern.resolver](conflict);
          if (suggestion) {
            resolution.suggestions.push({
              method: patternName,
              description: pattern.description,
              resolution: suggestion,
              confidence: this.calculateResolutionConfidence(patternName, conflict)
            });
          }
        }
      }

      // Check adaptation patterns
      const adaptationSuggestion = this.findAdaptationPattern(conflict);
      if (adaptationSuggestion) {
        resolution.suggestions.push(adaptationSuggestion);
      }

      resolutions.push(resolution);
    }

    return {
      resolutions,
      recommendedApproach: this.recommendIntegrationApproach(resolutions),
      automationPossible: this.assessAutomationPossibility(resolutions)
    };
  }

  /**
   * Analyze code similarity for adaptation guidance
   */
  analyzeCodeSimilarity(commitData, repositoryPath) {
    const similarities = [];
    const changedFiles = commitData.filesChanged || [];

    try {
      // Get historical commits for similarity analysis
      const historicalCommits = this.getHistoricalCommits(repositoryPath);
      
      for (const file of changedFiles) {
        const filePath = join(repositoryPath, file);
        if (!existsSync(filePath)) continue;

        const currentContent = readFileSync(filePath, 'utf8');
        const similarChanges = this.findSimilarChanges(file, currentContent, historicalCommits, repositoryPath);
        
        if (similarChanges.length > 0) {
          similarities.push({
            file,
            similarChanges: similarChanges.slice(0, 5), // Top 5 similar changes
            adaptationGuidance: this.generateAdaptationGuidance(similarChanges)
          });
        }
      }

      return {
        hasSimilarChanges: similarities.length > 0,
        similarities,
        overallGuidance: this.generateOverallGuidance(similarities)
      };
    } catch (error) {
      return {
        hasSimilarChanges: false,
        similarities: [],
        error: `Similarity analysis failed: ${error.message}`,
        overallGuidance: 'No similar changes found for guidance.'
      };
    }
  }

  /**
   * Create detailed migration path planning
   */
  createMigrationPlan(commitData, analysisResults, repositoryPath) {
    const plan = {
      phases: [],
      totalEstimatedTime: 0,
      riskAssessment: 'low',
      prerequisites: [],
      rollbackPlan: [],
      testingStrategy: []
    };

    // Phase 1: Preparation
    const prepPhase = {
      name: 'Preparation',
      tasks: [
        'Create feature branch for integration',
        'Backup current state',
        'Review dependency changes'
      ],
      estimatedTime: '30 minutes',
      dependencies: []
    };

    // Add dependency analysis tasks
    if (analysisResults.dependencyAnalysis?.complexity !== 'minimal') {
      prepPhase.tasks.push('Analyze dependency impact');
      prepPhase.tasks.push('Update affected modules');
    }

    plan.phases.push(prepPhase);

    // Phase 2: Core Integration
    const integrationPhase = {
      name: 'Core Integration',
      tasks: [],
      estimatedTime: '1-2 hours',
      dependencies: ['Preparation']
    };

    // Add tasks based on analysis results
    if (analysisResults.breakingChanges?.hasBreakingChanges) {
      integrationPhase.tasks.push('Handle breaking changes');
      integrationPhase.tasks.push('Update API interfaces');
    }

    if (analysisResults.conflicts?.hasConflicts) {
      integrationPhase.tasks.push('Resolve merge conflicts');
      integrationPhase.tasks.push('Apply conflict resolutions');
    }

    integrationPhase.tasks.push('Apply upstream changes');
    integrationPhase.tasks.push('Run initial tests');

    plan.phases.push(integrationPhase);

    // Phase 3: Adaptation
    const adaptationPhase = {
      name: 'Adaptation',
      tasks: [
        'Apply fork-specific adaptations',
        'Update custom features',
        'Resolve integration issues'
      ],
      estimatedTime: '2-4 hours',
      dependencies: ['Core Integration']
    };

    // Add adaptation tasks based on patterns
    const adaptationPatterns = this.getRelevantAdaptationPatterns(commitData);
    for (const pattern of adaptationPatterns) {
      adaptationPhase.tasks.push(`Apply ${pattern.name} adaptation pattern`);
    }

    plan.phases.push(adaptationPhase);

    // Phase 4: Testing & Validation
    const testingPhase = {
      name: 'Testing & Validation',
      tasks: [
        'Run unit tests',
        'Run integration tests',
        'Perform manual testing',
        'Validate performance'
      ],
      estimatedTime: '1-3 hours',
      dependencies: ['Adaptation']
    };

    // Add specific testing based on analysis
    if (analysisResults.securityAnalysis?.hasSecurityImpact) {
      testingPhase.tasks.push('Security testing');
    }

    if (analysisResults.performanceAnalysis?.hasPerformanceImpact) {
      testingPhase.tasks.push('Performance benchmarking');
    }

    plan.phases.push(testingPhase);

    // Calculate total time and risk
    plan.totalEstimatedTime = this.calculateTotalTime(plan.phases);
    plan.riskAssessment = this.assessMigrationRisk(analysisResults);
    plan.prerequisites = this.generatePrerequisites(analysisResults);
    plan.rollbackPlan = this.generateRollbackPlan(commitData);
    plan.testingStrategy = this.generateTestingStrategy(analysisResults);

    return plan;
  }

  /**
   * Learn and store adaptation patterns
   */
  learnAdaptationPattern(commitHash, adaptationData) {
    const pattern = {
      id: `pattern_${Date.now()}`,
      commitHash,
      patternType: adaptationData.type,
      sourcePattern: adaptationData.sourcePattern,
      targetPattern: adaptationData.targetPattern,
      context: adaptationData.context,
      success: adaptationData.success,
      effort: adaptationData.effort,
      notes: adaptationData.notes,
      createdAt: new Date().toISOString()
    };

    // Store in database
    try {
      const stmt = this.db.db.prepare(`
        INSERT INTO adaptation_patterns 
        (pattern_id, commit_hash, pattern_type, source_pattern, target_pattern, context, success, effort, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        pattern.id,
        pattern.commitHash,
        pattern.patternType,
        pattern.sourcePattern,
        pattern.targetPattern,
        JSON.stringify(pattern.context),
        pattern.success ? 1 : 0,
        pattern.effort,
        pattern.notes,
        pattern.createdAt
      );

      // Update in-memory cache
      this.adaptationPatterns.set(pattern.id, pattern);
      
      return pattern;
    } catch (error) {
      console.error('Failed to store adaptation pattern:', error);
      return null;
    }
  }

  // Helper methods
  async simulateMerge(commitHash, repositoryPath) {
    try {
      // Create a temporary branch for simulation
      const tempBranch = `temp_merge_${Date.now()}`;
      
      execSync(`git checkout -b ${tempBranch}`, { cwd: repositoryPath, stdio: 'ignore' });
      
      try {
        // Attempt merge
        execSync(`git merge ${commitHash}`, { cwd: repositoryPath, stdio: 'ignore' });
        
        // Clean up
        execSync('git checkout -', { cwd: repositoryPath, stdio: 'ignore' });
        execSync(`git branch -D ${tempBranch}`, { cwd: repositoryPath, stdio: 'ignore' });
        
        return { hasConflicts: false, conflictFiles: [] };
      } catch (mergeError) {
        // Get conflict files
        const statusOutput = execSync('git status --porcelain', { 
          cwd: repositoryPath, 
          encoding: 'utf8' 
        });
        
        const conflictFiles = statusOutput
          .split('\n')
          .filter(line => line.startsWith('UU '))
          .map(line => line.substring(3));
        
        // Clean up
        execSync('git merge --abort', { cwd: repositoryPath, stdio: 'ignore' });
        execSync('git checkout -', { cwd: repositoryPath, stdio: 'ignore' });
        execSync(`git branch -D ${tempBranch}`, { cwd: repositoryPath, stdio: 'ignore' });
        
        return { hasConflicts: true, conflictFiles };
      }
    } catch (error) {
      return { hasConflicts: false, conflictFiles: [], error: error.message };
    }
  }

  async analyzeFileConflicts(filePath, repositoryPath) {
    try {
      const fullPath = join(repositoryPath, filePath);
      const content = readFileSync(fullPath, 'utf8');
      
      const conflictMarkers = content.match(/^<<<<<<< HEAD[\s\S]*?>>>>>>> /gm) || [];
      
      return {
        file: filePath,
        type: 'merge-conflict',
        conflictCount: conflictMarkers.length,
        content: content,
        conflicts: conflictMarkers.map(marker => this.parseConflictMarker(marker))
      };
    } catch (error) {
      return {
        file: filePath,
        type: 'file-error',
        error: error.message
      };
    }
  }

  analyzeSemanticConflicts(changedFiles, repositoryPath) {
    const semanticConflicts = [];
    
    // Check for potential semantic conflicts
    for (const file of changedFiles) {
      try {
        const filePath = join(repositoryPath, file);
        if (!existsSync(filePath)) continue;
        
        const content = readFileSync(filePath, 'utf8');
        
        // Check for function signature changes
        const functionChanges = this.detectFunctionSignatureChanges(content, file);
        if (functionChanges.length > 0) {
          semanticConflicts.push({
            file,
            type: 'function-signature',
            changes: functionChanges,
            impact: 'high'
          });
        }
        
        // Check for API changes
        const apiChanges = this.detectAPIChanges(content, file);
        if (apiChanges.length > 0) {
          semanticConflicts.push({
            file,
            type: 'api-change',
            changes: apiChanges,
            impact: 'medium'
          });
        }
        
      } catch (error) {
        continue;
      }
    }
    
    return semanticConflicts;
  }

  generateResolutionSuggestions(conflicts) {
    const suggestions = [];
    
    for (const conflict of conflicts) {
      if (conflict.type === 'merge-conflict') {
        suggestions.push({
          file: conflict.file,
          suggestion: 'Use three-way merge tool to resolve conflicts',
          priority: 'high',
          estimatedTime: '15-30 minutes'
        });
      } else if (conflict.type === 'function-signature') {
        suggestions.push({
          file: conflict.file,
          suggestion: 'Update function calls to match new signature',
          priority: 'high',
          estimatedTime: '30-60 minutes'
        });
      } else if (conflict.type === 'api-change') {
        suggestions.push({
          file: conflict.file,
          suggestion: 'Review API changes and update client code',
          priority: 'medium',
          estimatedTime: '1-2 hours'
        });
      }
    }
    
    return suggestions;
  }

  estimateResolutionTime(conflicts) {
    let totalMinutes = 0;
    
    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'merge-conflict':
          totalMinutes += conflict.conflictCount * 15;
          break;
        case 'function-signature':
          totalMinutes += conflict.changes.length * 30;
          break;
        case 'api-change':
          totalMinutes += conflict.changes.length * 60;
          break;
        default:
          totalMinutes += 30;
      }
    }
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.ceil(totalMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  // Conflict resolution methods
  mergeImports(conflict) {
    // Extract imports from both sides
    const headImports = this.extractImports(conflict.headContent);
    const incomingImports = this.extractImports(conflict.incomingContent);
    
    // Merge and deduplicate
    const mergedImports = [...new Set([...headImports, ...incomingImports])];
    
    return {
      type: 'automatic',
      resolution: mergedImports.join('\n'),
      confidence: 0.9
    };
  }

  mergeDependencies(conflict) {
    try {
      const headDeps = JSON.parse(conflict.headContent);
      const incomingDeps = JSON.parse(conflict.incomingContent);
      
      // Merge dependencies, preferring newer versions
      const merged = { ...headDeps };
      
      for (const [pkg, version] of Object.entries(incomingDeps)) {
        if (!merged[pkg] || this.compareVersions(version, merged[pkg]) > 0) {
          merged[pkg] = version;
        }
      }
      
      return {
        type: 'automatic',
        resolution: JSON.stringify(merged, null, 2),
        confidence: 0.8
      };
    } catch (error) {
      return {
        type: 'manual',
        resolution: 'Manual review required for dependency conflicts',
        confidence: 0.3
      };
    }
  }

  mergeConfig(conflict) {
    // Basic config merging - prefer incoming for new keys, keep existing for conflicts
    return {
      type: 'manual',
      resolution: 'Review configuration changes manually',
      confidence: 0.5,
      suggestion: 'Compare configurations and merge non-conflicting changes'
    };
  }

  analyzeFunctionConflict(conflict) {
    // Analyze function differences
    const headFunc = this.parseFunctionSignature(conflict.headContent);
    const incomingFunc = this.parseFunctionSignature(conflict.incomingContent);
    
    if (headFunc && incomingFunc) {
      if (headFunc.name === incomingFunc.name) {
        return {
          type: 'signature-change',
          resolution: 'Function signature changed - review parameters and return type',
          confidence: 0.7,
          details: {
            headSignature: headFunc.signature,
            incomingSignature: incomingFunc.signature
          }
        };
      }
    }
    
    return {
      type: 'manual',
      resolution: 'Manual review required for function conflicts',
      confidence: 0.4
    };
  }

  calculateResolutionConfidence(patternName, conflict) {
    const baseConfidence = {
      imports: 0.9,
      dependencies: 0.8,
      config: 0.5,
      functions: 0.6
    };
    
    return baseConfidence[patternName] || 0.5;
  }

  findAdaptationPattern(conflict) {
    // Search for similar patterns in adaptation history
    for (const [id, pattern] of this.adaptationPatterns) {
      if (this.isPatternApplicable(pattern, conflict)) {
        return {
          method: 'adaptation-pattern',
          description: `Similar pattern found: ${pattern.patternType}`,
          resolution: pattern.targetPattern,
          confidence: pattern.success ? 0.8 : 0.6,
          patternId: id,
          notes: pattern.notes
        };
      }
    }
    
    return null;
  }

  isPatternApplicable(pattern, conflict) {
    // Simple similarity check - could be enhanced with ML
    const patternContext = pattern.context || {};
    const conflictFile = conflict.file || '';
    
    // Check file type similarity
    if (patternContext.fileType && conflictFile) {
      const conflictExt = extname(conflictFile);
      if (patternContext.fileType !== conflictExt) {
        return false;
      }
    }
    
    // Check pattern type similarity
    if (pattern.patternType === conflict.type) {
      return true;
    }
    
    return false;
  }

  recommendIntegrationApproach(resolutions) {
    const automaticCount = resolutions.filter(r => 
      r.suggestions.some(s => s.method === 'automatic')
    ).length;
    
    const totalCount = resolutions.length;
    
    if (automaticCount / totalCount > 0.8) {
      return 'automated';
    } else if (automaticCount / totalCount > 0.5) {
      return 'semi-automated';
    } else {
      return 'manual';
    }
  }

  assessAutomationPossibility(resolutions) {
    const highConfidenceCount = resolutions.filter(r =>
      r.suggestions.some(s => s.confidence > 0.8)
    ).length;
    
    return {
      possible: highConfidenceCount > 0,
      percentage: Math.round((highConfidenceCount / resolutions.length) * 100),
      recommendation: highConfidenceCount > resolutions.length * 0.7 ? 
        'High automation potential' : 
        'Limited automation potential'
    };
  }

  getHistoricalCommits(repositoryPath, limit = 100) {
    try {
      const output = execSync(
        `git log --oneline -n ${limit} --pretty=format:"%H|%s"`,
        { cwd: repositoryPath, encoding: 'utf8' }
      );
      
      return output.split('\n').map(line => {
        const [hash, message] = line.split('|');
        return { hash, message };
      });
    } catch (error) {
      return [];
    }
  }

  findSimilarChanges(file, content, historicalCommits, repositoryPath) {
    const similarities = [];
    
    // Simple similarity based on file type and content patterns
    const fileExt = extname(file);
    const contentLines = content.split('\n');
    
    for (const commit of historicalCommits.slice(0, 20)) { // Check last 20 commits
      try {
        const commitFiles = execSync(
          `git show --name-only --pretty=format: ${commit.hash}`,
          { cwd: repositoryPath, encoding: 'utf8' }
        ).split('\n').filter(f => f.trim());
        
        const similarFiles = commitFiles.filter(f => extname(f) === fileExt);
        
        if (similarFiles.length > 0) {
          similarities.push({
            commitHash: commit.hash,
            commitMessage: commit.message,
            similarFiles,
            similarity: this.calculateContentSimilarity(contentLines, commit, repositoryPath)
          });
        }
      } catch (error) {
        continue;
      }
    }
    
    return similarities
      .filter(s => s.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity);
  }

  calculateContentSimilarity(contentLines, commit, repositoryPath) {
    // Simple line-based similarity - could be enhanced
    try {
      const commitContent = execSync(
        `git show ${commit.hash}`,
        { cwd: repositoryPath, encoding: 'utf8' }
      );
      
      const commitLines = commitContent.split('\n');
      const commonLines = contentLines.filter(line => 
        commitLines.some(cLine => cLine.includes(line.trim()))
      );
      
      return commonLines.length / Math.max(contentLines.length, 1);
    } catch (error) {
      return 0;
    }
  }

  generateAdaptationGuidance(similarChanges) {
    const guidance = [];
    
    for (const change of similarChanges) {
      guidance.push({
        approach: `Similar to commit ${change.commitHash.substring(0, 8)}`,
        description: change.commitMessage,
        similarity: Math.round(change.similarity * 100) + '%',
        recommendation: 'Review this commit for adaptation patterns'
      });
    }
    
    return guidance;
  }

  generateOverallGuidance(similarities) {
    if (similarities.length === 0) {
      return 'No similar changes found. Proceed with careful manual integration.';
    }
    
    const avgSimilarity = similarities.reduce((sum, s) => 
      sum + s.similarChanges.reduce((sum2, sc) => sum2 + sc.similarity, 0) / s.similarChanges.length, 0
    ) / similarities.length;
    
    if (avgSimilarity > 0.7) {
      return 'High similarity found with previous changes. Follow established patterns.';
    } else if (avgSimilarity > 0.4) {
      return 'Moderate similarity found. Use previous changes as guidance.';
    } else {
      return 'Low similarity with previous changes. Proceed with caution.';
    }
  }

  loadAdaptationPatterns() {
    try {
      // Create table if it doesn't exist
      this.db.db.exec(`
        CREATE TABLE IF NOT EXISTS adaptation_patterns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pattern_id TEXT UNIQUE,
          commit_hash TEXT,
          pattern_type TEXT,
          source_pattern TEXT,
          target_pattern TEXT,
          context TEXT,
          success INTEGER,
          effort TEXT,
          notes TEXT,
          created_at DATETIME
        )
      `);
      
      // Load existing patterns
      const stmt = this.db.db.prepare('SELECT * FROM adaptation_patterns');
      const patterns = stmt.all();
      
      for (const pattern of patterns) {
        this.adaptationPatterns.set(pattern.pattern_id, {
          ...pattern,
          context: JSON.parse(pattern.context || '{}'),
          success: pattern.success === 1
        });
      }
    } catch (error) {
      console.error('Failed to load adaptation patterns:', error);
    }
  }

  getRelevantAdaptationPatterns(commitData) {
    const relevant = [];
    
    for (const [id, pattern] of this.adaptationPatterns) {
      if (pattern.success && this.isPatternRelevant(pattern, commitData)) {
        relevant.push(pattern);
      }
    }
    
    return relevant.slice(0, 5); // Top 5 relevant patterns
  }

  isPatternRelevant(pattern, commitData) {
    // Check if pattern is relevant to current commit
    const commitFiles = commitData.filesChanged || [];
    const patternContext = pattern.context || {};
    
    // Check file type overlap
    if (patternContext.fileTypes) {
      const commitFileTypes = commitFiles.map(f => extname(f));
      const hasOverlap = patternContext.fileTypes.some(ft => commitFileTypes.includes(ft));
      if (hasOverlap) return true;
    }
    
    // Check commit message similarity
    if (pattern.commit_hash && commitData.message) {
      const similarity = this.calculateMessageSimilarity(
        pattern.notes || '', 
        commitData.message
      );
      if (similarity > 0.5) return true;
    }
    
    return false;
  }

  calculateMessageSimilarity(msg1, msg2) {
    const words1 = msg1.toLowerCase().split(/\s+/);
    const words2 = msg2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length, 1);
  }

  calculateTotalTime(phases) {
    // Simple time calculation - could be enhanced
    let totalHours = 0;
    
    for (const phase of phases) {
      const timeStr = phase.estimatedTime;
      const hours = this.parseTimeString(timeStr);
      totalHours += hours;
    }
    
    return `${totalHours}-${totalHours * 1.5} hours`;
  }

  parseTimeString(timeStr) {
    const hourMatch = timeStr.match(/(\d+)-?(\d+)?\s*hours?/);
    const minuteMatch = timeStr.match(/(\d+)\s*minutes?/);
    
    if (hourMatch) {
      return parseInt(hourMatch[1]);
    } else if (minuteMatch) {
      return Math.ceil(parseInt(minuteMatch[1]) / 60);
    } else {
      return 1; // Default 1 hour
    }
  }

  assessMigrationRisk(analysisResults) {
    let riskScore = 0;
    
    if (analysisResults.breakingChanges?.hasBreakingChanges) {
      riskScore += analysisResults.breakingChanges.severity === 'critical' ? 3 : 2;
    }
    
    if (analysisResults.conflicts?.hasConflicts) {
      riskScore += analysisResults.conflicts.conflicts.length;
    }
    
    if (analysisResults.securityAnalysis?.hasSecurityImpact) {
      riskScore += analysisResults.securityAnalysis.overallRisk === 'critical' ? 3 : 1;
    }
    
    if (analysisResults.dependencyAnalysis?.complexity === 'very-high') {
      riskScore += 2;
    }
    
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  generatePrerequisites(analysisResults) {
    const prerequisites = ['Ensure clean working directory', 'Create backup branch'];
    
    if (analysisResults.dependencyAnalysis?.complexity !== 'minimal') {
      prerequisites.push('Review dependency changes');
    }
    
    if (analysisResults.breakingChanges?.hasBreakingChanges) {
      prerequisites.push('Identify all API consumers');
    }
    
    if (analysisResults.securityAnalysis?.hasSecurityImpact) {
      prerequisites.push('Security team review');
    }
    
    return prerequisites;
  }

  generateRollbackPlan(commitData) {
    return [
      'Reset to backup branch if integration fails',
      'Document any manual changes made during integration',
      'Restore original configuration files',
      'Revert dependency changes if needed',
      'Run regression tests to ensure stability'
    ];
  }

  generateTestingStrategy(analysisResults) {
    const strategy = ['Run existing test suite'];
    
    if (analysisResults.breakingChanges?.hasBreakingChanges) {
      strategy.push('Test all API endpoints');
      strategy.push('Validate backward compatibility');
    }
    
    if (analysisResults.securityAnalysis?.hasSecurityImpact) {
      strategy.push('Security vulnerability scan');
      strategy.push('Authentication flow testing');
    }
    
    if (analysisResults.performanceAnalysis?.hasPerformanceImpact) {
      strategy.push('Performance benchmarking');
      strategy.push('Load testing');
    }
    
    strategy.push('Manual smoke testing');
    strategy.push('Integration testing with dependent services');
    
    return strategy;
  }

  // Utility methods for parsing
  parseConflictMarker(marker) {
    const lines = marker.split('\n');
    const headStart = lines.findIndex(line => line.startsWith('<<<<<<< HEAD'));
    const separator = lines.findIndex(line => line.startsWith('======='));
    const incomingEnd = lines.findIndex(line => line.startsWith('>>>>>>> '));
    
    return {
      headContent: lines.slice(headStart + 1, separator).join('\n'),
      incomingContent: lines.slice(separator + 1, incomingEnd).join('\n'),
      type: this.classifyConflictType(marker)
    };
  }

  classifyConflictType(marker) {
    if (marker.includes('import ') || marker.includes('require(')) return 'import';
    if (marker.includes('function ') || marker.includes('const ') || marker.includes('let ')) return 'code';
    if (marker.includes('dependencies') || marker.includes('package.json')) return 'dependency';
    return 'unknown';
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /^(import.*from.*|const.*require\(.*\));?$/gm;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  compareVersions(v1, v2) {
    const parts1 = v1.replace(/[^\d.]/g, '').split('.').map(Number);
    const parts2 = v2.replace(/[^\d.]/g, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  parseFunctionSignature(content) {
    const funcMatch = content.match(/function\s+(\w+)\s*\(([^)]*)\)/);
    if (funcMatch) {
      return {
        name: funcMatch[1],
        parameters: funcMatch[2],
        signature: funcMatch[0]
      };
    }
    return null;
  }

  detectFunctionSignatureChanges(content, file) {
    const changes = [];
    const functions = content.match(/function\s+\w+\s*\([^)]*\)/g) || [];
    
    // This is a simplified detection - in practice, you'd compare with the original version
    for (const func of functions) {
      changes.push({
        type: 'function-signature',
        function: func,
        file: file
      });
    }
    
    return changes;
  }

  detectAPIChanges(content, file) {
    const changes = [];
    const exports = content.match(/export\s+(function|class|const|let)\s+\w+/g) || [];
    
    for (const exp of exports) {
      changes.push({
        type: 'export-change',
        export: exp,
        file: file
      });
    }
    
    return changes;
  }
  // Helper methods

  getConflictedFiles(repositoryPath) {
    try {
      const statusOutput = execSync('git status --porcelain', { 
        encoding: 'utf8', 
        cwd: repositoryPath 
      });
      
      const conflictedFiles = [];
      const lines = statusOutput.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('UU ') || line.startsWith('AA ') || line.startsWith('DD ')) {
          const file = line.substring(3).trim();
          conflictedFiles.push({
            file,
            status: line.substring(0, 2),
            type: this.determineConflictType(file)
          });
        }
      }
      
      return conflictedFiles;
    } catch (error) {
      return [];
    }
  }

  determineConflictType(file) {
    const ext = extname(file).toLowerCase();
    const path = file.toLowerCase();
    
    if (file.includes('package.json')) return 'dependency';
    if (path.includes('config') || path.includes('.env')) return 'config';
    if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) return 'code';
    if (['.css', '.scss', '.less'].includes(ext)) return 'style';
    if (['.md', '.txt', '.rst'].includes(ext)) return 'documentation';
    
    return 'other';
  }

  async analyzeFileConflicts(conflictFile, repositoryPath) {
    try {
      const filePath = join(repositoryPath, conflictFile.file);
      const content = readFileSync(filePath, 'utf8');
      
      // Extract conflict markers
      const conflicts = this.extractConflictMarkers(content);
      
      return {
        file: conflictFile.file,
        type: conflictFile.type,
        conflicts: conflicts.length,
        content: content,
        resolutionComplexity: this.assessResolutionComplexity(conflicts),
        suggestedResolution: this.suggestResolution(conflictFile.type, conflicts)
      };
    } catch (error) {
      return {
        file: conflictFile.file,
        type: conflictFile.type,
        error: `Failed to analyze conflicts: ${error.message}`,
        resolutionComplexity: 'unknown'
      };
    }
  }

  extractConflictMarkers(content) {
    const conflicts = [];
    const lines = content.split('\n');
    let currentConflict = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('<<<<<<<')) {
        currentConflict = {
          start: i,
          head: [],
          base: [],
          incoming: []
        };
      } else if (line.startsWith('=======') && currentConflict) {
        currentConflict.separator = i;
      } else if (line.startsWith('>>>>>>>') && currentConflict) {
        currentConflict.end = i;
        conflicts.push(currentConflict);
        currentConflict = null;
      } else if (currentConflict) {
        if (currentConflict.separator === undefined) {
          currentConflict.head.push(line);
        } else {
          currentConflict.incoming.push(line);
        }
      }
    }
    
    return conflicts;
  }

  assessResolutionComplexity(conflicts) {
    if (conflicts.length === 0) return 'none';
    if (conflicts.length === 1 && conflicts[0].head.length <= 3) return 'simple';
    if (conflicts.length <= 3 && conflicts.every(c => c.head.length <= 10)) return 'moderate';
    return 'complex';
  }

  suggestResolution(conflictType, conflicts) {
    const suggestions = [];
    
    switch (conflictType) {
      case 'dependency':
        suggestions.push('Merge both dependency sets, resolve version conflicts');
        suggestions.push('Use latest compatible versions');
        break;
      case 'config':
        suggestions.push('Merge configuration values, prioritize security settings');
        suggestions.push('Use environment-specific overrides');
        break;
      case 'code':
        suggestions.push('Review both implementations for best approach');
        suggestions.push('Consider refactoring to combine functionality');
        break;
      default:
        suggestions.push('Manual review required');
        suggestions.push('Consider keeping both versions if applicable');
    }
    
    return suggestions;
  }

  analyzeSemanticConflicts(changedFiles, repositoryPath) {
    const semanticConflicts = [];
    
    // Check for potential semantic conflicts based on file patterns
    const apiFiles = changedFiles.filter(file => 
      file.includes('api') || file.includes('endpoint') || file.includes('route')
    );
    
    if (apiFiles.length > 0) {
      semanticConflicts.push({
        type: 'api_changes',
        description: 'API changes may conflict with existing integrations',
        files: apiFiles,
        severity: 'medium',
        recommendation: 'Review API compatibility and versioning'
      });
    }
    
    const schemaFiles = changedFiles.filter(file => 
      file.includes('schema') || file.includes('migration') || file.includes('model')
    );
    
    if (schemaFiles.length > 0) {
      semanticConflicts.push({
        type: 'schema_changes',
        description: 'Database schema changes may conflict with existing data',
        files: schemaFiles,
        severity: 'high',
        recommendation: 'Plan migration strategy and data backup'
      });
    }
    
    return semanticConflicts;
  }

  generateResolutionSuggestions(conflicts) {
    const suggestions = [];
    
    for (const conflict of conflicts) {
      if (conflict.type === 'dependency') {
        suggestions.push({
          type: 'automated',
          description: 'Use npm/yarn to resolve dependency conflicts',
          command: 'npm install --legacy-peer-deps',
          confidence: 0.8
        });
      } else if (conflict.type === 'config') {
        suggestions.push({
          type: 'manual',
          description: 'Merge configuration files manually',
          steps: [
            'Compare configuration values',
            'Keep security-critical settings',
            'Test configuration in staging'
          ],
          confidence: 0.6
        });
      }
    }
    
    return suggestions;
  }

  estimateResolutionTime(conflicts) {
    let totalMinutes = 0;
    
    for (const conflict of conflicts) {
      switch (conflict.resolutionComplexity || 'moderate') {
        case 'simple':
          totalMinutes += 15;
          break;
        case 'moderate':
          totalMinutes += 45;
          break;
        case 'complex':
          totalMinutes += 120;
          break;
        default:
          totalMinutes += 60;
      }
    }
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.ceil(totalMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  getHistoricalCommits(repositoryPath) {
    try {
      const logOutput = execSync(
        'git log --oneline -50 --pretty=format:"%H|%s"', 
        { encoding: 'utf8', cwd: repositoryPath }
      );
      
      return logOutput.split('\n').map(line => {
        const [hash, message] = line.split('|');
        return { hash, message };
      }).filter(commit => commit.hash && commit.message);
    } catch (error) {
      return [];
    }
  }

  findSimilarChanges(file, content, historicalCommits, repositoryPath) {
    const similarities = [];
    
    // Simple similarity based on file name patterns
    const fileName = basename(file);
    const fileDir = dirname(file);
    
    for (const commit of historicalCommits.slice(0, 20)) { // Check last 20 commits
      try {
        const commitFiles = execSync(
          `git show --name-only --pretty=format: ${commit.hash}`,
          { encoding: 'utf8', cwd: repositoryPath }
        ).split('\n').filter(f => f.trim());
        
        const similarFiles = commitFiles.filter(f => 
          basename(f) === fileName || dirname(f) === fileDir
        );
        
        if (similarFiles.length > 0) {
          similarities.push({
            commit: commit.hash,
            message: commit.message,
            similarFiles,
            similarity: this.calculateFileSimilarity(file, similarFiles)
          });
        }
      } catch (error) {
        // Skip this commit if we can't analyze it
        continue;
      }
    }
    
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  }

  calculateFileSimilarity(targetFile, candidateFiles) {
    const targetName = basename(targetFile);
    const targetDir = dirname(targetFile);
    
    let maxSimilarity = 0;
    
    for (const candidate of candidateFiles) {
      let similarity = 0;
      
      // Exact file name match
      if (basename(candidate) === targetName) {
        similarity += 0.5;
      }
      
      // Same directory
      if (dirname(candidate) === targetDir) {
        similarity += 0.3;
      }
      
      // Same extension
      if (extname(candidate) === extname(targetFile)) {
        similarity += 0.2;
      }
      
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }
    
    return maxSimilarity;
  }

  parseTimeEstimate(timeString) {
    const match = timeString.match(/(\d+)-?(\d+)?\s*(hour|minute)/i);
    if (!match) return 4; // Default 4 hours
    
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    const unit = match[3].toLowerCase();
    
    const average = (min + max) / 2;
    return unit === 'hour' ? average : average / 60;
  }

  // Conflict resolution methods
  mergeImports(conflict) {
    const headImports = this.extractImportsFromLines(conflict.head);
    const incomingImports = this.extractImportsFromLines(conflict.incoming);
    
    const mergedImports = [...new Set([...headImports, ...incomingImports])];
    return mergedImports.join('\n');
  }

  mergeDependencies(conflict) {
    try {
      const headDeps = JSON.parse(conflict.head.join('\n'));
      const incomingDeps = JSON.parse(conflict.incoming.join('\n'));
      
      const merged = { ...headDeps, ...incomingDeps };
      return JSON.stringify(merged, null, 2);
    } catch (error) {
      return null; // Manual resolution required
    }
  }

  mergeConfig(conflict) {
    // Simple key-value merge for configuration
    const headConfig = this.parseConfigLines(conflict.head);
    const incomingConfig = this.parseConfigLines(conflict.incoming);
    
    const merged = { ...headConfig, ...incomingConfig };
    return Object.entries(merged).map(([key, value]) => `${key}=${value}`).join('\n');
  }

  analyzeFunctionConflict(conflict) {
    // For function conflicts, suggest manual review
    return {
      suggestion: 'manual_review',
      reason: 'Function conflicts require careful analysis of logic differences',
      recommendation: 'Compare both implementations and choose the best approach'
    };
  }

  extractImportsFromLines(lines) {
    return lines.filter(line => 
      line.trim().startsWith('import ') || line.trim().startsWith('const ') && line.includes('require(')
    );
  }

  parseConfigLines(lines) {
    const config = {};
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*[=:]\s*(.+)$/);
      if (match) {
        config[match[1]] = match[2];
      }
    }
    return config;
  }

  calculateResolutionConfidence(method, conflict) {
    const confidenceMap = {
      imports: 0.8,
      dependencies: 0.7,
      config: 0.6,
      functions: 0.3
    };
    
    return confidenceMap[method] || 0.5;
  }

  findAdaptationPattern(conflict) {
    // Check stored adaptation patterns
    for (const [pattern, data] of this.adaptationPatterns) {
      if (this.matchesPattern(conflict, pattern)) {
        return {
          method: 'adaptation_pattern',
          description: `Similar conflict resolved previously: ${data.description}`,
          resolution: data.resolution,
          confidence: data.successRate || 0.7
        };
      }
    }
    
    return null;
  }

  matchesPattern(conflict, pattern) {
    // Simple pattern matching based on file type and conflict type
    return conflict.type === pattern.type && 
           conflict.file.includes(pattern.filePattern);
  }

  recommendIntegrationApproach(resolutions) {
    const automatable = resolutions.filter(r => 
      r.suggestions.some(s => s.confidence > 0.7)
    ).length;
    
    const total = resolutions.length;
    
    if (automatable / total > 0.8) {
      return 'automated';
    } else if (automatable / total > 0.5) {
      return 'semi_automated';
    } else {
      return 'manual';
    }
  }

  assessAutomationPossibility(resolutions) {
    return resolutions.some(r => 
      r.suggestions.some(s => s.type === 'automated' && s.confidence > 0.8)
    );
  }

  loadAdaptationPatterns() {
    // Load patterns from database if available
    try {
      if (this.db) {
        const patterns = this.db.getAdaptationPatterns();
        for (const pattern of patterns) {
          this.adaptationPatterns.set(pattern.id, pattern);
        }
      }
    } catch (error) {
      // Database not available or no patterns stored
    }
  }

  learnAdaptationPattern(commitHash, adaptationData) {
    const pattern = {
      id: `pattern_${Date.now()}`,
      commitHash,
      type: adaptationData.type,
      sourcePattern: adaptationData.source_pattern,
      targetPattern: adaptationData.target_pattern,
      context: adaptationData.context,
      success: adaptationData.success,
      effort: adaptationData.effort,
      notes: adaptationData.notes,
      createdAt: new Date().toISOString()
    };
    
    // Store in memory
    this.adaptationPatterns.set(pattern.id, pattern);
    
    // Store in database if available
    try {
      if (this.db) {
        this.db.storeAdaptationPattern(pattern);
      }
    } catch (error) {
      // Database storage failed, but pattern is still in memory
    }
    
    return pattern;
  }
}

export default IntegrationHelpersSystem;