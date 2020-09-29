require("dotenv").config();
const express = require('express');
const app = express();
const port = 3000;
const OpenTok = require("opentok");
const OT = new OpenTok(process.env.API_KEY, process.env.API_SECRET)
var cloudinary = require("cloudinary").v2
const formidable = require("formidable");

cloudinary.config();

app.use(express.static("public"));
app.use(express.json());
// app.use(formidable);

let sessions = {};

app.get("/", (request, response) => {
    response.sendFile(__dirname + "/views/landing.html");
});

app.get("/session/participant/:room", (request, response) => {
    response.sendFile(__dirname + "/views/index.html");
})

app.post("/session/participant/:room", (request, response) => {
    const roomName = request.params.room;
    const streamName = request.params.username;
    // check if the session already exists
    if (sessions[roomName]) {
        // generate the token 
        generatePublisherToken(roomName, streamName, response);
    } else {
        // create a session! 
        OT.createSession({ mediaMode: "routed" }, (error, session) => {
            if (error) {
                console.log(error);
            } else {
                // store the session in the sessions object
                sessions[roomName] = session.sessionId;
                // generate the token
                generatePublisherToken(roomName, streamName, response)
            }
        }
        )
    }
})

app.post('/archive/start', (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, (err, fields) => {
        if (err) {
            next(err);
            return;
        }
        let archiveName = "Vonage + Cloudinary Video Archive"

        for (const roomName in sessions) {
            if (sessions[roomName] == fields.sessionId) {
                archiveName = "Vonage + Cloudinary Video Archive for " + roomName
            }
        }
        const archiveOptions = {
            name: archiveName
        };

        OT.startArchive(fields.sessionId, archiveOptions, (err, archive) => {
            if (err) {
                return res.status(500).send('Could not start archive for session ' + fields.sessionId + '. error=' + err.message);
            }
            return res.send(archive);
        });
    });
});

app.post('/archive/stop/:archiveId', (req, res) => {
    var archiveId = req.params['archiveId'];
    OT.stopArchive(archiveId, function (err, archive) {
        if (err) return res.status(500).send('Could not stop archive ' + archiveId + '. error=' + err.message);
        return res.json(archive);
    });
});

app.get('/download/:archiveId', (req, res) => {
    var archiveId = req.params['archiveId'];
    OT.getArchive(archiveId, (err, archive) => {
        if (err) return res.status(500).send('Could not get archive ' + archiveId + '. error=' + err.message);
        cloudinary.uploader.upload(archive.url, {
            resource_type: 'video',
            public_id: 'new_vonage-cloudinary-video',
            raw_convert: 'google_speech:srt:vtt',
            categorization: 'google_video_tagging',
            folder: 'new_collab20200929',
            auto_tagging: 0.6,
            notification_url: 'https://webhook.site/0b500683-d59a-499e-a275-234b14ac7f52'
        })
            .then(result => {
                console.log(JSON.stringify(null, 2, result))
                return res.send(result.secure_url);
            })
            .catch(error => {
                console.log(error)
                return res.send(error)
            })
        // https://webhook.site/0b500683-d59a-499e-a275-234b14ac7f52

    });
});


function generatePublisherToken(roomName, streamName, response) {
    // configure token options
    const tokenOptions = {
        role: "publisher",
        data: `roomname = ${roomName} ? streamname = ${streamName}`
    };
    // generate token with OpenTok SDK
    let token = OT.generateToken(
        sessions[roomName],
        tokenOptions
    );
    // send creds to the client 
    response.status(200);
    response.send({
        sessionId: sessions[roomName],
        token: token,
        apiKey: process.env.API_KEY,
        streamName: streamName
    });
}

function generateSubscriberToken(roomName, response) {
    // Configure token options
    const tokenOptions = {
        role: "subscriber",
        data: `roomname = ${roomName}`
    };
    // Generate token with the OpenTok SDK
    let token = OT.generateToken(
        sessions[roomName],
        tokenOptions
    );
    // Send the required credentials back to to the client
    // as a response from the fetch request
    response.status(200);
    response.send({
        sessionId: sessions[roomName],
        token: token,
        apiKey: process.env.API_KEY
    });
}


const listener = app.listen(port, () => {
    console.log("Your app is listening on port" + listener.address().port)
});
