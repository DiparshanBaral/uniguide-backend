const { Document } = require('../models/documentModel');
const cloudinary = require('../config/cloudinaryConfig').cloudinary;
const multer = require('multer');
const upload = multer({ storage: require('../config/cloudinaryConfig').storage });

// Upload a new document
const uploadDocument = async (req, res) => {
    try {
      const { studentId, mentorId, documentName } = req.body;
  
      // Validate required fields
      if (!studentId || !mentorId || !documentName || !req.file) {
        return res.status(400).json({ error: 'All fields and file are required' });
      }
  
      // Get the uploaded file's Cloudinary URL
      const documentUrl = req.file.path;
  
      // Save the document details to the database
      const newDocument = new Document({
        studentId,
        mentorId,
        documentName,
        documentUrl,
      });
  
      await newDocument.save();
  
      res.status(201).json({ message: 'Document uploaded successfully', document: newDocument });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: error.message || 'An error occurred while uploading the document' });
    }
  };

// Get all documents for a specific mentor-student pair
const getDocuments = async (req, res) => {
  try {
    const { studentId, mentorId } = req.query;

    // Validate required fields
    if (!studentId || !mentorId) {
      return res.status(400).json({ error: 'Student ID and Mentor ID are required' });
    }

    // Fetch documents for the specified mentor-student pair
    const documents = await Document.find({ studentId, mentorId }).sort({ uploadedAt: -1 });

    res.status(200).json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message || 'An error occurred while fetching documents' });
  }
};

// Delete a specific document
const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Find the document by ID
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Extract the public ID from the document URL
    const publicId = document.documentUrl.split('/').pop().split('.')[0];

    // Delete the document from Cloudinary
    await cloudinary.uploader.destroy(`affiliation/${publicId}`, { resource_type: 'auto' });

    // Delete the document record from the database
    await Document.findByIdAndDelete(documentId);

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message || 'An error occurred while deleting the document' });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument,
};