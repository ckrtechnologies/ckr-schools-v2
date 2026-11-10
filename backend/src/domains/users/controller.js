import { UserService } from './service.js';

export const getUsers = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const { type } = req.query;
    const users = await UserService.getUsers(tenantId, { type });
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    if (!tenantId || !id) {
      return res.status(400).json({ success: false, message: 'User ID and tenant context required' });
    }

    const user = await UserService.getUserById(tenantId, id);
    return res.status(200).json({ success: true, user, data: user });
  } catch (err) {
    next(err);
  }
};

export const getMySelf = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.user?.id || req.user?.sub;
    if (!tenantId || !userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    const user = await UserService.getUserById(tenantId, userId);
    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      mySelf: user
    });
  } catch (err) {
    next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    // Support both direct payload and { data: {...} } envelope from Vision frontend
    const userData = req.body.data || req.body;
    if (!userData || Object.keys(userData).length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    const newUser = await UserService.createUser(tenantId, userData);
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant context required' });
    }

    const userData = req.body.data || req.body;
    const id = req.params.id || userData?.id;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    await UserService.updateUser(tenantId, { ...userData, id });
    return res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    if (!tenantId || !id) {
      return res.status(400).json({ success: false, message: 'User ID and tenant context required' });
    }

    await UserService.deleteUser(tenantId, id);
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const bulkDeleteUsers = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const { userIds } = req.body;
    if (!tenantId || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'userIds array is required' });
    }

    const result = await UserService.bulkDeleteUsers(tenantId, userIds);
    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} users deleted successfully`
    });
  } catch (err) {
    next(err);
  }
};

export const uploadBulkUser = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body.data || req.body;
    if (!tenantId || !Array.isArray(data)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    const createdUsers = await UserService.uploadBulkUser(tenantId, data);
    return res.status(200).json({
      success: true,
      message: `${createdUsers.length} users created successfully`
    });
  } catch (err) {
    next(err);
  }
};

export const forgetPassword = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const data = req.body.data || req.body;
    const { email, phone, password } = data;
    await UserService.forgetPassword(tenantId, email, phone, password);
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    next(err);
  }
};

export const updateNotification = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const { id } = req.params;
    await UserService.updateNotification(tenantId, id);
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    next(err);
  }
};

export const getTeacherWeek = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const teacherWeekId = await UserService.getTeacherWeek(tenantId);
    return res.status(200).json({ teacherWeekId });
  } catch (err) {
    next(err);
  }
};

export const getTopper = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const { topper, score } = await UserService.getTopper(tenantId);
    return res.status(200).json({ success: true, topper, score });
  } catch (err) {
    next(err);
  }
};
