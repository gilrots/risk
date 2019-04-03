const Utils = require('../common/utils');
const express = require('express');
const _ = require('lodash');
const bodyParser = require('body-parser');
const mockData = (require('../mocks/mock-table.json')).data;
const config = require('../common/config.json').server;
const { api, mock, port } = config.bankService;
const serverUrl = `http://localhost:${config.port}${config.api.bankPost}`;
const cycle = { inc: 0, length: mockData.length };

function newDataArrived(req, res) {
    try {
        res.json(true);
        sendDataToServer(req.body);
        const { securityID, AcntNo, Bank } = req.body;
        console.log("New data:", { id: securityID, account: AcntNo, bank: Bank });
    }
    catch (e) {
        console.error(`Error at updating:`, e);
    }
};

function sendDataToServer(data) {
    Utils.postJson(serverUrl, data).then(x => { console.log(x) }).catch(e => console.log(e.message));;
}

function getMockStock() {
    const stock = mockData[cycle.inc];
    cycle.inc = (cycle.inc + 1) % cycle.length;
    return stock;
}

if (mock.allow) {
    setInterval(() => sendDataToServer(getMockStock()), mock.interval);
    console.log(`Mock Server is up, interval is ${mock.interval} millis`);
}
else {
    const app = express();
    app.use(bodyParser.json());
    app.post(api, newDataArrived);
    app.listen(port, () => console.log(`Server is up on port: ${port}`));
}
