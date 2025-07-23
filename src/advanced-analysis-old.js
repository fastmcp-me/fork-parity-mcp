// Advanced analysis system for dependency chains, breaking changes, and impact assessment

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';

class AdvancedAnalysisSystem {
  constructor() {
    // Patterns for different types of breaking changes
    this.breakingChangePatterns = {
      api: {
        patterns: [
          /export\s+(function|class|interface|type)\s+(\w+)/g,
          /export\s+\{[^}]+\}/g,
          /export\s+default/g,
          /public\s+(function|class|method)\s+(\w+)/g,
          /interface\s+(\w+)/g,
          /type\s+(\w+)\s*=/g
        ],
        severity: 'high'
      },
      database: {
        patterns: [
          /CREATE\s+TABLE/gi,
          /ALTER\s+TABLE/gi,
          /DROP\s+TABLE/gi,
          /ADD\s+COLUMN/gi,
          /DROP\s+COLUMN/gi,
          /CREATE\s+INDEX/gi,
          /migration/gi
        ],
        severity: 'critical'
      },
      config: {
        patterns: [
          /config\./gi,
          /process\.env\./gi,
          /\.env/gi,
          /settings\./gi,
          /configuration/gi
        ],
        severity: 'medium'
      },
      dependencies: {
        patterns: [
          /"dependencies":/gi,
          /"devDependencies":/gi,
          /require\(/gi,
          /import.*from/gi,
          /package\.json/gi
        ],
        severity: 'medium'
      }
    };

    // Security vulnerability patterns (enhanced)
    this.securityPatterns = {
      injection: {
        patterns: [
          /eval\(/gi,
          /innerHTML\s*=/gi,
          /document\.write/gi,
          /\.exec\(/gi,
          /child_process/gi,
          /shell_exec/gi,
          /system\(/gi
        ],
        severity: 'critical',
        description: 'Potential code injection vulnerability'
      },
      authentication: {
        patterns: [
          /password/gi,
          /auth/gi,
          /token/gi,
          /session/gi,
          /login/gi,
          /jwt/gi,
          /oauth/gi,
          /credential/gi
        ],
        severity: 'high',
        description: 'Authentication-related changes'
      },
      cryptography: {
        patterns: [
          /crypto/gi,
          /encrypt/gi,
          /decrypt/gi,
          /hash/gi,
          /salt/gi,
          /cipher/gi,
          /key/gi,
          /certificate/gi
        ],
        severity: 'high',
        description: 'Cryptographic implementation changes'
      },
      dataExposure: {
        patterns: [
          /console\.log/gi,
          /console\.error/gi,
          /console\.warn/gi,
          /console\.info/gi,
          /console\.debug/gi,
          /alert\(/gi,
          /confirm\(/gi
        ],
        severity: 'medium',
        description: 'Potential data exposure through logging'
      }
    };

    // Performance impact patterns
    this.performancePatterns = {
      loops: {
        patterns: [
          /for\s*\(/gi,
          /while\s*\(/gi,
          /forEach/gi,
          /map\(/gi,
          /filter\(/gi,
          /reduce\(/gi
        ],
        impact: 'medium',
        description: 'Loop modifications may affect performance'
      },
      database: {
        patterns: [
          /SELECT\s+\*/gi,
          /JOIN/gi,
          /GROUP\s+BY/gi,
          /ORDER\s+BY/gi,
          /LIMIT/gi,
          /query/gi,
          /findAll/gi,
          /aggregate/gi
        ],
        impact: 'high',
        description: 'Database query changes may impact performance'
      },
      memory: {
        patterns: [
          /new\s+Array/gi,
          /new\s+Object/gi,
          /JSON\.parse/gi,
          /JSON\.stringify/gi,
          /Buffer/gi,
          /malloc/gi,
          /alloc/gi
        ],
        impact: 'medium',
        description: 'Memory allocation changes'
      },
      async: {
        patterns: [
          /async\s+function/gi,
          /await/gi,
          /Promise/gi,
          /setTimeout/gi,
          /setInterval/gi,
          /callback/gi
        ],
        impact: 'medium',
        description: 'Asynchronous operation changes'
      }
    };
  }

  /**
   * Predict performance impact
   */
  predictPerformanceImpact(commitData, repositoryPath) {
    const analysis = {
      performanceImpact: 'neutral',
      hotspots: [],
      recommendations: [],
      metrics: {
        complexityIncrease: 0,
        memoryImpact: 'neutral',
        cpuImpact: 'neutral',
        ioImpact: 'neutral'
      },
      requiresPerformanceTest: false
    };

    const filesChanged = commitData.filesChanged || [];
    const totalLines = (commitData.insertions || 0) + (commitData.deletions || 0);

    try {
      // Analyze each changed file for performance patterns
      for (const file of filesChanged) {
        const filePath = join(repositoryPath, file);
        if (existsSync(filePath)) {
          try {
            const content = readFileSync(filePath, 'utf8');
            const filePerformanceIssues = this.analyzeFileForPerformance(file, content);
            
            if (filePerformanceIssues.length > 0) {
              analysis.hotspots.push(...filePerformanceIssues);
              
              // Update impact level
              const highImpactIssues = filePerformanceIssues.filter(issue => issue.impact === 'high');
              if (highImpactIssues.length > 0) {
                analysis.performanceImpact = 'negative';
                analysis.requiresPerformanceTest = true;
              } else if (analysis.performanceImpact === 'neutral') {
                analysis.performanceImpact = 'minor-negative';
              }
            }
          } catch (error) {
            // File reading failed, skip
          }
        }
      }

      // Calculate complexity increase based on lines changed
      if (totalLines > 500) {
        analysis.metrics.complexityIncrease = 3; // High
        analysis.requiresPerformanceTest = true;
      } else if (totalLines > 200) {
        analysis.metrics.complexityIncrease = 2; // Medium
      } else if (totalLines > 50) {
        analysis.metrics.complexityIncrease = 1; // Low
      }

      // Analyze specific performance areas
      this.analyzePerformanceMetrics(filesChanged, analysis);

      // Generate recommendations
      analysis.recommendations = this.generatePerformanceRecommendations(analysis);

      // Check for database-related changes
      const dbFiles = filesChanged.filter(file => 
        file.includes('migration') || file.includes('schema') || 
        file.includes('model') || file.includes('query')
      );
      
      if (dbFiles.length > 0) {
        analysis.hotspots.push({
          type: 'database',
          description: 'Database schema or query changes detected',
          impact: 'high',
          files: dbFiles,
          recommendation: 'Review query performance and indexing strategy'
        });
        analysis.performanceImpact = 'negative';
        analysis.requiresPerformanceTest = true;
      }

      // Check for build/bundle changes
      const buildFiles = filesChanged.filter(file => 
        file.includes('webpack') || file.includes('rollup') || 
        file.includes('vite') || file.includes('package.json')
      );
      
      if (buildFiles.length > 0) {
        analysis.hotspots.push({
          type: 'build',
          description: 'Build configuration changes may affect bundle size',
          impact: 'medium',
          files: buildFiles,
          recommendation: 'Analyze bundle size impact'
        });
      }

    } catch (error) {
      analysis.error = `Performance analysis failed: ${error.message}`;
      analysis.performanceImpact = 'unknown';
    }

    return analysis;
  }

      for (const file of sourceFiles) {
        const filePath = join(repositoryPath, file);
        if (existsSync(filePath)) {
          try {
            const content = readFileSync(filePath, 'utf8');
            
            // Extract imports/requires
            const imports = this.extractImports(content);
            analysis.importChanges.push({
              file,
              imports: imports.length,
              externalImports: imports.filter(imp => !imp.startsWith('./')).length
            });

            // Check for dynamic imports that could affect bundling
            if (content.includes('import(') || content.includes('require.resolve')) {
              analysis.riskLevel = analysis.riskLevel === 'low' ? 'medium' : 'high';
            }
          } catch (error) {
            // File reading failed, skip
          }
        }
      }

      // Determine impacted modules based on file paths
      analysis.impactedModules = this.identifyImpactedModules(filesChanged);
      
      // Adjust risk level based on impact scope
      if (analysis.impactedModules.includes('core') || analysis.impactedModules.includes('api')) {
        analysis.riskLevel = analysis.riskLevel === 'low' ? 'medium' : 'high';
      }

    } catch (error) {
      analysis.error = `Dependency analysis failed: ${error.message}`;
      analysis.riskLevel = 'medium';
    }

    return analysis;
  }
          reverseDependencies.get(dep).add(file);
        }
      }

      // Analyze impact of changed files
      const changedFiles = commitData.filesChanged || [];
      const impactAnalysis = this.calculateDependencyImpact(
        changedFiles, 
        dependencies, 
        reverseDependencies
      );

      return {
        directDependencies: this.getDirectDependencies(changedFiles, dependencies),
        affectedFiles: impactAnalysis.affectedFiles,
        impactRadius: impactAnalysis.radius,
        criticalPaths: impactAnalysis.criticalPaths,
        complexity: this.calculateComplexity(impactAnalysis)
      };
    } catch (error) {
      return {
        error: `Dependency analysis failed: ${error.message}`,
        directDependencies: [],
        affectedFiles: [],
        impactRadius: 0,
        criticalPaths: [],
        complexity: 'unknown'
      };
    }
  }

  /**
   * Identify breaking changes in a commit
   */
  identifyBreakingChanges(commitData, repositoryPath) {
    const breakingChanges = [];
    const changedFiles = commitData.filesChanged || [];

    for (const file of changedFiles) {
      try {
        const filePath = join(repositoryPath, file);
        if (!existsSync(filePath)) continue;

        const content = readFileSync(filePath, 'utf8');
        const fileExtension = extname(file);

        // Check for different types of breaking changes
        for (const [changeType, config] of Object.entries(this.breakingChangePatterns)) {
          const matches = this.findPatternMatches(content, config.patterns);
          
          if (matches.length > 0) {
            breakingChanges.push({
              file,
              type: changeType,
              severity: config.severity,
              matches: matches.slice(0, 5), // Limit to first 5 matches
              description: this.getBreakingChangeDescription(changeType, matches.length)
            });
          }
        }

        // Special analysis for package.json
        if (file.includes('package.json')) {
          const packageAnalysis = this.analyzePackageChanges(content);
          if (packageAnalysis.hasBreakingChanges) {
            breakingChanges.push(...packageAnalysis.changes);
          }
        }

      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return {
      hasBreakingChanges: breakingChanges.length > 0,
      changes: breakingChanges,
      severity: this.calculateOverallSeverity(breakingChanges),
      recommendation: this.getBreakingChangeRecommendation(breakingChanges)
    };
  }

  /**
   * Enhanced security impact assessment
   */
  assessSecurityImpact(commitData, repositoryPath) {
    const securityIssues = [];
    const changedFiles = commitData.filesChanged || [];

    for (const file of changedFiles) {
      try {
        const filePath = join(repositoryPath, file);
        if (!existsSync(filePath)) continue;

        const content = readFileSync(filePath, 'utf8');

        // Check for security patterns
        for (const [category, config] of Object.entries(this.securityPatterns)) {
          const matches = this.findPatternMatches(content, config.patterns);
          
          if (matches.length > 0) {
            securityIssues.push({
              file,
              category,
              severity: config.severity,
              description: config.description,
              matches: matches.slice(0, 3),
              recommendation: this.getSecurityRecommendation(category, matches.length)
            });
          }
        }

        // Check for hardcoded secrets
        const secretAnalysis = this.detectHardcodedSecrets(content, file);
        if (secretAnalysis.hasSecrets) {
          securityIssues.push(...secretAnalysis.secrets);
        }

      } catch (error) {
        continue;
      }
    }

    return {
      hasSecurityImpact: securityIssues.length > 0,
      issues: securityIssues,
      overallRisk: this.calculateSecurityRisk(securityIssues),
      recommendations: this.getSecurityRecommendations(securityIssues)
    };
  }

  /**
   * Predict performance impact
   */
  predictPerformanceImpact(commitData, repositoryPath) {
    const performanceIssues = [];
    const changedFiles = commitData.filesChanged || [];

    for (const file of changedFiles) {
      try {
        const filePath = join(repositoryPath, file);
        if (!existsSync(filePath)) continue;

        const content = readFileSync(filePath, 'utf8');

        // Check for performance patterns
        for (const [category, config] of Object.entries(this.performancePatterns)) {
          const matches = this.findPatternMatches(content, config.patterns);
          
          if (matches.length > 0) {
            performanceIssues.push({
              file,
              category,
              impact: config.impact,
              description: config.description,
              matchCount: matches.length,
              recommendation: this.getPerformanceRecommendation(category, matches.length)
            });
          }
        }

        // Analyze code complexity
        const complexityAnalysis = this.analyzeCodeComplexity(content, file);
        if (complexityAnalysis.isComplex) {
          performanceIssues.push(complexityAnalysis);
        }

      } catch (error) {
        continue;
      }
    }

    return {
      hasPerformanceImpact: performanceIssues.length > 0,
      issues: performanceIssues,
      overallImpact: this.calculateOverallPerformanceImpact(performanceIssues),
      recommendations: this.getPerformanceRecommendations(performanceIssues)
    };
  }

  // Helper methods
  getAllSourceFiles(repositoryPath) {
    try {
      const output = execSync(
        'find . -type f \\( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.py" -o -name "*.java" -o -name "*.cpp" -o -name "*.c" -o -name "*.h" \\) | head -1000',
        { cwd: repositoryPath, encoding: 'utf8' }
      );
      return output.split('\n').filter(line => line.trim()).map(line => line.replace('./', ''));
    } catch (error) {
      return [];
    }
  }

  extractFileDependencies(file, repositoryPath) {
    const dependencies = new Set();
    
    try {
      const filePath = join(repositoryPath, file);
      if (!existsSync(filePath)) return Array.from(dependencies);

      const content = readFileSync(filePath, 'utf8');
      const ext = extname(file);

      // Extract imports/requires based on file type
      if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
        // JavaScript/TypeScript imports
        const importMatches = content.match(/import.*from\s+['"`]([^'"`]+)['"`]/g) || [];
        const requireMatches = content.match(/require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g) || [];
        
        [...importMatches, ...requireMatches].forEach(match => {
          const pathMatch = match.match(/['"`]([^'"`]+)['"`]/);
          if (pathMatch && pathMatch[1].startsWith('.')) {
            // Relative import
            const depPath = this.resolvePath(dirname(file), pathMatch[1]);
            if (depPath) dependencies.add(depPath);
          }
        });
      } else if (ext === '.py') {
        // Python imports
        const importMatches = content.match(/from\s+\.[\w.]+\s+import|import\s+\.[\w.]+/g) || [];
        importMatches.forEach(match => {
          // Basic relative import detection
          if (match.includes('.')) {
            const parts = match.split(/\s+/);
            const modulePath = parts.find(part => part.startsWith('.'));
            if (modulePath) {
              const depPath = this.resolvePythonPath(dirname(file), modulePath);
              if (depPath) dependencies.add(depPath);
            }
          }
        });
      }
    } catch (error) {
      // Skip files that can't be processed
    }

    return Array.from(dependencies);
  }

  resolvePath(basePath, relativePath) {
    try {
      const resolved = join(basePath, relativePath);
      // Try common extensions
      const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json'];
      for (const ext of extensions) {
        if (existsSync(resolved + ext)) {
          return resolved + ext;
        }
      }
      // Try index files
      for (const ext of extensions) {
        if (existsSync(join(resolved, 'index' + ext))) {
          return join(resolved, 'index' + ext);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  resolvePythonPath(basePath, modulePath) {
    // Basic Python path resolution
    const parts = modulePath.split('.');
    let currentPath = basePath;
    
    for (let i = 1; i < parts.length; i++) {
      if (parts[i]) {
        currentPath = join(currentPath, parts[i]);
      }
    }
    
    if (existsSync(currentPath + '.py')) {
      return currentPath + '.py';
    }
    if (existsSync(join(currentPath, '__init__.py'))) {
      return join(currentPath, '__init__.py');
    }
    
    return null;
  }

  calculateDependencyImpact(changedFiles, dependencies, reverseDependencies) {
    const affectedFiles = new Set();
    const criticalPaths = [];
    let maxRadius = 0;

    // BFS to find all affected files
    const queue = [...changedFiles];
    const visited = new Set(changedFiles);
    let currentRadius = 0;

    while (queue.length > 0 && currentRadius < 5) { // Limit depth to prevent infinite loops
      const levelSize = queue.length;
      currentRadius++;

      for (let i = 0; i < levelSize; i++) {
        const file = queue.shift();
        const dependents = reverseDependencies.get(file) || new Set();

        for (const dependent of dependents) {
          if (!visited.has(dependent)) {
            visited.add(dependent);
            queue.push(dependent);
            affectedFiles.add(dependent);
            
            // Track critical paths (files with many dependents)
            const dependentCount = (reverseDependencies.get(dependent) || new Set()).size;
            if (dependentCount > 5) {
              criticalPaths.push({
                file: dependent,
                dependentCount,
                radius: currentRadius
              });
            }
          }
        }
      }

      if (queue.length > 0) {
        maxRadius = currentRadius;
      }
    }

    return {
      affectedFiles: Array.from(affectedFiles),
      radius: maxRadius,
      criticalPaths: criticalPaths.sort((a, b) => b.dependentCount - a.dependentCount).slice(0, 10)
    };
  }

  getDirectDependencies(changedFiles, dependencies) {
    const directDeps = new Set();
    
    for (const file of changedFiles) {
      const fileDeps = dependencies.get(file) || [];
      fileDeps.forEach(dep => directDeps.add(dep));
    }
    
    return Array.from(directDeps);
  }

  calculateComplexity(impactAnalysis) {
    const { affectedFiles, radius, criticalPaths } = impactAnalysis;
    
    if (radius >= 4 || affectedFiles.length > 50 || criticalPaths.length > 5) {
      return 'very-high';
    } else if (radius >= 3 || affectedFiles.length > 20 || criticalPaths.length > 2) {
      return 'high';
    } else if (radius >= 2 || affectedFiles.length > 5) {
      return 'medium';
    } else if (affectedFiles.length > 0) {
      return 'low';
    } else {
      return 'minimal';
    }
  }

  findPatternMatches(content, patterns) {
    const matches = [];
    
    for (const pattern of patterns) {
      const patternMatches = content.match(pattern) || [];
      matches.push(...patternMatches);
    }
    
    return matches;
  }

  analyzePackageChanges(content) {
    const changes = [];
    
    try {
      const pkg = JSON.parse(content);
      
      // Check for version changes
      if (pkg.version) {
        const versionParts = pkg.version.split('.');
        if (versionParts[0] !== '0' && versionParts[0] !== '1') {
          changes.push({
            type: 'version',
            severity: 'high',
            description: 'Major version change detected',
            file: 'package.json'
          });
        }
      }
      
      // Check for dependency changes
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (Object.keys(deps).length > 0) {
        changes.push({
          type: 'dependencies',
          severity: 'medium',
          description: 'Dependency changes detected',
          file: 'package.json'
        });
      }
      
    } catch (error) {
      // Invalid JSON, skip
    }
    
    return {
      hasBreakingChanges: changes.length > 0,
      changes
    };
  }

  calculateOverallSeverity(breakingChanges) {
    if (breakingChanges.some(change => change.severity === 'critical')) {
      return 'critical';
    } else if (breakingChanges.some(change => change.severity === 'high')) {
      return 'high';
    } else if (breakingChanges.some(change => change.severity === 'medium')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  getBreakingChangeDescription(changeType, matchCount) {
    const descriptions = {
      api: `${matchCount} API interface changes detected`,
      database: `${matchCount} database schema modifications found`,
      config: `${matchCount} configuration changes identified`,
      dependencies: `${matchCount} dependency modifications detected`
    };
    
    return descriptions[changeType] || `${matchCount} changes of type ${changeType}`;
  }

  getBreakingChangeRecommendation(breakingChanges) {
    if (breakingChanges.length === 0) {
      return 'No breaking changes detected. Safe to integrate.';
    }
    
    const hasCritical = breakingChanges.some(change => change.severity === 'critical');
    const hasHigh = breakingChanges.some(change => change.severity === 'high');
    
    if (hasCritical) {
      return 'CRITICAL: Review all changes carefully. Consider creating adaptation branch.';
    } else if (hasHigh) {
      return 'HIGH IMPACT: Thorough testing required. Update integration tests.';
    } else {
      return 'MODERATE IMPACT: Review changes and update documentation as needed.';
    }
  }

  detectHardcodedSecrets(content, file) {
    const secretPatterns = [
      /(?:password|pwd|pass)\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/gi,
      /(?:api[_-]?key|apikey)\s*[:=]\s*['"`][^'"`\s]{16,}['"`]/gi,
      /(?:secret|token)\s*[:=]\s*['"`][^'"`\s]{16,}['"`]/gi,
      /(?:private[_-]?key)\s*[:=]\s*['"`][^'"`\s]{32,}['"`]/gi
    ];
    
    const secrets = [];
    
    for (const pattern of secretPatterns) {
      const matches = content.match(pattern) || [];
      for (const match of matches) {
        secrets.push({
          file,
          category: 'hardcoded-secret',
          severity: 'critical',
          description: 'Potential hardcoded secret detected',
          match: match.substring(0, 50) + '...',
          recommendation: 'Move secrets to environment variables or secure vault'
        });
      }
    }
    
    return {
      hasSecrets: secrets.length > 0,
      secrets
    };
  }

  calculateSecurityRisk(securityIssues) {
    if (securityIssues.some(issue => issue.severity === 'critical')) {
      return 'critical';
    } else if (securityIssues.some(issue => issue.severity === 'high')) {
      return 'high';
    } else if (securityIssues.length > 3) {
      return 'medium';
    } else if (securityIssues.length > 0) {
      return 'low';
    } else {
      return 'none';
    }
  }

  getSecurityRecommendation(category, matchCount) {
    const recommendations = {
      injection: 'Review for code injection vulnerabilities. Use parameterized queries.',
      authentication: 'Verify authentication logic. Ensure secure implementation.',
      cryptography: 'Review cryptographic implementations. Use established libraries.',
      dataExposure: 'Remove or secure logging statements that may expose sensitive data.'
    };
    
    return recommendations[category] || 'Review security implications of these changes.';
  }

  getSecurityRecommendations(securityIssues) {
    const recommendations = new Set();
    
    for (const issue of securityIssues) {
      recommendations.add(issue.recommendation);
    }
    
    return Array.from(recommendations);
  }

  analyzeCodeComplexity(content, file) {
    // Simple complexity analysis based on nesting and patterns
    const lines = content.split('\n');
    let complexity = 0;
    let nestingLevel = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Count nesting
      if (trimmed.includes('{')) nestingLevel++;
      if (trimmed.includes('}')) nestingLevel--;
      
      // Count complexity indicators
      if (/\b(if|else|while|for|switch|case|catch|try)\b/.test(trimmed)) {
        complexity += nestingLevel + 1;
      }
    }
    
    const isComplex = complexity > 50 || nestingLevel > 5;
    
    return {
      isComplex,
      file,
      category: 'complexity',
      impact: 'medium',
      description: `High code complexity detected (score: ${complexity})`,
      recommendation: 'Consider refactoring to reduce complexity'
    };
  }

  calculateOverallPerformanceImpact(performanceIssues) {
    const highImpactCount = performanceIssues.filter(issue => issue.impact === 'high').length;
    const mediumImpactCount = performanceIssues.filter(issue => issue.impact === 'medium').length;
    
    if (highImpactCount > 2) {
      return 'high';
    } else if (highImpactCount > 0 || mediumImpactCount > 5) {
      return 'medium';
    } else if (mediumImpactCount > 0) {
      return 'low';
    } else {
      return 'none';
    }
  }

  getPerformanceRecommendation(category, matchCount) {
    const recommendations = {
      loops: 'Review loop efficiency. Consider optimization for large datasets.',
      database: 'Analyze query performance. Add indexes if needed.',
      memory: 'Monitor memory usage. Consider object pooling for frequent allocations.',
      async: 'Review async patterns. Ensure proper error handling and timeouts.'
    };
    
    return recommendations[category] || 'Monitor performance impact of these changes.';
  }

  getPerformanceRecommendations(performanceIssues) {
    const recommendations = new Set();
    
    for (const issue of performanceIssues) {
      recommendations.add(issue.recommendation);
    }
    
    return Array.from(recommendations);
  }
  // Helper methods for analysis

  extractImports(content) {
    const imports = [];
    
    // ES6 imports
    const es6ImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // CommonJS requires
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  identifyImpactedModules(filesChanged) {
    const modules = new Set();
    
    for (const file of filesChanged) {
      const path = file.toLowerCase();
      
      if (path.includes('core') || path.includes('lib/core')) {
        modules.add('core');
      }
      if (path.includes('api') || path.includes('endpoint') || path.includes('route')) {
        modules.add('api');
      }
      if (path.includes('ui') || path.includes('component') || path.includes('view')) {
        modules.add('ui');
      }
      if (path.includes('auth') || path.includes('login') || path.includes('permission')) {
        modules.add('auth');
      }
      if (path.includes('database') || path.includes('db') || path.includes('model')) {
        modules.add('database');
      }
      if (path.includes('config') || path.includes('setting') || path.includes('.env')) {
        modules.add('config');
      }
      if (path.includes('test') || path.includes('spec')) {
        modules.add('test');
      }
    }
    
    return Array.from(modules);
  }

  analyzeFileForBreakingChanges(file, content) {
    const breakingChanges = [];
    
    // Check each breaking change pattern category
    for (const [category, config] of Object.entries(this.breakingChangePatterns)) {
      for (const pattern of config.patterns) {
        const matches = content.match(pattern);
        if (matches) {
          breakingChanges.push({
            type: category,
            description: `${category} changes detected in ${file}`,
            severity: config.severity,
            matches: matches.length,
            evidence: matches.slice(0, 3) // First 3 matches as evidence
          });
        }
      }
    }
    
    return breakingChanges;
  }

  analyzeFileForSecurity(file, content) {
    const securityIssues = [];
    
    // Check each security pattern category
    for (const [category, config] of Object.entries(this.securityPatterns)) {
      for (const pattern of config.patterns) {
        const matches = content.match(pattern);
        if (matches) {
          securityIssues.push({
            type: category,
            description: config.description,
            severity: config.severity,
            file: file,
            matches: matches.length,
            evidence: matches.slice(0, 2) // First 2 matches as evidence
          });
        }
      }
    }
    
    return securityIssues;
  }

  identifySecurityAreas(filesChanged) {
    const securityAreas = [];
    
    for (const file of filesChanged) {
      const path = file.toLowerCase();
      
      if (path.includes('auth') || path.includes('login') || path.includes('permission')) {
        securityAreas.push('authentication');
      }
      if (path.includes('crypto') || path.includes('encrypt') || path.includes('hash')) {
        securityAreas.push('cryptography');
      }
      if (path.includes('api') || path.includes('endpoint')) {
        securityAreas.push('api-security');
      }
      if (path.includes('config') || path.includes('.env')) {
        securityAreas.push('configuration');
      }
      if (path.includes('upload') || path.includes('file')) {
        securityAreas.push('file-handling');
      }
    }
    
    return [...new Set(securityAreas)];
  }

  generateSecurityRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.securityRisk === 'critical' || analysis.securityRisk === 'high') {
      recommendations.push('Conduct thorough security review before integration');
      recommendations.push('Run automated security scanning tools');
    }
    
    if (analysis.securityAreas.includes('authentication')) {
      recommendations.push('Review authentication flow and session management');
    }
    
    if (analysis.securityAreas.includes('cryptography')) {
      recommendations.push('Verify cryptographic implementations follow best practices');
    }
    
    if (analysis.vulnerabilities.some(v => v.type === 'injection')) {
      recommendations.push('Review for SQL injection and XSS vulnerabilities');
    }
    
    return recommendations;
  }

  analyzeFileForPerformance(file, content) {
    const performanceIssues = [];
    
    // Check each performance pattern category
    for (const [category, config] of Object.entries(this.performancePatterns)) {
      for (const pattern of config.patterns) {
        const matches = content.match(pattern);
        if (matches) {
          performanceIssues.push({
            type: category,
            description: config.description,
            impact: config.impact,
            file: file,
            matches: matches.length,
            evidence: matches.slice(0, 2)
          });
        }
      }
    }
    
    return performanceIssues;
  }

  analyzePerformanceMetrics(filesChanged, analysis) {
    // Memory impact analysis
    const memoryIntensiveFiles = filesChanged.filter(file => 
      file.includes('buffer') || file.includes('stream') || 
      file.includes('cache') || file.includes('memory')
    );
    
    if (memoryIntensiveFiles.length > 0) {
      analysis.metrics.memoryImpact = 'negative';
      analysis.hotspots.push({
        type: 'memory',
        description: 'Memory-intensive operations detected',
        impact: 'high',
        files: memoryIntensiveFiles
      });
    }
    
    // CPU impact analysis
    const cpuIntensiveFiles = filesChanged.filter(file => 
      file.includes('algorithm') || file.includes('compute') || 
      file.includes('process') || file.includes('worker')
    );
    
    if (cpuIntensiveFiles.length > 0) {
      analysis.metrics.cpuImpact = 'negative';
      analysis.hotspots.push({
        type: 'cpu',
        description: 'CPU-intensive operations detected',
        impact: 'high',
        files: cpuIntensiveFiles
      });
    }
    
    // I/O impact analysis
    const ioIntensiveFiles = filesChanged.filter(file => 
      file.includes('file') || file.includes('disk') || 
      file.includes('network') || file.includes('http')
    );
    
    if (ioIntensiveFiles.length > 0) {
      analysis.metrics.ioImpact = 'negative';
      analysis.hotspots.push({
        type: 'io',
        description: 'I/O-intensive operations detected',
        impact: 'medium',
        files: ioIntensiveFiles
      });
    }
  }

  generatePerformanceRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.performanceImpact === 'negative') {
      recommendations.push('Run performance benchmarks before and after integration');
      recommendations.push('Monitor resource usage in production');
    }
    
    if (analysis.metrics.memoryImpact === 'negative') {
      recommendations.push('Review memory allocation patterns and implement proper cleanup');
    }
    
    if (analysis.metrics.cpuImpact === 'negative') {
      recommendations.push('Consider algorithm optimization and async processing');
    }
    
    if (analysis.hotspots.some(h => h.type === 'database')) {
      recommendations.push('Analyze query execution plans and optimize indexes');
    }
    
    if (analysis.requiresPerformanceTest) {
      recommendations.push('Add performance tests to CI/CD pipeline');
    }
    
    return recommendations;
  }
}

export default AdvancedAnalysisSystem;