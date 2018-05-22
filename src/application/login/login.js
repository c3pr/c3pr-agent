const config = require('../../config');

const c3prHubClient = require('node-c3pr-hub-client/login').c3prHubClient;

const hubRegistryBroadcast = require('./hubRegistryBroadcast');

c3prHubClient.login({
    loginUrl: config.c3pr.hub.loginUrl,
    subscriptions: [
        {eventType: "ToolInvocationRequested", callbackUrl: config.c3pr.agent.agentUrl + config.c3pr.brain.ChangesCommittedCallbackUrl}
    ],
    logMetas: [{nodeName: 'c3pr-agent', moduleName: 'login'}]
}).then(jwt => {
    config.c3pr.auth.jwt = jwt;

    hubRegistryBroadcast();
}).catch(e => {
    throw e;
});