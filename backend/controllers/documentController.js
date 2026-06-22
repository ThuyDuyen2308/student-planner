const fs = require('fs');
const path = require('path');
const documentModel = require('../models/documentModel');

async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
    }

    const { title, subject_name } = req.body;
    if (!title?.trim()) {
      // Clean up uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Document title is required.' });
    }

    let filetype = 'txt';
    if (req.file.mimetype === 'application/pdf') filetype = 'pdf';
    else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') filetype = 'docx';

    const document = await documentModel.create({
      user_id: req.user.id,
      title: title.trim(),
      filename: req.file.filename,
      filepath: req.file.path.replace(/\\/g, '/'),
      filetype,
      filesize: req.file.size,
      subject_name: subject_name?.trim() || null
    });

    res.status(201).json({ message: 'Document uploaded successfully.', document });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error(error);
    res.status(500).json({ message: 'Failed to upload document.' });
  }
}

async function getMyDocuments(req, res) {
  try {
    const documents = await documentModel.findByUserId(req.user.id);
    res.json({ documents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve documents.' });
  }
}

async function downloadDocument(req, res) {
  try {
    const { id } = req.params;
    const document = await documentModel.findById(id);

    if (!document || document.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const absPath = path.resolve(document.filepath);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ message: 'File no longer exists on server.' });
    }

    res.download(absPath, document.filename);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to download document.' });
  }
}

async function deleteDocument(req, res) {
  try {
    const { id } = req.params;
    const document = await documentModel.findById(id);

    if (!document || document.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const absPath = path.resolve(document.filepath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }

    await documentModel.remove(id, req.user.id);
    res.json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete document.' });
  }
}

module.exports = {
  uploadDocument,
  getMyDocuments,
  downloadDocument,
  deleteDocument
};
