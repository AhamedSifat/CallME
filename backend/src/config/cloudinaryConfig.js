import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

import fs from 'fs';
config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = (file) => {
  const option = {
    resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
  };

  return new Promise((resolve, reject) => {
    const uploader = file.mimetype.startsWith('video')
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    uploader(file.path, option)
      .then((result) => {
        fs.unlinkSync(file.path);
        resolve(result);
      })
      .catch((error) => reject(error));
  });
};

export { uploadFileToCloudinary };
