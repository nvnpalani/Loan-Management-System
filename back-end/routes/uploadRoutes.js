const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: timestamp + original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, limits: { files: 5 } });

// Upload endpoint
router.post('/upload', upload.array('documents', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files were uploaded." });
        }

        // Map files to their public URLs
        const fileUrls = req.files.map(file => `http://localhost:3000/uploads/${file.filename}`);
        
        res.status(200).json({
            message: "Files uploaded successfully",
            urls: fileUrls
        });
    } catch (error) {
        res.status(500).json({ message: "File upload failed", error: error.message });
    }
});

module.exports = router;
