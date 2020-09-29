require("dotenv").config();
var cloudinary = require("cloudinary").v2
cloudinary.config();

const video = cloudinary.video('new_collab20200929/new_vonage-cloudinary-video', {
    overlay: {
        public_id: 'subtitles:new_collab20200929/new_vonage-cloudinary-video.en-US.srt'
    },
    controls: true,
    background: 'black',
    color: 'pink',
    gravity: 'north'
})
console.log(video)
