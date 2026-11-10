import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Protect all communication endpoints
router.use(authenticate);

// Circulars (REST + Vision legacy aliases)
router.get('/circulars', controller.getCircularsHandler);
router.post('/circulars', controller.createCircularHandler);
router.delete('/circulars/:id', controller.deleteCircularHandler);
router.patch('/circulars/:id/publish-to-marketplace', controller.toggleCircularMarketplaceHandler);
router.post('/circulars/upload', (req, res, next) => {
  // Proxy to upload endpoint
  res.redirect(307, '/api/upload/file?category=circulars');
});

// Live Chat & System Monitor
router.post('/communication/send', controller.sendMessageHandler);
router.post('/communication/createChat', controller.sendMessageHandler); // Vision alias
router.get('/communication/monitor', controller.getSystemMonitorHandler);
router.get('/communication/history/:user1/:user2', controller.getHistoryHandler);
router.get('/communication/getChat/:type', controller.getChatByTypeHandler);
router.get('/getChat/:type', controller.getChatByTypeHandler);

// Complaints & Grievances
router.get('/complaints', controller.getComplaintsHandler);
router.get('/complaints/:id', controller.getComplaintByIdHandler);
router.post('/complaints', controller.createComplaintHandler);
router.patch('/complaints/:id', controller.updateComplaintStatusHandler);

// Notifications
router.post('/notifications/register-token', controller.registerTokenHandler);
router.post('/notifications/broadcast', controller.broadcastNotificationHandler);
router.get('/notifications', controller.getUserNotificationsHandler);
router.get('/notifications/history', controller.getUserNotificationsHandler);
router.get('/notifications/all', controller.getAllNotificationsHandler);
router.patch('/notifications/all/read', controller.markAllNotificationsReadHandler);
router.put('/notifications/all/read', controller.markAllNotificationsReadHandler);
router.patch('/notifications/:id/read', controller.markAsReadHandler);
router.put('/notifications/:id/read', controller.markAsReadHandler);

export default router;
