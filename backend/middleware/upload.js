const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'uploads/driver-documents/';
    if (file.fieldname === 'aadharFile') folder += 'aadhar/';
    else if (file.fieldname === 'licenseFile') folder += 'license/';
    else if (file.fieldname === 'selfieFile') folder += 'selfie/';
    ensureDir(path.join(__dirname, '..', folder));
    cb(null, path.join(__dirname, '..', folder));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    // Accept images and pdfs only
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .jpg, .png, .pdf files allowed!'));
    }
  }
});

module.exports = upload;
