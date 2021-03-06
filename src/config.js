const os = require("os");
const hubClientConfig = require('node-c3pr-hub-client').hubClientConfig;

const C3PR_HUB_URL = process.env.C3PR_HUB_URL || (require("is-docker")() ? `http://host.docker.internal:7300` : `http://${os.hostname()}:7300`);
const C3PR_AGENT_URL = process.env.C3PR_AGENT_URL || `http://${os.hostname()}:5003`;

// The env variables below are typically set at build time in the Dockerfile
const C3PR_AGENT_TOOLS_PATH = process.env.C3PR_AGENT_TOOLS_PATH || `/c3pr/agent/tools`;
const C3PR_AGENT_ID = process.env.C3PR_AGENT_ID;
const C3PR_CLONE_DIR = process.env.C3PR_CLONE_DIR || '/tmp/c3pr/clones';
const C3PR_CLONE_DEPTH = process.env.C3PR_CLONE_DEPTH || 50;

const C3PR_GIT_BOT_USER_USERNAME = process.env.C3PR_GIT_BOT_USER_USERNAME || 'c3pr-bot';
const C3PR_GIT_BOT_USER_EMAIL = process.env.C3PR_GIT_BOT_USER_EMAIL || 'c3prbot@gmail.com';

const C3PR_AGENT_MAX_CONCURRENT_EXECUTIONS = process.env.C3PR_AGENT_MAX_CONCURRENT_EXECUTIONS || 4;

const config = {
    c3pr: {
        auth: {
            jwt: null
        },
        hub:{
            c3prHubUrl: C3PR_HUB_URL,
            loginUrl: `${C3PR_HUB_URL}/api/v1/login`,
            agentsUrl: `${C3PR_HUB_URL}/api/v1/agents`,

            broadcastTimeoutInMs: 10 * 60 * 60 * 1000, // 10 hours
            broadcastIntervalInMs: 8 * 60 * 60 * 1000, // 8 hours
        },
        agent: {
            agentToolsPath: C3PR_AGENT_TOOLS_PATH,
            agentUrl: C3PR_AGENT_URL,
            port: require('url').parse(C3PR_AGENT_URL).port || 80,
            agentId: C3PR_AGENT_ID,
            cloneDir: C3PR_CLONE_DIR,
            cloneDepth: C3PR_CLONE_DEPTH,

            numberOfMaxConcurrentToolExecutions: C3PR_AGENT_MAX_CONCURRENT_EXECUTIONS,

            gitUserName: C3PR_GIT_BOT_USER_USERNAME,
            gitUserEmail: C3PR_GIT_BOT_USER_EMAIL,

            ToolInvocationRequestedCallbackUrl: `/callbacks/ToolInvocationRequested`
        }
    }
};

hubClientConfig.init(C3PR_HUB_URL, () => config.c3pr.auth.jwt);
module.exports = config;