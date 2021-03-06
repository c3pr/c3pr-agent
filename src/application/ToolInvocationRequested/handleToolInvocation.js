const Semaphore = require('await-semaphore').Semaphore;

const c3prHubRegisterNewEvent = require('node-c3pr-hub-client/events/registerNewEvent').default;

const invokeToolAtGitRepo = require("./invokeToolAtGitRepo");

const config = require('../../config');

const loadTools = require('../tools/loadTools');

const EMPTY_PATCH = require('node-c3pr-git-client/patch/generateGitPatchBase64').EMPTY_PATCH;


function generatePrBody(changed_files, toolPrBody, revision) {
    return (changed_files.length ? toolPrBody : '<no diff>') + `
---

`+
// `This fix was generated in response to commit ${revision}.`
`Esta correção foi gerada durante a análise do commit ${revision}.`
}

async function emitToolInvocationCompleted(toolInvocationRequestedEvent, gitPatchBase64, toolInvocationRequested, _c3prLOG5) {
    const parent = {event_type: toolInvocationRequestedEvent.event_type, uuid: toolInvocationRequestedEvent.uuid};

    const changed_files = [
        ...(gitPatchBase64.files.added || []),
        ...(gitPatchBase64.files.modified || []),
        ...((gitPatchBase64.files.renamed || []).map(renamedFile => renamedFile.from)),
        ...((gitPatchBase64.files.renamed || []).map(renamedFile => renamedFile.to)),
        ...(gitPatchBase64.files.delete || [])
    ];
    const unmodified_files = toolInvocationRequested.files.filter(f => !changed_files.includes(f));

    const tool = loadTools.toolsHash[toolInvocationRequested.tool_id];
    const pr_title = changed_files.length ? tool.pr_title : '<no diff>';
    const pr_body = generatePrBody(changed_files, tool.pr_body, toolInvocationRequested.repository.revision);

    const diff_base64 = gitPatchBase64.patch.hexBase64;

    try {
        let result = await c3prHubRegisterNewEvent(
            {
                event_type: `ToolInvocationCompleted`,
                payload: {
                    parent,
                    changes_committed_root: toolInvocationRequested.changes_committed_root,
                    repository: toolInvocationRequested.repository,
                    changed_files,
                    unmodified_files,
                    pr_title,
                    pr_body,
                    diff_base64
                },
                c3prHubUrl: config.c3pr.hub.c3prHubUrl,
                jwt: config.c3pr.auth.jwt
            },
            _c3prLOG5
        );
        if (changed_files.length) {
            _c3prLOG5(`Tool invocation complete. A patch has been generated and sent.`);
        } else {
            _c3prLOG5(`Tool invocation complete. No patch has been generated.`);
        }
        return {new_status: 'PROCESSED', result};
    } catch (error) {
        const meta = {toolInvocationRequestedEvent, gitPatchBase64, toolInvocationRequested};
        _c3prLOG5(`Error while registering new event: ToolInvocationCompleted.`, {error, meta});
        return {new_status: 'UNPROCESSED', result: {error, meta}};
    }
}

async function emitToolInvocationFailed(toolInvocationRequestedEvent, failure_message, toolInvocationRequested, _c3prLOG5) {
    const meta = {toolInvocationRequestedEvent, failure_message, toolInvocationRequested};
    const parent = {event_type: toolInvocationRequestedEvent.event_type, uuid: toolInvocationRequestedEvent.uuid};

    try {
        let result = await c3prHubRegisterNewEvent(
            {
                event_type: `ToolInvocationFailed`,
                payload: {
                    parent,
                    changes_committed_root: toolInvocationRequested.changes_committed_root,
                    repository: toolInvocationRequested.repository,
                    failure_message
                },
                c3prHubUrl: config.c3pr.hub.c3prHubUrl,
                jwt: config.c3pr.auth.jwt,
            },
            _c3prLOG5
        );

        _c3prLOG5(`Tool invocation failed. Reason: ${failure_message}`, {meta});
        return {new_status: 'PROCESSED', result};
    } catch (error) {
        _c3prLOG5(`Error while registering new event: ToolInvocationFailed.`, {error, meta});
        return {new_status: 'UNPROCESSED', result: {error, meta}};
    }
}

const agentToolExecutionSemaphore = new Semaphore(config.c3pr.agent.numberOfMaxConcurrentToolExecutions);

async function handleToolInvocation(toolInvocationRequestedEvent, c3prLOG5) {
    c3prLOG5 = c3prLOG5({caller_name: 'handleToolInvocation'});
    return agentToolExecutionSemaphore.use(async () => {
        const toolInvocationRequested = toolInvocationRequestedEvent.payload;

        c3prLOG5(`C-3PR Agent received invocation: ${toolInvocationRequested.tool_id}. Files: ${JSON.stringify(toolInvocationRequested.files)}`, {meta: {toolInvocationRequestedEvent}});

        if (!loadTools.toolsHash[toolInvocationRequested.tool_id]) {
            c3prLOG5(`Received tool invocation is not from a tool_id of mine: ${toolInvocationRequested.tool_id}. Skipping.`, {meta: {toolInvocationRequestedEvent}});
            return {skipped: true};
        }

        try {
            let gitPatchBase64 = await invokeToolAtGitRepo(toolInvocationRequested, loadTools, c3prLOG5);
            return await emitToolInvocationCompleted(toolInvocationRequestedEvent, gitPatchBase64, toolInvocationRequested, c3prLOG5);
        } catch (error) {
            await emitToolInvocationFailed(toolInvocationRequestedEvent, error.toString(), toolInvocationRequested, c3prLOG5);
            return await emitToolInvocationCompleted(toolInvocationRequestedEvent, EMPTY_PATCH(), toolInvocationRequested, c3prLOG5);
        }
    });
}

module.exports = handleToolInvocation;