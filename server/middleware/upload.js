import multer from 'multer';
import path from 'path';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    image: /jpeg|jpg|png|gif|webp/,
    document: /pdf|doc|docx|xls|xlsx/
  };

  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  // Check based on fieldname
  if (file.fieldname === 'image' || file.fieldname === 'signature' || file.fieldname === 'seal') {
    if (allowedTypes.image.test(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }

  if (file.fieldname === 'document' || file.fieldname === 'supportingDoc') {
    if (allowedTypes.document.test(ext) || allowedTypes.image.test(ext)) {
      return cb(null, true);
    }
    return cb(new Error('Only documents and images are allowed'));
  }

  cb(null, true);
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
};
