import Status from '../models/status.model.js';
import { response } from '../utils/responseHandler.js';
import { uploadFileToCloudinary } from '../config/cloudinaryConfig.js';

export const createStatus = async (req, res) => {
  const { content, contentType } = req.body;
  const userId = req.user.id;

  try {
    let finalContent = content || null;
    let finalContentType = contentType || 'text';

    if (req.file) {
      const mime = req.file.mimetype;

      if (!mime.startsWith('image/') && !mime.startsWith('video/')) {
        return response(res, 400, 'Only image or video files are allowed');
      }

      const uploadedFile = await uploadFileToCloudinary(req.file.path);

      if (!uploadedFile.secure_url) {
        return response(res, 500, 'File upload failed');
      }

      finalContent = uploadedFile.secure_url;
      finalContentType = mime.startsWith('image/') ? 'image' : 'video';
    } else {
      if (!content || content.trim() === '') {
        return response(res, 400, 'Text message cannot be empty');
      }
      finalContentType = 'text';
    }

    const status = new Status({
      user: userId,
      content: finalContent,
      contentType: finalContentType,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    await status.save();

    const populatedStatus = await Status.findById(status._id)
      .populate('user', 'username profilePicture')
      .populate('viewers', 'username profilePicture');

    return response(res, 201, 'Status created successfully', populatedStatus);
  } catch (error) {
    console.error('Error creating status:', error);
    return response(res, 500, 'Internal server error');
  }
};

export const getStatuses = async (req, res) => {
  const userId = req.user.id;

  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
      user: { $ne: userId },
    })
      .populate('user', 'username profilePicture')
      .populate('viewers', 'username profilePicture')
      .sort({ createdAt: -1 });
    return response(res, 200, 'Statuses retrieved successfully', statuses);
  } catch (error) {
    console.error('Error retrieving statuses:', error);
    return response(res, 500, 'Internal server error');
  }
};

const viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.id;
  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, 'Status not found');
    }
    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);
      await status.save();
    } else {
      console.log('User has already viewed this status');
    }
    const updatedStatus = await Status.findById(statusId)
        .populate('user', 'username profilePicture')
        .populate('viewers', 'username profilePicture');
    return response(res, 200, 'Status viewed successfully', updatedStatus);
  } catch (error) {
    console.error('Error viewing status:', error);
    return response(res, 500, 'Internal server error');
  }
};

export const deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.id;
  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, 'Status not found');
    }
    if (status.user.toString() !== userId) {
      return response(res, 403, 'You are not authorized to delete this status');
    }
    await Status.findByIdAndDelete(statusId);
    return response(res, 200, 'Status deleted successfully');
  } catch (error) {
    console.error('Error deleting status:', error);
    return response(res, 500, 'Internal server error');
  }
};
export { createStatus, getStatuses, viewStatus, deleteStatus };
