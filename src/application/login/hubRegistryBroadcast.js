const axios = require('axios').default;

const config = require('../../config');
const loadTools = require('../tools/loadTools');

const c3prLOG4 = require("node-c3pr-logger/c3prLOG4").default;
const lcid = c3prLOG4.lcid();
const euuid = 'init';


function broadcast(summary) {
    const headers = {Authorization: `Bearer ${config.c3pr.auth.jwt}`};

    const expirationTime = new Date(Date.now() + config.c3pr.hub.broadcastTimeoutInMs).toISOString();

    const toolSubmissions = summary.map(tool => {
        return axios.patch(config.c3pr.hub.agentsUrl, {...tool, expiration_time: expirationTime}, {headers})
    });
    Promise.all(
        toolSubmissions
    ).then(({data}) => {
        c3prLOG4(`Successfully broadcasted to registry. URL: ${config.c3pr.hub.agentsUrl}.`, {lcid, euuid, meta: {data, summary}});
    }).catch((error) => {
        c3prLOG4(`Error while broadcasting to registry. URL: ${config.c3pr.hub.agentsUrl}.`, {lcid, euuid, error});
    });
}

function hubRegistryBroadcast() {
    const summary = loadTools.toolsSummary;
    c3prLOG4(`Now broadcasting to C-3PR registry API: ${config.c3pr.hub.agentsUrl}.`, {lcid, euuid, meta: {summary}});
    broadcast(summary);
    setInterval(() => {
        broadcast(summary);
    }, config.c3pr.hub.broadcastIntervalInMs);
}

module.exports = hubRegistryBroadcast;