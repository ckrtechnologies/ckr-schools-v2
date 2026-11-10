import { LiveChatRepository } from './repository.js';

export const getLiveChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.sub || req.user.id;
    const chats = await LiveChatRepository.getLiveChatHistory(req.tenant.id, currentUserId, userId);
    return res.status(200).json({
      success: true,
      message: 'Successfully fetched chat history',
      chats
    });
  } catch (err) {
    next(err);
  }
};

export const getTeachers = async (req, res, next) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
    const currentUserType = req.user.role || req.user.type;
    const teachers = await LiveChatRepository.getTeachers(req.tenant.id, currentUserId, currentUserType);
    return res.status(200).json({ success: true, teachers });
  } catch (err) {
    next(err);
  }
};

export const getStudents = async (req, res, next) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
    const students = await LiveChatRepository.getStudents(req.tenant.id, currentUserId);
    return res.status(200).json({ success: true, students });
  } catch (err) {
    next(err);
  }
};

export const getPrincipal = async (req, res, next) => {
  try {
    const principal = await LiveChatRepository.getPrincipal(req.tenant.id);
    return res.status(200).json({ success: true, principal });
  } catch (err) {
    next(err);
  }
};

export const getLiveChatsList = async (req, res, next) => {
  try {
    const currentUserId = req.user.sub || req.user.id;
    const chats = await LiveChatRepository.getLiveChatsList(req.tenant.id, currentUserId);
    return res.status(200).json({ success: true, chats });
  } catch (err) {
    next(err);
  }
};

