let stream = null;
let archiveID = null
let sessionId = null


fetch(location.pathname, { method: "POST" })
    .then(res => {
        return res.json()
    })
    .then(res => {
        const apiKey = res.apiKey;
        sessionId = res.sessionId;
        const token = res.token;
        const streamName = res.streamName;
        stream = initializeSession(apiKey, sessionId, token, streamName);
    })
    .catch(handleCallback);


function initializeSession(apiKey, sessionId, token, streamName) {
    // create a session object with the sessionId
    const session = OT.initSession(apiKey, sessionId);

    // create a publisher 
    const publisher = OT.initPublisher(
        "publisher", // should match the ID of the element in the HTML
        {
            insertMode: "append",
            width: "100%",
            height: "100%",
            name: streamName
        },
        handleCallback
    );

    // connect to the session
    session.connect(token, error => {
        // if connection is successful, initialize the publisher and publish session
        if (error) {
            handleCallback(error);
        } else {
            session.publish(publisher, handleCallback)
        }
    });

    // subscribe to a newly created stream
    session.on("streamCreated", event => {
        session.subscribe(
            event.stream,
            "subscriber",
            {
                insertMode: "append",
                width: "100%",
                height: "100%",
                name: event.stream.name
            },
            handleCallback
        );
    })

    session.on('archiveStarted', event => {
        archiveID = event.id;
        console.log('Archive started ' + archiveID);
    })

    session.on('archiveStopped', event => {
        archiveID = event.id;
        console.log('Archive stopped ' + archiveID);
    });



    return publisher
}

async function startArchive() {
    const body = new FormData()
    body.append('sessionId', sessionId)
    const response = await fetch('/archive/start', {
        method: "POST",
        body: body
    })
    const data = await response.json()
    archiveID = data.id
}

function stopArchive() {
    fetch('/archive/stop/' + archiveID, {
        method: "POST"
    })
}

async function saveArchive() {
    const response = await fetch('/download/' + archiveID)
    console.log(`Archive Download ${await response.text()}`)
}

// callback handler
function handleCallback(error) {
    if (error) {
        console.log("error: " + error.message);
    } else {
        console.log("callback success");
    }
}
