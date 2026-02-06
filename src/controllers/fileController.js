const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const { s3Client, bucketName } = require('../config/s3');

// Get files in a folder
exports.getFiles = async (req, res, next) => {
  try {
    const { parentId } = req.query;
    const userId = req.user._id;

    // Get files
    const files = await File.find({
      userId,
      parentId: parentId || null,
      isDeleted: false,
    }).sort({ type: 1, name: 1 }); // Folders first, then alphabetically

    // Build breadcrumb path
    const path = [];
    if (parentId) {
      let currentFolder = await File.findById(parentId);
      while (currentFolder) {
        path.unshift({ _id: currentFolder._id, name: currentFolder.name });
        if (currentFolder.parentId) {
          currentFolder = await File.findById(currentFolder.parentId);
        } else {
          break;
        }
      }
    }

    res.json({
      success: true,
      files,
      path,
    });
  } catch (error) {
    next(error);
  }
};

// Create folder
exports.createFolder = async (req, res, next) => {
  try {
    const { name, parentId } = req.body;
    const userId = req.user._id;

    // Validate name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required',
      });
    }

    // Check if folder with same name exists in same location
    const existingFolder = await File.findOne({
      userId,
      parentId: parentId || null,
      name: name.trim(),
      type: 'folder',
      isDeleted: false,
    });

    if (existingFolder) {
      return res.status(400).json({
        success: false,
        message: 'A folder with this name already exists',
      });
    }

    // Create folder
    const folder = await File.create({
      name: name.trim(),
      type: 'folder',
      parentId: parentId || null,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

// Upload file to S3
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { parentId } = req.body;
    const userId = req.user._id;
    const file = req.file;

    // Generate unique S3 key
    const fileExtension = file.originalname.split('.').pop();
    const s3Key = `${userId}/${uuidv4()}.${fileExtension}`;

    // Upload to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Save file record to MongoDB
    const fileRecord = await File.create({
      name: file.originalname,
      type: 'file',
      size: file.size,
      mimeType: file.mimetype,
      s3Key,
      s3Url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
      parentId: parentId || null,
      userId,
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: fileRecord,
    });
  } catch (error) {
    next(error);
  }
};

// Get download URL
exports.downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({
      _id: id,
      userId,
      type: 'file',
      isDeleted: false,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Generate presigned URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: file.s3Key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      url,
    });
  } catch (error) {
    next(error);
  }
};

// Rename file/folder
exports.renameFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user._id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const file = await File.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { name: name.trim() },
      { new: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File or folder not found',
      });
    }

    res.json({
      success: true,
      message: 'Renamed successfully',
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

// Delete file/folder
exports.deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const file = await File.findOne({ _id: id, userId, isDeleted: false });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File or folder not found',
      });
    }

    // If it's a file, delete from S3
    if (file.type === 'file' && file.s3Key) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: file.s3Key,
        }));
      } catch (s3Error) {
        console.error('S3 delete error:', s3Error);
      }
    }

    // If it's a folder, recursively delete contents
    if (file.type === 'folder') {
      await deleteRecursive(id, userId);
    }

    // Mark as deleted
    file.isDeleted = true;
    await file.save();

    res.json({
      success: true,
      message: 'Deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to recursively delete folder contents
async function deleteRecursive(folderId, userId) {
  const children = await File.find({
    parentId: folderId,
    userId,
    isDeleted: false,
  });

  for (const child of children) {
    if (child.type === 'folder') {
      await deleteRecursive(child._id, userId);
    } else if (child.s3Key) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: child.s3Key,
        }));
      } catch (s3Error) {
        console.error('S3 delete error:', s3Error);
      }
    }
    child.isDeleted = true;
    await child.save();
  }
}
