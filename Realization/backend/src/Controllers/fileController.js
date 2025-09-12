const path = require('path');
const fs = require('fs');
const { uploadFile, BUCKETS } = require('../utils/minioClient');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const file = req.file;
    const fileName = `upload-${Date.now()}-${file.originalname}`;
    
    // Загружаем файл в MinIO
    const fileUrl = await uploadFile(BUCKETS.UPLOADS, fileName, file.buffer, file.mimetype);
    
    res.json({
      url: fileUrl,
      name: file.originalname,
      type: file.mimetype,
      size: file.size
    });
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
}; 