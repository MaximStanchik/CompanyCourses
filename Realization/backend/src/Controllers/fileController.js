const path = require('path');
const fs = require('fs');

// Папка для загрузки
const UPLOAD_DIR = path.join(__dirname, '../../static/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

exports.uploadFile = (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const file = req.file;
  const url = `/${file.filename}`;
  res.json({
    url,
    name: file.originalname,
    type: file.mimetype,
    size: file.size
  });
}; 