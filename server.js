const express = require('express');
const net = require('net');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DEVICE_PORT = 5000;

app.use(express.json());

app.use(express.static('public'));

let receivedData = [];

app.get('/data', (req, res) => {
    res.json(receivedData);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});

const deviceServer = net.createServer((socket) => {
    console.log(`New connection from ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on('data', (data) => {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - Received data from ${socket.remoteAddress}:${socket.remotePort}:\n${data.toString('hex')}\n`;
        
        console.log(logEntry);

        // Log to file
        fs.appendFile('device_log.txt', logEntry, (err) => {
            if (err) console.error('Error writing to log file:', err);
        });

        try {
            const parsedData = parseDeviceData(data);
            console.log('Parsed data:', parsedData);
            
            receivedData.push(parsedData);
            
            // Keep only the last 100 entries
            if (receivedData.length > 100) {
                receivedData.shift();
            }
            
            fs.appendFile('parsed_log.json', JSON.stringify(parsedData) + '\n', (err) => {
                if (err) console.error('Error writing to parsed log file:', err);
            });
        } catch (error) {
            console.error('Error parsing data:', error);
        }
    });

    socket.on('close', () => {
        console.log(`Connection from ${socket.remoteAddress}:${socket.remotePort} closed`);
    });

    socket.on('error', (err) => {
        console.error(`Error on connection from ${socket.remoteAddress}:${socket.remotePort}:`, err);
    });
});

// Start TCP server
deviceServer.listen(DEVICE_PORT, '0.0.0.0', () => {
    console.log(`TCP Server for device listening on 0.0.0.0:${DEVICE_PORT}`);
});

function parseDeviceData(data) {
    // This is a placeholder function. TODO: Implement the actual parsing logic
    const hexData = data.toString('hex');
    return {
        timestamp: new Date().toISOString(),
        rawData: hexData,
        binStatus: hexData.substr(0, 2),
        temperature: parseInt(hexData.substr(2, 4), 16) / 100,
        batteryLevel: parseInt(hexData.substr(6, 2), 16),
    };
}