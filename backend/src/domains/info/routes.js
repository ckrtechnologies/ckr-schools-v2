import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Public School Profile for dynamic branding, login screen, title & favicon (no auth required)
router.get('/public', controller.getPublicSchoolProfileHandler);
router.get('/info/public', controller.getPublicSchoolProfileHandler);
router.get('/public-school-profile', controller.getPublicSchoolProfileHandler);
router.get('/school-profile', controller.getPublicSchoolProfileHandler);

// Protect info routes
router.use(authenticate);

// All Info & Settings
router.get('/info', controller.getAllInfoHandler);
router.get('/settings', controller.getSettingsHandler);
router.get('/info/getAll', controller.getAllInfoHandler);
router.get('/info/settings', controller.getSettingsHandler);
router.put('/info/settings', controller.updateSettingsHandler);
router.get('/info/profile', controller.getSchoolProfileHandler);
router.put('/info/profile', controller.updateSchoolProfileHandler);
router.get('/profile', controller.getSchoolProfileHandler);
router.put('/profile', controller.updateSchoolProfileHandler);

// Spotlight
router.get('/spotlight', controller.getSpotlightHandler);
router.get('/spotlight/today', controller.getSpotlightHandler);
router.post('/spotlight', controller.createSpotlightHandler);
router.put('/spotlight/:id', controller.updateSpotlightHandler);
router.delete('/spotlight/:id', controller.deleteSpotlightHandler);

// Thought
router.get('/thoughts', controller.getThoughtHandler);
router.get('/thoughts/today', controller.getThoughtHandler);
router.post('/thoughts', controller.createThoughtHandler);
router.put('/thoughts/:id', controller.updateThoughtHandler);
router.delete('/thoughts/:id', controller.deleteThoughtHandler);

// Champions & Student of the Week
router.get('/info/champions', controller.getChampionsHandler);
router.get('/shared/student-of-week/current', controller.getChampionsHandler);
router.get('/student-of-week/current', controller.getChampionsHandler);
router.post('/info/champion', controller.addChampionHandler);
router.delete('/info/champion/:id', controller.deleteChampionHandler);

// Gallery
router.get('/gallery', controller.getGalleryHandler);
router.post('/gallery', controller.addGalleryHandler);
router.delete('/gallery/:id', controller.deleteGalleryHandler);

router.get('/info/gallery', controller.getGalleryHandler);
router.post('/info/gallery', controller.addGalleryHandler);
router.delete('/info/gallery/:id', controller.deleteGalleryHandler);

router.get('/', controller.getGalleryHandler);
router.post('/', controller.addGalleryHandler);
router.delete('/:id', controller.deleteGalleryHandler);

// Newsletters
router.get('/info/newsletters', controller.getNewslettersHandler);
router.post('/info/newsletter', controller.addNewsletterHandler);
router.delete('/info/newsletter/:id', controller.deleteNewsletterHandler);

router.get('/newsletters', controller.getNewslettersHandler);
router.post('/newsletters', controller.addNewsletterHandler);
router.delete('/newsletters/:id', controller.deleteNewsletterHandler);

export default router;

