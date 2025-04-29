// src/server/api/mqtt/mqtt.js

const mqtt = require('mqtt');
const db = require("../db/db_connection"); // Import database connection

// In-memory store for last-known locations by hardware ID
const locations = {};

const client = mqtt.connect('mqtt://mosquitto:1883', { 
    clean: false,
    clientId: 'server-mqtt-client'  // A stable, consistent client ID
});

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    // Subscribe to status and location updates
    client.subscribe('vm/status/#', { qos: 1 });
    client.subscribe('vm/location/#', { qos: 1 });
});

client.on('error', (error) => {
    console.error('MQTT connection error:', error);
});

// Send notification to vending machine of restock
function notifyDatabaseChange(vendingMachineID) {
    const topic = `vm/restocked/${vendingMachineID}`;
    // qos 1 ensures messages that don't go through will be queued until connection is fixed
    // retain true ensures that the last message sent is stored and sent to new subscribers
    client.publish(topic, `${vendingMachineID} restocked`, { qos: 1, retain: true }); 
    console.log(`Published to ${topic}: ${vendingMachineID} restocked`);
}

// Sends restock notification if VM just finished restocking
async function notifyIfRestock(vendingMachineID) {
    const [results] = await db.query(
        "SELECT vm_mode FROM vending_machines WHERE vm_id = ?", 
        [vendingMachineID]
    );
    if (results[0]?.vm_mode === 'r') {
        notifyDatabaseChange(vendingMachineID);
    }
}

const pendingChecks = {}; // To track ongoing health checks

client.on('message', (topic, message) => {
    const parts = topic.split('/');
    const category = parts[1];
    const hardwareId = parts[2];

    // ── Handle status responses for health checks ───────────────────────────
    if (category === 'status' && hardwareId) {
        const status = message.toString();
        if (pendingChecks[hardwareId]) {
            clearTimeout(pendingChecks[hardwareId].timeout);
            client.unsubscribe(`vm/status/${hardwareId}`);
            pendingChecks[hardwareId].resolve({
                hardwareId,
                status,
                isOnline: status === 'online',
                lastChecked: new Date()
            });
            delete pendingChecks[hardwareId];
        }
    }

    // ── Handle incoming location updates ───────────────────────────────────
    if (category === 'location' && hardwareId) {
        try {
            const loc = JSON.parse(message.toString());
            locations[hardwareId] = {
                lat: loc.lat,
                lng: loc.lng,
                lastUpdated: new Date()
            };
            console.log(`Location updated for ${hardwareId}:`, loc);
        } catch (e) {
            console.error('Invalid location JSON for', topic, e);
        }
    }
});

// Function to check status of a specific client
function healthCheck(hardwareId) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            client.unsubscribe(`vm/status/${hardwareId}`);
            delete pendingChecks[hardwareId];
            resolve({ 
                hardwareId,
                status: 'unknown', 
                isOnline: false,
                error: 'Timeout waiting for status'
            });
        }, 500);

        pendingChecks[hardwareId] = { resolve, reject, timeout };
        client.subscribe(`vm/status/${hardwareId}`, { qos: 1 });
    });
}

// Getter for the last-known location of a vending machine
function getLocation(hardwareId) {
    return locations[hardwareId] || null;
}

module.exports = {
    notifyIfRestock,
    healthCheck,
    getLocation
};
