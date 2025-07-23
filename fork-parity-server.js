#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const UPSTREAM_REMOTE_NAME = process.env.UPSTREAM_REMOTE_NAME || "upstream";
const UPSTREAM_BRANCH = process.env.UPSTREAM_BRANCH || "main";

// Auto-detect repository path
function findGitRepo(startPath = process.cwd()) {
  let currentPath = startPath;

  while (currentPath !== "/") {
    if (existsSync(join(currentPath, ".git"))) {
      return currentPath;
    }
    currentPath = join(currentPath, "..");
  }

  // If no .git found, use the current working directory
  return process.cwd();
}

const REPO_PATH = process.env.REPO_PATH || findGitRepo();
const PARITY_STATUS_FILE = join(REPO_PATH, ".parity-status.json");

class ForkParityServer {
  constructor() {
    this.server = new Server(
      {
        name: "fork-parity-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "check_upstream_changes",
            description: "Check for new commits in the upstream repository",
            inputSchema: {
              type: "object",
              properties: {
                since: {
                  type: "string",
                  description:
                    "Check changes since this date (e.g., '1 week ago', '2023-01-01')",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of commits to show",
                  default: 10,
                },
              },
            },
          },
          {
            name: "analyze_commit",
            description:
              "Analyze a specific upstream commit for compatibility with the fork",
            inputSchema: {
              type: "object",
              properties: {
                commit_hash: {
                  type: "string",
                  description: "The commit hash to analyze",
                },
              },
              required: ["commit_hash"],
            },
          },
          {
            name: "compare_branches",
            description: "Compare the current fork with upstream branch",
            inputSchema: {
              type: "object",
              properties: {
                file_pattern: {
                  type: "string",
                  description:
                    "Optional file pattern to filter comparison (e.g., '*.js', 'src/')",
                },
                context_lines: {
                  type: "number",
                  description: "Number of context lines in diff",
                  default: 3,
                },
              },
            },
          },
          {
            name: "get_parity_status",
            description: "Get the current parity tracking status",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "update_parity_status",
            description: "Update the parity status for a commit",
            inputSchema: {
              type: "object",
              properties: {
                commit_hash: {
                  type: "string",
                  description: "The commit hash to update status for",
                },
                status: {
                  type: "string",
                  enum: ["reviewed", "integrated", "skipped", "conflict"],
                  description: "The status to set for this commit",
                },
                notes: {
                  type: "string",
                  description: "Optional notes about this commit",
                },
              },
              required: ["commit_hash", "status"],
            },
          },
          {
            name: "create_adaptation_plan",
            description:
              "Create a plan for adapting upstream changes to the fork",
            inputSchema: {
              type: "object",
              properties: {
                commit_range: {
                  type: "string",
                  description:
                    "Range of commits to analyze (e.g., 'HEAD~5..HEAD')",
                },
                focus_areas: {
                  type: "array",
                  items: { type: "string" },
                  description:
                    "Specific areas to focus on (e.g., ['authentication', 'api'])",
                },
              },
            },
          },
          {
            name: "fetch_upstream",
            description: "Fetch the latest changes from upstream repository",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "show_config",
            description: "Show current repository and tracking configuration",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "setup_upstream",
            description:
              "Help set up upstream remote and detect the correct branch",
            inputSchema: {
              type: "object",
              properties: {
                upstream_url: {
                  type: "string",
                  description:
                    "URL of the upstream repository (optional if already exists)",
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "check_upstream_changes":
            return await this.checkUpstreamChanges(args);
          case "analyze_commit":
            return await this.analyzeCommit(args);
          case "compare_branches":
            return await this.compareBranches(args);
          case "get_parity_status":
            return await this.getParityStatus();
          case "update_parity_status":
            return await this.updateParityStatus(args);
          case "create_adaptation_plan":
            return await this.createAdaptationPlan(args);
          case "fetch_upstream":
            return await this.fetchUpstream();
          case "show_config":
            return await this.showConfig();
          case "setup_upstream":
            return await this.setupUpstream(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  execGit(command, options = {}) {
    try {
      return execSync(`git ${command}`, {
        cwd: REPO_PATH,
        encoding: "utf8",
        ...options,
      }).trim();
    } catch (error) {
      throw new Error(`Git command failed: ${error.message}`);
    }
  }

  loadParityStatus() {
    if (existsSync(PARITY_STATUS_FILE)) {
      try {
        return JSON.parse(readFileSync(PARITY_STATUS_FILE, "utf8"));
      } catch {
        return { commits: {}, lastUpdated: null };
      }
    }
    return { commits: {}, lastUpdated: null };
  }

  saveParityStatus(status) {
    status.lastUpdated = new Date().toISOString();
    writeFileSync(PARITY_STATUS_FILE, JSON.stringify(status, null, 2));
  }

  async fetchUpstream() {
    try {
      const output = this.execGit(`fetch ${UPSTREAM_REMOTE_NAME}`);
      return {
        content: [
          {
            type: "text",
            text: `Successfully fetched from ${UPSTREAM_REMOTE_NAME}:\n${output || "No output (up to date)"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch from upstream: ${error.message}`,
          },
        ],
      };
    }
  }

  async checkUpstreamChanges(args) {
    const { since, limit = 10 } = args;

    try {
      // First, check if upstream remote exists
      const remotes = this.execGit("remote");
      if (!remotes.includes(UPSTREAM_REMOTE_NAME)) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Upstream remote '${UPSTREAM_REMOTE_NAME}' not found.\n\nAvailable remotes: ${remotes.split("\n").join(", ")}\n\nTo add upstream remote:\ngit remote add ${UPSTREAM_REMOTE_NAME} <upstream-repo-url>`,
            },
          ],
        };
      }

      // Check if the upstream branch exists, try common alternatives
      const possibleBranches = [UPSTREAM_BRANCH, "main", "master", "develop"];
      let actualBranch = null;

      for (const branch of possibleBranches) {
        try {
          this.execGit(`rev-parse --verify ${UPSTREAM_REMOTE_NAME}/${branch}`);
          actualBranch = branch;
          break;
        } catch {
          // Branch doesn't exist, try next one
        }
      }

      if (!actualBranch) {
        // List available upstream branches
        const upstreamBranches = this.execGit(
          `branch -r | grep ${UPSTREAM_REMOTE_NAME}/`,
        );
        return {
          content: [
            {
              type: "text",
              text: `❌ Branch '${UPSTREAM_REMOTE_NAME}/${UPSTREAM_BRANCH}' not found.\n\nAvailable upstream branches:\n${upstreamBranches}\n\nTry fetching first: git fetch ${UPSTREAM_REMOTE_NAME}`,
            },
          ],
        };
      }

      let gitCommand = `log ${UPSTREAM_REMOTE_NAME}/${actualBranch} --oneline --no-merges`;

      if (since) {
        gitCommand += ` --since="${since}"`;
      }

      gitCommand += ` -${limit}`;

      const commits = this.execGit(gitCommand);
      const parityStatus = this.loadParityStatus();

      if (!commits) {
        return {
          content: [
            {
              type: "text",
              text: `No new commits found in ${UPSTREAM_REMOTE_NAME}/${actualBranch}${since ? ` since ${since}` : ""}.`,
            },
          ],
        };
      }

      const commitLines = commits.split("\n");
      let result = `Found ${commitLines.length} commits in ${UPSTREAM_REMOTE_NAME}/${actualBranch}${since ? ` since ${since}` : ""}:\n\n`;

      commitLines.forEach((line) => {
        const hash = line.split(" ")[0];
        const status = parityStatus.commits[hash];
        const statusIcon = status ? this.getStatusIcon(status.status) : "❓";
        result += `${statusIcon} ${line}\n`;
      });

      result += "\n📊 Status Legend:\n";
      result +=
        "✅ Integrated  🔍 Reviewed  ⏭️ Skipped  ⚠️ Conflict  ❓ Not reviewed\n";

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error checking upstream changes: ${error.message}`,
          },
        ],
      };
    }
  }

  getStatusIcon(status) {
    const icons = {
      integrated: "✅",
      reviewed: "🔍",
      skipped: "⏭️",
      conflict: "⚠️",
    };
    return icons[status] || "❓";
  }

  async analyzeCommit(args) {
    const { commit_hash } = args;

    try {
      const commitInfo = this.execGit(`show --stat ${commit_hash}`);
      const commitDiff = this.execGit(`show ${commit_hash} --name-only`);
      const parityStatus = this.loadParityStatus();
      const status = parityStatus.commits[commit_hash];

      let result = `📋 Commit Analysis: ${commit_hash}\n\n`;
      result += `${commitInfo}\n\n`;
      result += `📁 Files changed:\n${commitDiff}\n\n`;

      if (status) {
        result += `📊 Parity Status: ${this.getStatusIcon(status.status)} ${status.status}\n`;
        if (status.notes) {
          result += `📝 Notes: ${status.notes}\n`;
        }
        result += `🕒 Last updated: ${status.timestamp}\n`;
      } else {
        result += "📊 Parity Status: ❓ Not reviewed\n";
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing commit: ${error.message}`,
          },
        ],
      };
    }
  }

  async compareBranches(args) {
    const { file_pattern, context_lines = 3 } = args;

    try {
      let gitCommand = `diff HEAD ${UPSTREAM_REMOTE_NAME}/${UPSTREAM_BRANCH}`;

      if (context_lines !== 3) {
        gitCommand += ` --unified=${context_lines}`;
      }

      if (file_pattern) {
        gitCommand += ` -- ${file_pattern}`;
      }

      const diff = this.execGit(gitCommand);

      if (!diff) {
        return {
          content: [
            {
              type: "text",
              text: `No differences found between current branch and ${UPSTREAM_REMOTE_NAME}/${UPSTREAM_BRANCH}${file_pattern ? ` for pattern: ${file_pattern}` : ""}.`,
            },
          ],
        };
      }

      const summary = this.execGit(
        `diff --stat HEAD ${UPSTREAM_REMOTE_NAME}/${UPSTREAM_BRANCH}${file_pattern ? ` -- ${file_pattern}` : ""}`,
      );

      let result = `📊 Branch Comparison: HEAD vs ${UPSTREAM_REMOTE_NAME}/${UPSTREAM_BRANCH}\n\n`;
      result += `📈 Summary:\n${summary}\n\n`;
      result += `📋 Detailed Diff:\n${diff}`;

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error comparing branches: ${error.message}`,
          },
        ],
      };
    }
  }

  async getParityStatus() {
    try {
      const status = this.loadParityStatus();
      const totalCommits = Object.keys(status.commits).length;

      if (totalCommits === 0) {
        return {
          content: [
            {
              type: "text",
              text: "📊 No parity tracking data found. Start by checking upstream changes and updating commit statuses.",
            },
          ],
        };
      }

      const statusCounts = {};
      Object.values(status.commits).forEach((commit) => {
        statusCounts[commit.status] = (statusCounts[commit.status] || 0) + 1;
      });

      let result = "📊 Parity Status Summary\n\n";
      result += `📈 Total tracked commits: ${totalCommits}\n`;
      result += `🕒 Last updated: ${status.lastUpdated || "Never"}\n\n`;
      result += "📋 Status breakdown:\n";

      Object.entries(statusCounts).forEach(([status, count]) => {
        result += `${this.getStatusIcon(status)} ${status}: ${count}\n`;
      });

      result += "\n📝 Recent commits:\n";
      const recentCommits = Object.entries(status.commits)
        .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
        .slice(0, 5);

      recentCommits.forEach(([hash, data]) => {
        result += `${this.getStatusIcon(data.status)} ${hash.substring(0, 8)} - ${data.status}\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting parity status: ${error.message}`,
          },
        ],
      };
    }
  }

  async updateParityStatus(args) {
    const { commit_hash, status, notes } = args;

    try {
      const parityStatus = this.loadParityStatus();

      parityStatus.commits[commit_hash] = {
        status,
        notes: notes || "",
        timestamp: new Date().toISOString(),
      };

      this.saveParityStatus(parityStatus);

      return {
        content: [
          {
            type: "text",
            text: `✅ Updated parity status for commit ${commit_hash}:\n${this.getStatusIcon(status)} Status: ${status}${notes ? `\n📝 Notes: ${notes}` : ""}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating parity status: ${error.message}`,
          },
        ],
      };
    }
  }

  async createAdaptationPlan(args) {
    const { commit_range, focus_areas = [] } = args;

    try {
      let gitCommand = `log ${UPSTREAM_REMOTE_NAME}/${UPSTREAM_BRANCH}`;

      if (commit_range) {
        gitCommand = `log ${commit_range}`;
      } else {
        gitCommand += " --max-count=5";
      }

      gitCommand += " --oneline --no-merges";

      const commits = this.execGit(gitCommand);
      const parityStatus = this.loadParityStatus();

      if (!commits) {
        return {
          content: [
            {
              type: "text",
              text: "No commits found for the specified range.",
            },
          ],
        };
      }

      let result = "📋 Adaptation Plan\n\n";
      result += `🎯 Target commits: ${commit_range || "Latest 5 commits"}\n`;

      if (focus_areas.length > 0) {
        result += `🔍 Focus areas: ${focus_areas.join(", ")}\n`;
      }

      result += "\n📝 Commits to review:\n\n";

      const commitLines = commits.split("\n");
      commitLines.forEach((line, index) => {
        const hash = line.split(" ")[0];
        const status = parityStatus.commits[hash];
        const statusIcon = status ? this.getStatusIcon(status.status) : "❓";

        result += `${index + 1}. ${statusIcon} ${line}\n`;

        if (status && status.notes) {
          result += `   📝 ${status.notes}\n`;
        }

        if (!status) {
          result += "   ⚡ Action needed: Review and analyze this commit\n";
        }

        result += "\n";
      });

      result += "🚀 Recommended next steps:\n";
      result += "1. Fetch latest upstream changes\n";
      result += "2. Analyze each unreviewed commit\n";
      result += "3. Identify conflicts with fork-specific changes\n";
      result += "4. Create integration branches for complex changes\n";
      result += "5. Update parity status as you progress\n";

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating adaptation plan: ${error.message}`,
          },
        ],
      };
    }
  }

  async showConfig() {
    try {
      const remotes = this.execGit("remote -v");
      const currentBranch = this.execGit("branch --show-current");
      const isGitRepo = existsSync(join(REPO_PATH, ".git"));

      let result = "🔧 Fork Parity Configuration\n\n";
      result += `📁 Repository Path: ${REPO_PATH}\n`;
      result += `📂 Is Git Repository: ${isGitRepo ? "✅ Yes" : "❌ No"}\n`;
      result += `🌿 Current Branch: ${currentBranch}\n`;
      result += `🎯 Tracking: ${UPSTREAM_REMOTE_NAME}/${UPSTREAM_BRANCH}\n\n`;
      result += `📡 Git Remotes:\n${remotes}\n\n`;

      // Check if upstream remote exists
      const hasUpstream = remotes.includes(UPSTREAM_REMOTE_NAME);
      result += `🔍 Upstream Status: ${hasUpstream ? "✅ Found" : "❌ Not found"}\n`;

      if (!hasUpstream) {
        result += "\n⚠️  To set up upstream remote, run:\n";
        result += `git remote add ${UPSTREAM_REMOTE_NAME} <upstream-repo-url>\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error showing config: ${error.message}`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // eslint-disable-next-line no-console
    console.error("Fork Parity MCP server running on stdio");
    // eslint-disable-next-line no-console
    console.error(`Repository: ${REPO_PATH}`);
    // eslint-disable-next-line no-console
    console.error(`Tracking: ${UPSTREAM_REMOTE_NAME}/${UPSTREAM_BRANCH}`);
  }
}

const server = new ForkParityServer();
// eslint-disable-next-line no-console
server.run().catch(console.error);