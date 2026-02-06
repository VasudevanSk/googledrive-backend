const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

router.get('/', fileController.getFiles);
router.post('/folder', fileController.createFolder);
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/download/:id', fileController.downloadFile);
router.patch('/:id', fileController.renameFile);
router.delete('/:id', fileController.deleteFile);

module.exports = router;
