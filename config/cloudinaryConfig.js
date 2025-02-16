const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cloudinary configuration (ensure these values are loaded from .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage configuration to store the document in Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "affiliation", // Cloudinary folder name where docs will be uploaded
    allowed_formats: ["pdf", "doc", "docx", "jpg", "png"], // Allowed file formats
  },
});

const upload = multer({ storage }); // Multer upload middleware

module.exports = { upload, cloudinary };
