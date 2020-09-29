require("dotenv").config();
var cloudinary = require("cloudinary").v2
cloudinary.config();

const url = cloudinary.url('new_collab20200929/new_vonage-cloudinary-video.vtt', {
    resource_type: 'raw'
})
console.log(url)