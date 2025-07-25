const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../Controllers/fileController');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../static/uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    req.savedOriginalName = file.originalname;
    cb(null, base + '-' + unique + ext);
  }
});
const upload = multer({ storage });

router.post('/upload', upload.single('file'), fileController.uploadFile);

router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../static/uploads', filename);
  const originalName = req.query.name ? decodeURIComponent(req.query.name) : filename;
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

module.exports = router; 