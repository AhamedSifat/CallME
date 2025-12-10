import { uploadFileToCloudinary } from '../config/cloudinaryConfig.js';
import Conversation from '../models/conversation.model.js';
import { response } from '../utils/responseHandler.js';
import Message from '../models/message.model.js';

const sendMessage = async (req, res) => {
  const { senderId, receiverId, content, messageStatus } = req.body;

  try {
    const participants = [senderId, receiverId];
    let conversation = await Conversation.findOne({
      participants: { $all: participants },
    });

    if (!conversation) {
      conversation = new Conversation({ participants });
      await conversation.save();
    }

    let imageOrVideoUrl = null;
    let contentType = 'text';

    if (req.file) {
      const mime = req.file.mimetype;

      if (!mime.startsWith('image/') && !mime.startsWith('video/')) {
        return response(res, 400, 'Only image or video files are allowed');
      }

      const uploadedFile = await uploadFileToCloudinary(req.file.path);

      if (!uploadedFile.secure_url) {
        return response(res, 500, 'File upload failed');
      }

      imageOrVideoUrl = uploadedFile.secure_url;
      contentType = mime.startsWith('image/') ? 'image' : 'video';
    } else {
      if (!content || content.trim() === '') {
        return response(res, 400, 'Text message cannot be empty');
      }
      contentType = 'text';
    }

    const message = new Message({
      conversation: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
      imageOrVideoUrl,
      contentType,
      messageStatus,
    });
    await message.save();
    if (message.contentType === 'text') {
      conversation.lastMessage = message._id;
    }
    conversation.unreadCounts += 1;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture');

    return response(res, 200, 'Message sent successfully', populatedMessage);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'Server error', error.message);
  }
};

const getConversation = async (req, res) => {
  const userId = req.user.id;
  try {
    let conversation = await Conversation.find({
      participants: userId,
    })
      .populate({
        path: 'participants',
        select: 'username profilePicture',
      })
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender receiver',
          select: 'username profilePicture',
        },
      })
      .sort({ updatedAt: -1 });

    if (!conversation) {
      return response(res, 200, 'No conversation found', []);
    }

    return response(res, 200, 'Conversations got successfully', conversation);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'Server error', error.message);
  }
};

const getMessagesByConversationId = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return response(res, 404, 'Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      return response(res, 403, 'Access denied to this conversation');
    }
    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username profilePicture')
      .populate('receiver', 'username profilePicture')
      .sort({ createdAt: 1 });

    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        messageStatus: { $in: ['send', 'delivered'] },
      },
      { $set: { messageStatus: 'read' } }
    );

    conversation.unreadCounts = 0;
    await conversation.save();
    return response(res, 200, 'Messages retrieved successfully', messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'Server error', error.message);
  }
};

const markMessagesAsRead = async (req, res) => {
  const { messageId } = req.body;
  const userId = req.user.id;
  try {
    const message = await Message.find({
      _id: { $in: messageId },
      receiver: userId,
    });
    if (!message) {
      return response(res, 404, 'Message not found');
    }
    if (message.receiver.toString() !== userId) {
      return response(
        res,
        403,
        'You are not authorized to update this message'
      );
    }

    await Message.updateMany(
      { _id: { $in: messageId }, receiver: userId },

      { $set: { messageStatus: 'read' } }
    );
    return response(res, 200, 'Message marked as read successfully', message);
  } catch (error) {
    console.error(error);
    return response(res, 500, 'Server error', error.message);
  }
};

const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, 'Message not found');
    }
    if (message.sender.toString() !== userId) {
      return response(
        res,
        403,
        'You are not authorized to delete this message'
      );
    }
    await Message.findByIdAndDelete(messageId);
    return response(res, 200, 'Message deleted successfully');
  } catch (error) {
    console.error(error);
    return response(res, 500, 'Server error', error.message);
  }
};

export {
  sendMessage,
  getConversation,
  getMessagesByConversationId,
  markMessagesAsRead,
  deleteMessage,
};
