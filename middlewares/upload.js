import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Ensure base upload directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure base upload directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==================== DEFAULT UPLOAD ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);

    let prefix = file.fieldname;
    if (file.fieldname === 'imageIn') prefix = 'punch-in';
    else if (file.fieldname === 'imageOut') prefix = 'punch-out';

    cb(null, `${prefix}-${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype === 'text/csv' ||
    file.originalname.endsWith('.csv') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, CSV, and PDF allowed.'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadImageIn = upload.single('imageIn');
const uploadImageOut = upload.single('imageOut');
const uploadCSV = upload.single('csv');
const uploadMultiple = upload.array('images', 10);

// ==================== DOCUMENT UPLOAD ====================
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/documents/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `doc-${timestamp}-${file.originalname}`);
  }
});

const uploadDocumentFile = multer({
  storage: documentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG files allowed'), false);
  }
}).single('document');

// ==================== PROJECT UPLOAD ====================
const projectStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/projects/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const projectFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const uploadProjectFile = multer({
  storage: projectStorage,
  fileFilter: projectFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'image', maxCount: 1 },
  { name: 'projectName', maxCount: 1 },
  { name: 'budget', maxCount: 1 },
  { name: 'city', maxCount: 1 },
  { name: 'category', maxCount: 1 },
  { name: 'subType', maxCount: 1 },
  { name: 'startDate', maxCount: 1 }
]);

const uploadSingleProjectFile = multer({
  storage: projectStorage,
  fileFilter: projectFileFilter
}).single('image');

// ==================== AUDIO UPLOAD (MP3 ONLY) ====================
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/call-recordings/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `audio-${timestamp}.mp3`); // Force saved file as .mp3
  }
});

const audioFilter = (req, file, cb) => {
  if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
    cb(null, true);
  } else {
    cb(new Error('Only MP3 recordings are allowed!'), false);
  }
};

export const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for audio
}).single('audio');

// ==================== EXPORT EVERYTHING ====================
export {
  upload,
  uploadImageIn,
  uploadImageOut,
  uploadCSV,
  uploadMultiple,
  uploadDocumentFile,
  uploadProjectFile,
  uploadSingleProjectFile
  
};
