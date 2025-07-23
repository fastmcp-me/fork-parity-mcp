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
        description: 'Memory allocation changes detected'
      }
    };
  }

  /**
   * Analyze dependency chain impact
   */
  analyzeDependencyChain(commitData, repositoryPath) {
    const analysis = {
      directDependencies: [],
      transitiveDependencies: [],
      impactedModules: [],
      riskLevel: 'low',
      packageChanges: [],
      importChanges: []
    };

    const filesChanged = commitData.filesChanged || [];
    
    try {
      // Check for package.json changes
      const packageFiles = filesChanged.filter(file => 
        file.includes('package.json') || file.includes('package-lock.json') || 
        file.includes('yarn.lock') || file.includes('pnpm-lock.yaml')
      );

      if (packageFiles.length > 0) {
        analysis.riskLevel = 'high';
        analysis.packageChanges = packageFiles;
        
        // Try to read package.json to understand dependency changes
        const packageJsonPath = join(repositoryPath, 'package.json');
        if (existsSync(packageJsonPath)) {
          try {
            const packageContent = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
            analysis.directDependencies = Object.keys(packageContent.dependencies || {});
            analysis.transitiveDependencies = Object.keys(packageContent.devDependencies || {});
          } catch (error) {
            // Package.json parsing failed, continue with file analysis
          }
        }
      }

      // Analyze import/require changes in source files
      const sourceFiles = filesChanged.filter(file => 
        /\.(js|ts|jsx|tsx|mjs|cjs)$/.test(file)
      );

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

  /**
   * Identify breaking changes in the commit
   */
  identifyBreakingChanges(commitData, repositoryPath) {
    const analysis = {
      hasBreakingChanges: false,
      breakingChanges: [],
      severity: 'none',
      affectedAreas: [],
      migrationRequired: false
    };

    const filesChanged = commitData.filesChanged || [];
    const message = commitData.message.toLowerCase();

    try {
      // Check commit message for breaking change indicators
      const breakingKeywords = ['breaking', 'breaking change', 'breaking:', 'major:', 'incompatible'];
      const hasBreakingKeyword = breakingKeywords.some(keyword => message.includes(keyword));
      
      if (hasBreakingKeyword) {
        analysis.hasBreakingChanges = true;
        analysis.severity = 'high';
        analysis.breakingChanges.push({
          type: 'explicit',
          description: 'Commit message indicates breaking change',
          evidence: message
        });
      }

      // Analyze file changes for breaking patterns
      for (const file of filesChanged) {
        const filePath = join(repositoryPath, file);
        if (existsSync(filePath)) {
          try {
            const content = readFileSync(filePath, 'utf8');
            const fileBreakingChanges = this.analyzeFileForBreakingChanges(file, content);
            
            if (fileBreakingChanges.length > 0) {
              analysis.hasBreakingChanges = true;
              analysis.breakingChanges.push(...fileBreakingChanges);
              
              // Determine severity
              const criticalChanges = fileBreakingChanges.filter(change => change.severity === 'critical');
              if (criticalChanges.length > 0) {
                analysis.severity = 'critical';
              } else if (analysis.severity !== 'critical') {
                analysis.severity = 'high';
              }
            }
          } catch (error) {
            // File reading failed, skip
          }
        }
      }

      // Determine affected areas
      analysis.affectedAreas = this.identifyImpactedModules(filesChanged);
      
      // Check if migration is required
      analysis.migrationRequired = analysis.breakingChanges.some(change => 
        change.type === 'database' || change.type === 'api' || change.severity === 'critical'
      );

      // Special handling for version files
      const versionFiles = filesChanged.filter(file => 
        file.includes('package.json') || file.includes('version') || file.includes('CHANGELOG')
      );
      
      if (versionFiles.length > 0 && analysis.hasBreakingChanges) {
        analysis.breakingChanges.push({
          type: 'version',
          description: 'Version-related files changed alongside breaking changes',
          files: versionFiles,
          severity: 'medium'
        });
      }

    } catch (error) {
      analysis.error = `Breaking change analysis failed: ${error.message}`;
      analysis.severity = 'unknown';
    }

    return analysis;
  }

  /**
   * Assess security impact of changes
   */
  assessSecurityImpact(commitData, repositoryPath) {
    const analysis = {
      securityRisk: 'low',
      vulnerabilities: [],
      recommendations: [],
      securityAreas: [],
      requiresSecurityReview: false
    };

    const filesChanged = commitData.filesChanged || [];
    const message = commitData.message.toLowerCase();

    try {
      // Check commit message for security keywords
      const securityKeywords = ['security', 'vulnerability', 'cve', 'exploit', 'patch', 'auth', 'permission'];
      const hasSecurityKeyword = securityKeywords.some(keyword => message.includes(keyword));
      
      if (hasSecurityKeyword) {
        analysis.securityRisk = 'high';
        analysis.requiresSecurityReview = true;
        analysis.vulnerabilities.push({
          type: 'explicit',
          description: 'Commit message indicates security-related changes',
          severity: 'high',
          evidence: message
        });
      }

      // Analyze files for security patterns
      for (const file of filesChanged) {
        const filePath = join(repositoryPath, file);
        if (existsSync(filePath)) {
          try {
            const content = readFileSync(filePath, 'utf8');
            const fileSecurityIssues = this.analyzeFileForSecurity(file, content);
            
            if (fileSecurityIssues.length > 0) {
              analysis.vulnerabilities.push(...fileSecurityIssues);
              
              // Update risk level
              const criticalIssues = fileSecurityIssues.filter(issue => issue.severity === 'critical');
              const highIssues = fileSecurityIssues.filter(issue => issue.severity === 'high');
              
              if (criticalIssues.length > 0) {
                analysis.securityRisk = 'critical';
                analysis.requiresSecurityReview = true;
              } else if (highIssues.length > 0 && analysis.securityRisk !== 'critical') {
                analysis.securityRisk = 'high';
                analysis.requiresSecurityReview = true;
              } else if (analysis.securityRisk === 'low') {
                analysis.securityRisk = 'medium';
              }
            }
          } catch (error) {
            // File reading failed, skip
          }
        }
      }

      // Identify security-sensitive areas
      analysis.securityAreas = this.identifySecurityAreas(filesChanged);
      
      // Generate recommendations
      analysis.recommendations = this.generateSecurityRecommendations(analysis);

      // Check for dependency security issues
      const packageFiles = filesChanged.filter(file => 
        file.includes('package.json') || file.includes('requirements.txt') || 
        file.includes('Gemfile') || file.includes('go.mod')
      );
      
      if (packageFiles.length > 0) {
        analysis.vulnerabilities.push({
          type: 'dependency',
          description: 'Dependency changes may introduce security vulnerabilities',
          severity: 'medium',
          files: packageFiles,
          recommendation: 'Run security audit on dependencies'
        });
        
        if (analysis.securityRisk === 'low') {
          analysis.securityRisk = 'medium';
        }
      }

    } catch (error) {
      analysis.error = `Security analysis failed: ${error.message}`;
      analysis.securityRisk = 'unknown';
    }

    return analysis;
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