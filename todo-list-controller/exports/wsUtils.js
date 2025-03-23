const WebSocket = require('ws');
const utils = require("./util")

const wsClients = {
    donor_infos: new Map()
};

const addClient = (group, clientId, ws) => {
    if (!wsClients[group].has(clientId)) {
        wsClients[group].set(clientId, new Set());
    }
    wsClients[group].get(clientId).add(ws);

    return true;
}

const removeClient = (group, ws) => {
    // Check if the group exists
    if (wsClients[group]) {
        wsClients[group].forEach((connections, clientId) => {
            if (connections.has(ws)) {
                connections.delete(ws); // Remove the specific WebSocket
                console.log(`WebSocket connection removed for client ID: ${clientId}`);

                // If no more connections for this client, delete the clientId entry
                if (connections.size === 0) {
                    wsClients[group].delete(clientId);
                    console.log(`No more connections for client ID: ${clientId}. Entry removed.`);
                }
            }
        });
    }

    return true;
}

// Helper function to broadcast to all WebSocket clients
const broadcastClients = (group, targetClentId, message) => {
    if (wsClients[group]) {
        wsClients[group].forEach((connections, clientId) => {
            // If targeting a specific clientId, skip others
            if (targetClentId !== null && !utils.compareStr(clientId, targetClentId)) {
                return;
            }

            // WebSocket.OPEN
            connections.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ clientId, ...message }));
                }
            });
        });
    }

    return true;
}

const disconnectedClients = () => {
    Object.keys(wsClients).forEach((group) => {
        wsClients[group].forEach((connections, clientId) => {
            connections.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                    console.log(`Disconnected client ${clientId} in group ${group}`);
                }
            });
        });

        // Clear the group after disconnecting all clients
        wsClients[group].clear();
    });

    console.log("All WebSocket clients disconnected.");
    return true;
};

module.exports = {
    disconnectedClients, broadcastClients,
    removeClient, addClient
}