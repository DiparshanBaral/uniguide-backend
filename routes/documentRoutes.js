const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/documentController');
const { uploadDocuments } = require('../config/cloudinaryConfig');

// Route to upload a new document
router.post('/upload', uploadDocuments.single('file'), uploadDocument);

// Route to fetch all documents for a specific mentor-student pair
router.get('/', getDocuments);

// Route to delete a specific document
router.delete('/:documentId', deleteDocument);

module.exports = router;