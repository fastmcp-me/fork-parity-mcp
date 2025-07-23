// Notification systems for fork parity alerts and updates

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class NotificationSystem {
  constructor(database) {
    this.db = database;
    this.notificationChannels = new Map();
    this.templates = {
      critical: this.getCriticalTemplate(),
      daily: this.getDailyTemplate(),
      integration: this.getIntegrationTemplate(),
      security: this.getSecurityTemplate()
    };
  }

  /**
   * Register notification channels
   */
  registerChannel(name, config) {
    this.notificationChannels.set(name, {
      type: config.type,
      config: config,
      enabled: config.enabled !== false
    });
  }

  /**
   * Send notifications based on parity status
   */
  async sendNotifications(notificationType, data, options = {}) {
    const results = [];
    
    for (const [name, channel] of this.notificationChannels) {
      if (!channel.enabled) continue;
      
      try {
        const result = await this.sendToChannel(channel, notificationType, data, options);
        results.push({ channel: name, success: true, result });
      } catch (error) {
        results.push({ channel: name, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Send to specific channel
   */
  async sendToChannel(channel, notificationType, data, options) {
    const message = this.formatMessage(channel.type, notificationType, data, options);
    
    switch (channel.type) {
      case 'slack':
        return await this.sendSlackMessage(channel.config, message);
      case 'discord':
        return await this.sendDiscordMessage(channel.config, message);
      case 'email':
        return await this.sendEmailMessage(channel.config, message);
      case 'teams':
        return await this.sendTeamsMessage(channel.config, message);
      case 'webhook':
        return await this.sendWebhookMessage(channel.config, message);
      case 'console':
        return this.sendConsoleMessage(message);
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  /**
   * Setup notification channels from configuration
   */
  setupFromConfig(configPath) {
    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }
    
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const notifications = config.notifications || {};
    
    // Setup Slack
    if (notifications.slack && notifications.slack.webhook_url) {
      this.registerChannel('slack', {
        type: 'slack',
        webhook_url: notifications.slack.webhook_url,
        channel: notifications.slack.channel,
        username: notifications.slack.username || 'Fork Parity Bot',
        enabled: notifications.slack.enabled !== false
      });
    }
    
    // Setup Discord
    if (notifications.discord && notifications.discord.webhook_url) {
      this.registerChannel('discord', {
        type: 'discord',
        webhook_url: notifications.discord.webhook_url,
        username: notifications.discord.username || 'Fork Parity Bot',
        enabled: notifications.discord.enabled !== false
      });
    }
    
    // Setup Email
    if (notifications.email && notifications.email.smtp) {
      this.registerChannel('email', {
        type: 'email',
        smtp: notifications.email.smtp,
        from: notifications.email.from,
        to: notifications.email.to,
        enabled: notifications.email.enabled !== false
      });
    }
    
    // Setup Microsoft Teams
    if (notifications.teams && notifications.teams.webhook_url) {
      this.registerChannel('teams', {
        type: 'teams',
        webhook_url: notifications.teams.webhook_url,
        enabled: notifications.teams.enabled !== false
      });
    }
    
    // Setup custom webhooks
    if (notifications.webhooks) {
      for (const [name, webhook] of Object.entries(notifications.webhooks)) {
        this.registerChannel(`webhook-${name}`, {
          type: 'webhook',
          url: webhook.url,
          method: webhook.method || 'POST',
          headers: webhook.headers || {},
          enabled: webhook.enabled !== false
        });
      }
    }
  }

  /**
   * Monitor parity status and send alerts
   */
  async startMonitoring(options = {}) {
    const {
      interval = 3600000, // 1 hour
      criticalThreshold = 1,
      highThreshold = 5,
      repositoryPath = process.cwd()
    } = options;
    
    console.log(`🔔 Starting parity monitoring (interval: ${interval}ms)`);
    
    const monitor = async () => {
      try {
        const repo = this.db.getRepository(repositoryPath);
        if (!repo) {
          console.log('⚠️ Repository not initialized, skipping monitoring');
          return;
        }
        
        const dashboard = this.db.getParityDashboard(repo.id);
        const criticalCount = dashboard.summary.critical_count;
        const highCount = dashboard.summary.high_count;
        
        // Send critical alerts
        if (criticalCount >= criticalThreshold) {
          await this.sendNotifications('critical', {
            repository: repo,
            dashboard,
            criticalCount,
            highCount
          });
        }
        
        // Send high priority alerts
        else if (highCount >= highThreshold) {
          await this.sendNotifications('high', {
            repository: repo,
            dashboard,
            criticalCount,
            highCount
          });
        }
        
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
    };
    
    // Initial check
    await monitor();
    
    // Set up interval
    const intervalId = setInterval(monitor, interval);
    
    return {
      stop: () => clearInterval(intervalId),
      intervalId
    };
  }

  /**
   * Send daily summary notifications
   */
  async sendDailySummary(repositoryPath = process.cwd()) {
    const repo = this.db.getRepository(repositoryPath);
    if (!repo) {
      throw new Error('Repository not initialized');
    }
    
    const dashboard = this.db.getParityDashboard(repo.id);
    const trends = this.calculateTrends(repo.id);
    
    return await this.sendNotifications('daily', {
      repository: repo,
      dashboard,
      trends,
      date: new Date().toISOString().split('T')[0]
    });
  }

  /**
   * Send integration completion notifications
   */
  async sendIntegrationNotification(commitHash, status, metadata = {}) {
    const repositoryPath = metadata.repositoryPath || process.cwd();
    const repo = this.db.getRepository(repositoryPath);
    
    if (!repo) return;
    
    const commit = this.db.getCommit(repo.id, commitHash);
    
    return await this.sendNotifications('integration', {
      repository: repo,
      commit,
      status,
      metadata
    });
  }

  /**
   * Send security alert notifications
   */
  async sendSecurityAlert(securityData, repositoryPath = process.cwd()) {
    const repo = this.db.getRepository(repositoryPath);
    
    return await this.sendNotifications('security', {
      repository: repo,
      securityData,
      timestamp: new Date().toISOString()
    });
  }

  // Channel-specific senders
  async sendSlackMessage(config, message) {
    const payload = {
      text: message.text,
      username: config.username,
      channel: config.channel,
      attachments: message.attachments || []
    };
    
    if (message.blocks) {
      payload.blocks = message.blocks;
    }
    
    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }
    
    return { status: 'sent', platform: 'slack' };
  }

  async sendDiscordMessage(config, message) {
    const payload = {
      content: message.text,
      username: config.username,
      embeds: message.embeds || []
    };
    
    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
    }
    
    return { status: 'sent', platform: 'discord' };
  }

  async sendEmailMessage(config, message) {
    // This would require a proper email library like nodemailer
    // For now, we'll use a simple implementation
    
    const nodemailer = await import('nodemailer').catch(() => null);
    if (!nodemailer) {
      throw new Error('nodemailer not installed. Run: npm install nodemailer');
    }
    
    const transporter = nodemailer.createTransporter(config.smtp);
    
    const mailOptions = {
      from: config.from,
      to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
      subject: message.subject,
      text: message.text,
      html: message.html
    };
    
    const result = await transporter.sendMail(mailOptions);
    return { status: 'sent', platform: 'email', messageId: result.messageId };
  }

  async sendTeamsMessage(config, message) {
    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      'themeColor': message.color || '0076D7',
      'summary': message.summary || message.text,
      'sections': [{
        'activityTitle': message.title || 'Fork Parity Notification',
        'activitySubtitle': message.subtitle || '',
        'text': message.text,
        'facts': message.facts || []
      }]
    };
    
    if (message.actions) {
      payload.potentialAction = message.actions;
    }
    
    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Teams API error: ${response.status} ${response.statusText}`);
    }
    
    return { status: 'sent', platform: 'teams' };
  }

  async sendWebhookMessage(config, message) {
    const response = await fetch(config.url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }
    
    return { status: 'sent', platform: 'webhook', url: config.url };
  }

  sendConsoleMessage(message) {
    console.log('🔔 Fork Parity Notification:');
    console.log(message.text);
    if (message.details) {
      console.log('Details:', message.details);
    }
    return { status: 'sent', platform: 'console' };
  }

  // Message formatters
  formatMessage(channelType, notificationType, data, options) {
    const template = this.templates[notificationType];
    if (!template) {
      throw new Error(`Unknown notification type: ${notificationType}`);
    }
    
    return template[channelType] ? 
      template[channelType](data, options) : 
      template.default(data, options);
  }

  // Message templates
  getCriticalTemplate() {
    return {
      slack: (data) => ({
        text: `🚨 CRITICAL: ${data.criticalCount} critical upstream changes in ${data.repository.path}`,
        attachments: [{
          color: 'danger',
          fields: [
            {
              title: 'Critical Items',
              value: data.criticalCount.toString(),
              short: true
            },
            {
              title: 'High Priority Items',
              value: data.highCount.toString(),
              short: true
            },
            {
              title: 'Repository',
              value: data.repository.path,
              short: false
            }
          ],
          actions: [{
            type: 'button',
            text: 'View Dashboard',
            url: `${data.repository.upstream_url}/compare/${data.repository.fork_branch}...${data.repository.upstream_branch}`
          }]
        }]
      }),
      
      discord: (data) => ({
        text: `🚨 **CRITICAL ALERT**\n${data.criticalCount} critical upstream changes in ${data.repository.path} require immediate attention!`,
        embeds: [{
          title: 'Fork Parity Critical Alert',
          color: 0xFF0000,
          fields: [
            { name: 'Critical Items', value: data.criticalCount.toString(), inline: true },
            { name: 'High Priority Items', value: data.highCount.toString(), inline: true },
            { name: 'Repository', value: data.repository.path, inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      }),
      
      email: (data) => ({
        subject: `🚨 CRITICAL: ${data.criticalCount} critical upstream changes`,
        text: `Critical upstream changes detected in ${data.repository.path}\n\nCritical items: ${data.criticalCount}\nHigh priority items: ${data.highCount}\n\nPlease review immediately.`,
        html: `
          <h2>🚨 Critical Upstream Changes</h2>
          <p>Critical upstream changes detected in <strong>${data.repository.path}</strong></p>
          <ul>
            <li><strong>Critical items:</strong> ${data.criticalCount}</li>
            <li><strong>High priority items:</strong> ${data.highCount}</li>
          </ul>
          <p><strong>Action required:</strong> Please review and integrate these changes immediately.</p>
        `
      }),
      
      teams: (data) => ({
        title: 'Fork Parity Critical Alert',
        subtitle: data.repository.path,
        text: `${data.criticalCount} critical upstream changes require immediate attention`,
        color: 'FF0000',
        facts: [
          { name: 'Critical Items', value: data.criticalCount.toString() },
          { name: 'High Priority Items', value: data.highCount.toString() },
          { name: 'Repository', value: data.repository.path }
        ]
      }),
      
      default: (data) => ({
        text: `🚨 CRITICAL: ${data.criticalCount} critical upstream changes in ${data.repository.path}`,
        details: {
          critical_count: data.criticalCount,
          high_count: data.highCount,
          repository: data.repository.path
        }
      })
    };
  }

  getDailyTemplate() {
    return {
      slack: (data) => ({
        text: `📊 Daily Fork Parity Summary for ${data.repository.path}`,
        attachments: [{
          color: data.dashboard.summary.critical_count > 0 ? 'danger' : 'good',
          fields: [
            {
              title: 'Total Commits',
              value: data.dashboard.summary.total_commits.toString(),
              short: true
            },
            {
              title: 'Integration Rate',
              value: `${Math.round((data.dashboard.summary.integrated_count / data.dashboard.summary.total_commits) * 100)}%`,
              short: true
            },
            {
              title: 'Pending Items',
              value: data.dashboard.summary.pending_count.toString(),
              short: true
            },
            {
              title: 'Critical Items',
              value: data.dashboard.summary.critical_count.toString(),
              short: true
            }
          ]
        }]
      }),
      
      discord: (data) => ({
        text: `📊 **Daily Fork Parity Summary**\n${data.repository.path}`,
        embeds: [{
          title: 'Daily Summary',
          color: data.dashboard.summary.critical_count > 0 ? 0xFF0000 : 0x00FF00,
          fields: [
            { name: 'Total Commits', value: data.dashboard.summary.total_commits.toString(), inline: true },
            { name: 'Integration Rate', value: `${Math.round((data.dashboard.summary.integrated_count / data.dashboard.summary.total_commits) * 100)}%`, inline: true },
            { name: 'Pending Items', value: data.dashboard.summary.pending_count.toString(), inline: true },
            { name: 'Critical Items', value: data.dashboard.summary.critical_count.toString(), inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      }),
      
      default: (data) => ({
        text: `📊 Daily summary: ${data.dashboard.summary.total_commits} total commits, ${data.dashboard.summary.pending_count} pending, ${data.dashboard.summary.critical_count} critical`,
        details: data.dashboard.summary
      })
    };
  }

  getIntegrationTemplate() {
    return {
      slack: (data) => ({
        text: `✅ Integration completed: ${data.commit.hash.substring(0, 8)} - ${data.status}`,
        attachments: [{
          color: data.status === 'integrated' ? 'good' : 'warning',
          fields: [
            {
              title: 'Commit',
              value: `${data.commit.hash.substring(0, 8)} - ${data.commit.message}`,
              short: false
            },
            {
              title: 'Status',
              value: data.status,
              short: true
            },
            {
              title: 'Author',
              value: data.commit.author,
              short: true
            }
          ]
        }]
      }),
      
      default: (data) => ({
        text: `✅ Integration: ${data.commit.hash.substring(0, 8)} - ${data.status}`,
        details: {
          commit: data.commit.hash,
          message: data.commit.message,
          status: data.status,
          author: data.commit.author
        }
      })
    };
  }

  getSecurityTemplate() {
    return {
      slack: (data) => ({
        text: `🛡️ Security Alert: ${data.securityData.issues?.length || 0} security issues detected`,
        attachments: [{
          color: 'warning',
          fields: [
            {
              title: 'Security Issues',
              value: (data.securityData.issues?.length || 0).toString(),
              short: true
            },
            {
              title: 'Risk Level',
              value: data.securityData.overallRisk || 'unknown',
              short: true
            }
          ]
        }]
      }),
      
      default: (data) => ({
        text: `🛡️ Security alert: ${data.securityData.issues?.length || 0} issues detected`,
        details: data.securityData
      })
    };
  }

  // Utility methods
  calculateTrends(repositoryId) {
    const stmt = this.db.db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as commits,
        COUNT(CASE WHEN status = 'integrated' THEN 1 END) as integrated
      FROM commit_status cs
      JOIN commits c ON cs.commit_id = c.id
      WHERE c.repository_id = ? AND cs.created_at >= date('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    return stmt.all(repositoryId);
  }

  /**
   * Create notification configuration template
   */
  createConfigTemplate(outputPath) {
    const template = {
      notifications: {
        slack: {
          enabled: false,
          webhook_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
          channel: '#fork-parity',
          username: 'Fork Parity Bot'
        },
        discord: {
          enabled: false,
          webhook_url: 'https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK',
          username: 'Fork Parity Bot'
        },
        email: {
          enabled: false,
          smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: 'your-email@gmail.com',
              pass: 'your-app-password'
            }
          },
          from: 'fork-parity@yourcompany.com',
          to: ['team@yourcompany.com']
        },
        teams: {
          enabled: false,
          webhook_url: 'https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK'
        },
        webhooks: {
          custom: {
            enabled: false,
            url: 'https://your-custom-webhook.com/fork-parity',
            method: 'POST',
            headers: {
              'Authorization': 'Bearer YOUR_TOKEN'
            }
          }
        }
      },
      monitoring: {
        enabled: true,
        interval: 3600000,
        critical_threshold: 1,
        high_threshold: 5
      },
      daily_summary: {
        enabled: true,
        time: '09:00',
        timezone: 'UTC'
      }
    };
    
    writeFileSync(outputPath, JSON.stringify(template, null, 2));
    return template;
  }
}

export default NotificationSystem;