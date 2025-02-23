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
    folder: "affiliation", 
    allowed_formats: ["pdf", "doc", "docx", "jpg", "png", "jpeg"], 
    resource_type: "auto",  // Let Cloudinary decide the best type
    access_mode: "public", // Ensures files are publicly accessible
  },
});

// Multer storage configuration for profile pictures
const profilePicStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ProfilePictures", // Folder for profile pictures
    allowed_formats: ["jpg", "jpeg", "webp", "png"], // Allowed formats
    resource_type: "auto", // Let Cloudinary decide the best type
    access_mode: "public", // Ensures files are publicly accessible
  },
});

// Multer storage configuration for university images
const universityImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "universities", // Folder for university images
    allowed_formats: ["jpg", "png", "jpeg", "webp"], // Allowed formats for images
    resource_type: "auto", // Let Cloudinary decide the best type
    access_mode: "public", // Ensures files are publicly accessible
  },
});

const upload = multer({ storage }); // Multer upload middleware

const uploadProfilePic = multer({ storage: profilePicStorage }); //Multer profile pic upload middleware

const uploadUniversityImage = multer({ storage: universityImageStorage });// Multer university image upload middleware

module.exports = { upload, uploadProfilePic, uploadUniversityImage, cloudinary };
