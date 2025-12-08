import multer from 'multer';

const multerMiddleware = multer({ dest: 'uploads/' }).single('media');
export { multerMiddleware };
