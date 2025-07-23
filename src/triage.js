// Smart triage system for fork parity analysis

class SmartTriageSystem {
  constructor() {
    // Keywords for different categories and priorities
    this.patterns = {
      security: {
        keywords: ['security', 'vulnerability', 'exploit', 'cve', 'xss', 'csrf', 'injection', 'auth', 'permission', 'sanitize', 'escape'],
        priority: 'critical',
        confidence: 0.9
      },
      bugfix: {
        keywords: ['fix', 'bug', 'issue', 'error', 'crash', 'fail', 'broken', 'incorrect', 'wrong', 'patch'],
        priority: 'high',
        confidence: 0.8
      },
      feature: {
        keywords: ['add', 'new', 'feature', 'implement', 'support', 'enable', 'introduce'],
        priority: 'medium',
        confidence: 0.7
      },
      refactor: {
        keywords: ['refactor', 'cleanup', 'reorganize', 'restructure', 'optimize', 'improve', 'simplify'],
        priority: 'low',
        confidence: 0.6
      },
      docs: {
        keywords: ['doc', 'readme', 'comment', 'documentation', 'guide', 'example', 'tutorial'],
        priority: 'low',
        confidence: 0.9
      },
      test: {
        keywords: ['test', 'spec', 'coverage', 'mock', 'stub', 'fixture'],
        priority: 'low',
        confidence: 0.8
      },
      chore: {
        keywords: ['chore', 'update', 'bump', 'version', 'dependency', 'build', 'ci', 'lint'],
        priority: 'low',
        confidence: 0.7
      }
    };

    // File patterns that indicate impact areas
    this.impactPatterns = {
      'core': [/^src\/core/, /^lib\/core/, /^core\//],
      'api': [/api/, /endpoint/, /route/, /controller/],
      'ui': [/component/, /view/, /ui/, /frontend/, /client/],
      'database': [/migration/, /schema/, /model/, /db/, /database/],
      'auth': [/auth/, /login/, /permission/, /security/],
      'config': [/config/, /setting/, /env/, /\.env/],
      'build': [/webpack/, /rollup/, /vite/, /build/, /package\.json/, /Dockerfile/],
      'test': [/test/, /spec/, /__tests__/],
      'docs': [/readme/, /doc/, /\.md$/]
    };

    // Effort estimation based on file changes and complexity
    this.effortPatterns = {
      trivial: { maxFiles: 2, maxLines: 10 },
      small: { maxFiles: 5, maxLines: 50 },
      medium: { maxFiles: 15, maxLines: 200 },
      large: { maxFiles: 30, maxLines: 500 }
    };
  }

  /**
   * Analyze a commit and generate triage results
   */
  analyzeCommit(commitData) {
    const message = commitData.message.toLowerCase();
    const filesChanged = commitData.filesChanged || [];
    const totalLines = (commitData.insertions || 0) + (commitData.deletions || 0);

    // Determine category and base priority
    const categoryResult = this.categorizeCommit(message, filesChanged);
    
    // Determine impact areas
    const impactAreas = this.determineImpactAreas(filesChanged);
    
    // Estimate effort
    const effortEstimate = this.estimateEffort(filesChanged.length, totalLines);
    
    // Calculate conflict risk
    const conflictRisk = this.calculateConflictRisk(filesChanged, impactAreas);
    
    // Adjust priority based on impact and risk
    const adjustedPriority = this.adjustPriority(
      categoryResult.priority, 
      impactAreas, 
      conflictRisk,
      effortEstimate
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(
      categoryResult,
      impactAreas,
      effortEstimate,
      conflictRisk,
      adjustedPriority
    );

    return {
      priority: adjustedPriority,
      category: categoryResult.category,
      impactAreas,
      conflictRisk,
      effortEstimate,
      reasoning,
      confidence: categoryResult.confidence
    };
  }

  /**
   * Categorize commit based on message and files
   */
  categorizeCommit(message, filesChanged) {
    let bestMatch = { category: 'chore', priority: 'low', confidence: 0.3 };
    
    // Check each pattern category
    for (const [category, pattern] of Object.entries(this.patterns)) {
      const matchCount = pattern.keywords.filter(keyword => 
        message.includes(keyword)
      ).length;
      
      if (matchCount > 0) {
        const confidence = Math.min(0.9, pattern.confidence + (matchCount - 1) * 0.1);
        if (confidence > bestMatch.confidence) {
          bestMatch = { category, priority: pattern.priority, confidence };
        }
      }
    }

    // Special handling for security-related files
    const hasSecurityFiles = filesChanged.some(file => 
      /auth|security|permission|login/.test(file.toLowerCase())
    );
    if (hasSecurityFiles && bestMatch.category !== 'security') {
      bestMatch.priority = this.escalatePriority(bestMatch.priority);
    }

    return bestMatch;
  }

  /**
   * Determine which areas of the codebase are impacted
   */
  determineImpactAreas(filesChanged) {
    const impactAreas = new Set();
    
    for (const file of filesChanged) {
      for (const [area, patterns] of Object.entries(this.impactPatterns)) {
        if (patterns.some(pattern => pattern.test(file))) {
          impactAreas.add(area);
        }
      }
    }
    
    return Array.from(impactAreas);
  }

  /**
   * Estimate effort required for integration
   */
  estimateEffort(fileCount, lineCount) {
    for (const [effort, limits] of Object.entries(this.effortPatterns)) {
      if (fileCount <= limits.maxFiles && lineCount <= limits.maxLines) {
        return effort;
      }
    }
    return 'xl';
  }

  /**
   * Calculate risk of conflicts during integration
   */
  calculateConflictRisk(filesChanged, impactAreas) {
    let risk = 0.1; // Base risk
    
    // Higher risk for core areas
    if (impactAreas.includes('core')) risk += 0.3;
    if (impactAreas.includes('api')) risk += 0.2;
    if (impactAreas.includes('database')) risk += 0.25;
    
    // Risk based on number of files
    risk += Math.min(0.3, filesChanged.length * 0.02);
    
    // Risk for commonly modified files
    const commonFiles = ['package.json', 'README.md', 'config.js', 'index.js'];
    const hasCommonFiles = filesChanged.some(file => 
      commonFiles.some(common => file.includes(common))
    );
    if (hasCommonFiles) risk += 0.15;
    
    return Math.min(1.0, risk);
  }

  /**
   * Adjust priority based on various factors
   */
  adjustPriority(basePriority, impactAreas, conflictRisk, effortEstimate) {
    let priority = basePriority;
    
    // Escalate if affecting core systems
    if (impactAreas.includes('core') || impactAreas.includes('auth')) {
      priority = this.escalatePriority(priority);
    }
    
    // Escalate high-risk changes
    if (conflictRisk > 0.7) {
      priority = this.escalatePriority(priority);
    }
    
    // De-escalate trivial changes unless they're security-related
    if (effortEstimate === 'trivial' && priority !== 'critical') {
      priority = this.deescalatePriority(priority);
    }
    
    return priority;
  }

  /**
   * Generate human-readable reasoning for the triage decision
   */
  generateReasoning(categoryResult, impactAreas, effortEstimate, conflictRisk, finalPriority) {
    const parts = [];
    
    parts.push(`Categorized as ${categoryResult.category} based on commit message`);
    
    if (impactAreas.length > 0) {
      parts.push(`affects ${impactAreas.join(', ')} areas`);
    }
    
    parts.push(`estimated ${effortEstimate} effort`);
    
    if (conflictRisk > 0.5) {
      parts.push(`high conflict risk (${Math.round(conflictRisk * 100)}%)`);
    }
    
    if (finalPriority !== categoryResult.priority) {
      parts.push(`priority adjusted from ${categoryResult.priority} to ${finalPriority}`);
    }
    
    return parts.join(', ');
  }

  /**
   * Batch analyze multiple commits
   */
  batchAnalyze(commits) {
    return commits.map(commit => ({
      hash: commit.hash,
      triage: this.analyzeCommit(commit)
    }));
  }

  /**
   * Helper methods for priority adjustment
   */
  escalatePriority(priority) {
    const escalation = { 'low': 'medium', 'medium': 'high', 'high': 'critical' };
    return escalation[priority] || priority;
  }

  deescalatePriority(priority) {
    const deescalation = { 'critical': 'high', 'high': 'medium', 'medium': 'low' };
    return deescalation[priority] || priority;
  }

  /**
   * Get actionable items based on priority and status
   */
  getActionableItems(commits, options = {}) {
    const { minPriority = 'medium', maxItems = 20 } = options;
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return commits
      .filter(commit => {
        const triage = commit.triage || this.analyzeCommit(commit);
        return priorityOrder[triage.priority] >= priorityOrder[minPriority];
      })
      .sort((a, b) => {
        const aPriority = (a.triage || this.analyzeCommit(a)).priority;
        const bPriority = (b.triage || this.analyzeCommit(b)).priority;
        return priorityOrder[bPriority] - priorityOrder[aPriority];
      })
      .slice(0, maxItems);
  }

  /**
   * Generate integration recommendations
   */
  generateIntegrationPlan(commits) {
    const analyzed = this.batchAnalyze(commits);
    const critical = analyzed.filter(c => c.triage.priority === 'critical');
    const high = analyzed.filter(c => c.triage.priority === 'high');
    const medium = analyzed.filter(c => c.triage.priority === 'medium');
    const low = analyzed.filter(c => c.triage.priority === 'low');

    return {
      immediate: critical.concat(high.slice(0, 3)),
      nextSprint: high.slice(3).concat(medium.slice(0, 5)),
      backlog: medium.slice(5).concat(low),
      summary: {
        totalCommits: commits.length,
        criticalCount: critical.length,
        highCount: high.length,
        mediumCount: medium.length,
        lowCount: low.length,
        estimatedEffort: this.calculateTotalEffort(analyzed)
      }
    };
  }

  calculateTotalEffort(analyzedCommits) {
    const effortPoints = { trivial: 1, small: 3, medium: 8, large: 20, xl: 40 };
    return analyzedCommits.reduce((total, commit) => {
      return total + (effortPoints[commit.triage.effortEstimate] || 0);
    }, 0);
  }
}

export default SmartTriageSystem;