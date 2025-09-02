import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Replit Dependency Removal Validator
 * 
 * Scans the entire codebase to ensure all Replit dependencies have been removed
 */

interface ReplitDependency {
  type: 'import' | 'env_var' | 'config' | 'comment' | 'url';
  file: string;
  line: number;
  content: string;
}

class ReplitRemovalValidator {
  private projectRoot: string;
  private findings: ReplitDependency[] = [];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async validate(): Promise<ReplitDependency[]> {
    this.findings = [];

    await this.scanForReplitImports();
    await this.scanForReplitEnvironmentVars();
    await this.scanForReplitConfigs();
    await this.scanForReplitComments();
    await this.scanForReplitUrls();

    return this.findings;
  }

  private async scanForReplitImports() {
    const files = await glob('**/*.{ts,js,tsx,jsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**', '.git/**', 'tests/migration/**']
    });

    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\\n');

      lines.forEach((line, index) => {
        if (line.includes('@replit/') || line.includes('from "replit') || line.includes('import replit')) {
          this.findings.push({
            type: 'import',
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  }

  private async scanForReplitEnvironmentVars() {
    const files = await glob('**/*.{ts,js,tsx,jsx,json}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**', '.git/**', 'tests/migration/**']
    });

    const replitEnvVars = [
      'REPL_ID',
      'REPLIT_DOMAINS', 
      'ISSUER_URL',
      'REPL_OWNER',
      'REPL_SLUG',
      'REPLIT_DB_URL'
    ];

    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\\n');

      lines.forEach((line, index) => {
        replitEnvVars.forEach(envVar => {
          if (line.includes(envVar) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            this.findings.push({
              type: 'env_var',
              file,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      });
    }
  }

  private async scanForReplitConfigs() {
    const configFiles = ['.replit', 'replit.nix', '.replit.toml'];
    
    for (const configFile of configFiles) {
      const configPath = path.join(this.projectRoot, configFile);
      if (fs.existsSync(configPath)) {
        this.findings.push({
          type: 'config',
          file: configFile,
          line: 1,
          content: 'Replit configuration file still exists'
        });
      }
    }
  }

  private async scanForReplitComments() {
    const files = await glob('**/*.{ts,js,tsx,jsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**', '.git/**', 'tests/migration/**']
    });

    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\\n');

      lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        if ((lowerLine.includes('replit') && (line.includes('//') || line.includes('/*') || line.includes('*'))) ||
            lowerLine.includes('required for replit')) {
          this.findings.push({
            type: 'comment',
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  }

  private async scanForReplitUrls() {
    const files = await glob('**/*.{ts,js,tsx,jsx,json,md}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**', '.git/**', 'tests/migration/**']
    });

    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\\n');

      lines.forEach((line, index) => {
        if (line.includes('replit.com') || line.includes('repl.co')) {
          this.findings.push({
            type: 'url',
            file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  }

  generateReport(): string {
    if (this.findings.length === 0) {
      return '✅ No Replit dependencies found. Migration cleanup complete!';
    }

    let report = `❌ Found ${this.findings.length} Replit dependencies that need to be removed:\\n\\n`;

    const groupedFindings = this.findings.reduce((acc, finding) => {
      if (!acc[finding.type]) acc[finding.type] = [];
      acc[finding.type].push(finding);
      return acc;
    }, {} as Record<string, ReplitDependency[]>);

    Object.entries(groupedFindings).forEach(([type, findings]) => {
      report += `### ${type.toUpperCase()} (${findings.length})\\n`;
      findings.forEach(finding => {
        report += `- ${finding.file}:${finding.line} - ${finding.content}\\n`;
      });
      report += '\\n';
    });

    return report;
  }
}

describe('Replit Removal Validation', () => {
  let validator: ReplitRemovalValidator;

  beforeAll(() => {
    validator = new ReplitRemovalValidator();
  });

  it('should have removed all Replit imports', async () => {
    const findings = await validator.validate();
    const importFindings = findings.filter(f => f.type === 'import');
    
    if (importFindings.length > 0) {
      console.warn('Found Replit imports:', importFindings);
    }
    
    expect(importFindings).toHaveLength(0);
  });

  it('should have removed all Replit environment variables', async () => {
    const findings = await validator.validate();
    const envFindings = findings.filter(f => f.type === 'env_var');
    
    if (envFindings.length > 0) {
      console.warn('Found Replit environment variables:', envFindings);
    }
    
    expect(envFindings).toHaveLength(0);
  });

  it('should have removed all Replit configuration files', async () => {
    const findings = await validator.validate();
    const configFindings = findings.filter(f => f.type === 'config');
    
    if (configFindings.length > 0) {
      console.warn('Found Replit configuration files:', configFindings);
    }
    
    expect(configFindings).toHaveLength(0);
  });

  it('should have updated all Replit-related comments', async () => {
    const findings = await validator.validate();
    const commentFindings = findings.filter(f => f.type === 'comment');
    
    if (commentFindings.length > 0) {
      console.warn('Found Replit-related comments:', commentFindings);
    }
    
    // Comments can remain for documentation but should be reviewed
    expect(commentFindings.length).toBeLessThanOrEqual(5);
  });

  it('should have updated all Replit URLs', async () => {
    const findings = await validator.validate();
    const urlFindings = findings.filter(f => f.type === 'url');
    
    if (urlFindings.length > 0) {
      console.warn('Found Replit URLs:', urlFindings);
    }
    
    expect(urlFindings).toHaveLength(0);
  });

  it('should generate comprehensive report', async () => {
    const findings = await validator.validate();
    const report = validator.generateReport();
    
    expect(report).toBeDefined();
    expect(report.length).toBeGreaterThan(0);
    
    console.log('Migration Cleanup Report:');
    console.log(report);
  });
});