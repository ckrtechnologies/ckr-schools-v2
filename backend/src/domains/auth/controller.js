import * as authService from './service.js';

export async function loginHandler(req, res, next) {
  try {
    const result = await authService.login({
      tenant: req.tenant,
      rawData: req.body
    });
    return res.status(200).json({
      success: true,
      token: result.accessToken,
      accessToken: result.accessToken,
      user: result.user,
      siblings: result.siblings || [],
      activeStudent: result.activeStudent || null,
      hasMultipleChildren: !!result.hasMultipleChildren,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function meHandler(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.sub);
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(req, res, next) {
  try {
    const updated = await authService.updateProfile(req.user.sub, req.body);
    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}


export async function changePasswordHandler(req, res, next) {
  try {
    const userId = req.user.sub || req.user.id;
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.tenant?.id, userId, currentPassword, newPassword);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
