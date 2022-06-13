const url = require('url');
const https = require('https');

function postMessage(message, callback) {
    'use strict';
    const body = JSON.stringify(message);
    const webHookUrl = process.env.webHookUrl;
    const options = url.parse(webHookUrl);
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    };

    const postReq = https.request(options, (res) => {
        const chunks = [];
        res.setEncoding('utf8');
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
            if (callback) {
                callback({
                    body: chunks.join(''),
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                });
            }
        });
        return res;
    });

    postReq.write(body);
    postReq.end();
}

function processEvent(event, callback) {
    'use strict';
    const message = JSON.parse(event);
    const category = message.finding.category;
    const findingClass = message.finding.findingClass;
    const Explanation = message.finding.description;
    const state = message.finding.state;
    const severity = message.finding.severity;
    const sourceUrl = message.finding.externalUri;
    const projectDisplayName = message.resource.projectDisplayName;
    const eventTime = message.finding.eventTime;
    const eventTimeObj = new Date(eventTime);
    const when = eventTimeObj.toUTCString();

    const googleMessage = {
        cards: [{
            "header": {
                "title": `Google Cloud SCC Alert!`,
                "imageUrl": "https://avatars.githubusercontent.com/u/2810941?s=200&v=4"
            },
            "sections": [{
                "widgets": [{
                        "keyValue": {
                            "topLabel": "Severity",
                            "content": `${severity}`
                        }
                    },
                    {
                        "keyValue": {
                            "topLabel": "Alert Name",
                            "content": `${category}`,
                            "contentMultiline": true
                        }
                    },
                    {
                        "keyValue": {
                            "topLabel": "Finding Class",
                            "content": `${findingClass}`,
                            "contentMultiline": true
                        }
                    },    
                    {
                        "keyValue": {
                            "topLabel": "State",
                            "content": `${state}`,
                            "contentMultiline": true
                        }
                    },
                    {
                        "keyValue": {
                            "topLabel": "Event Time",
                            "content": `${when}`,
                            "contentMultiline": true
                        }
                    },
                    {
                        "keyValue": {
                            "topLabel": "Explanation",
                            "content": `${Explanation}`,
                            "contentMultiline": true
                        }
                    },
                    {
                        "keyValue": {
                            "topLabel": "In Project",
                            "content": `${projectDisplayName}`
                        }
                    },
                    {
                        "keyValue": {
                            "topLabel": "Resource URL",
                            "content": `${sourceUrl}`,
                            "contentMultiline": true,
                            "onClick": {
                                "openLink": {
                                    "url": `${sourceUrl}`
                                }
                            }
                        }
                    }                    
                ]
            }]
        }]
    };

    postMessage(googleMessage, (response) => {
        if (response.statusCode < 400) {
            console.info('Message posted successfully');
            callback(null);
        } else if (response.statusCode < 500) {
            console.error(`Error posting message to Google API: ${response.statusCode} - ${response.statusMessage}`);
            callback(null);
        } else {
            callback(`Server error when processing message: ${response.statusCode} - ${response.statusMessage}`);
        }
    });
}
exports.helloPubSub = (pubsubMessage, _context, callback) => {
    'use strict';
    const event = Buffer.from(pubsubMessage.data, 'base64').toString();
    console.log(event);
    processEvent(event, callback);
};