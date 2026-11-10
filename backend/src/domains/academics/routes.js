import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// All academics endpoints require authentication & tenant scoping
router.use(authenticate);

// --- Classes (REST + Vision legacy aliases) ---
router.get('/classes', controller.getClassesHandler);
router.get('/classes/:id', controller.getClassByIdHandler);
router.post('/classes', controller.createClassHandler);
router.put('/classes/:id', controller.updateClassHandler);
router.delete('/classes/:id', controller.deleteClassHandler);

// Vision School legacy & subpath aliases (MUST BE REGISTERED BEFORE /:id parameter routes)
router.get('/class/getClass', controller.getClassesHandler);
router.get('/getClass', controller.getClassesHandler);
router.post('/class/createClass', controller.createClassHandler);
router.post('/createClass', controller.createClassHandler);
router.put('/class/updateClass', controller.updateClassHandler);
router.put('/class/updateClass/:id', controller.updateClassHandler);
router.put('/updateClass', controller.updateClassHandler);
router.put('/updateClass/:id', controller.updateClassHandler);
router.delete('/class/deleteClass/:id', controller.deleteClassHandler);
router.delete('/deleteClass/:id', controller.deleteClassHandler);
router.get('/getClassById/:id', controller.getClassByIdHandler);
router.put('/addTeacher', controller.addTeacherHandler);

// Clean REST routes for /class and /classes
router.get('/class', controller.getClassesHandler);
router.post('/class', controller.createClassHandler);
router.put('/class', controller.updateClassHandler);
router.get('/class/:id', controller.getClassByIdHandler);
router.put('/class/:id', controller.updateClassHandler);
router.delete('/class/:id', controller.deleteClassHandler);

// --- Subjects (REST + Vision legacy aliases) ---
router.get('/subjects', controller.getSubjectsHandler);
router.post('/subjects', controller.createSubjectHandler);
router.put('/subjects/:id', controller.updateSubjectHandler);
router.delete('/subjects/:id', controller.deleteSubjectHandler);

// Vision School aliases
router.get('/getSubjects', controller.getSubjectsHandler);
router.get('/subjects/getSubjects', controller.getSubjectsHandler);
router.post('/createSubject', controller.createSubjectHandler);
router.post('/subjects/createSubject', controller.createSubjectHandler);
router.put('/updateSubject/:id', controller.updateSubjectHandler);
router.put('/subjects/updateSubject/:id', controller.updateSubjectHandler);
router.delete('/deleteSubject/:id', controller.deleteSubjectHandler);
router.delete('/subjects/deleteSubject/:id', controller.deleteSubjectHandler);

// --- 2D Subject-Teachers Matrix ---
router.get('/subjectTeachers', controller.getSubjectTeachersHandler);
router.post('/subjectTeachers/assign', controller.assignSubjectTeacherHandler);

// --- Rooms ---
router.get('/rooms', controller.getRoomsHandler);
router.get('/rooms/getRooms', controller.getRoomsHandler);
router.get('/getRooms', controller.getRoomsHandler);
router.post('/rooms', controller.createRoomHandler);
router.post('/rooms/createRoom', controller.createRoomHandler);
router.post('/createRoom', controller.createRoomHandler);
router.put('/rooms/:id', controller.updateRoomHandler);
router.put('/rooms/updateRoom/:id', controller.updateRoomHandler);
router.put('/updateRoom/:id', controller.updateRoomHandler);
router.delete('/rooms/:id', controller.deleteRoomHandler);
router.delete('/rooms/deleteRoom/:id', controller.deleteRoomHandler);
router.delete('/deleteRoom/:id', controller.deleteRoomHandler);

// --- School Overview Dashboard Stats ---
router.get('/dashboard-stats', controller.getDashboardStatsHandler);
router.get('/stats', controller.getDashboardStatsHandler);

export default router;

