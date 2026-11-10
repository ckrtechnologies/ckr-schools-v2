import { Router } from 'express';
import * as controller from './controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

// Protect all finance endpoints
router.use(authenticate);

// Fee Heads (REST + Vision legacy aliases)
router.get('/', controller.getFeeHeadsHandler);
router.get('/fees', controller.getFeeHeadsHandler);
router.post('/fees', controller.createFeeHeadHandler);
router.put('/fees/:id', controller.updateFeeHeadHandler);
router.delete('/fees/:id', controller.deleteFeeHeadHandler);

// Vision School aliases
router.get('/getFees', controller.getFeeHeadsHandler);
router.post('/createFee', controller.createFeeHeadHandler);
router.put('/updateFee', controller.updateFeeHeadHandler);
router.delete('/deleteFee/:id', controller.deleteFeeHeadHandler);

// POS Fee Collection Counter & Ledgers
router.post('/collect', controller.collectFeeHandler);
router.post('/logPayment', controller.collectFeeHandler); // Vision alias
router.get('/student-dues/:studentId', controller.getStudentDuesHandler);
router.get('/student-ledger/:studentId', controller.getStudentLedgerHandler);
router.get('/getStudentLedger/:studentId', controller.getStudentLedgerHandler); // Vision alias
router.get('/student-fees', controller.getStudentFeesHandler);
router.get('/student-fees/:studentId', controller.getStudentFeesHandler);
router.post('/studentBalances', controller.getStudentBalancesHandler);
router.get('/studentBalances', controller.getStudentBalancesHandler);
router.get('/accountant/:id/stats', controller.getAccountantStatsHandler);

// Fee Structures (Finance Panel)
router.get('/feeStructures', controller.getFeeStructuresHandler);
router.post('/feeStructures', controller.createFeeStructureHandler);
router.put('/feeStructures/:id', controller.updateFeeStructureHandler);
router.delete('/feeStructures/:id', controller.deleteFeeStructureHandler);

// Payments & Stats (Finance Panel)
router.get('/getAllPayments', controller.getAllPaymentsHandler);
router.get('/dashboardStats', controller.getDashboardStatsHandler);
router.get('/financeDashboard', controller.getDashboardStatsHandler);

// Categories (Income & Expense)
router.get('/categories', controller.getCategoriesHandler);
router.post('/categories', controller.createCategoryHandler);
router.put('/categories/:id', controller.updateCategoryHandler);
router.delete('/categories/:id', controller.deleteCategoryHandler);

// Transactions & Expenses
router.get('/transactions', controller.getTransactionsHandler);
router.post('/transactions', controller.createTransactionHandler);
router.put('/transactions/:id', controller.updateTransactionHandler);
router.delete('/transactions/:id', controller.deleteTransactionHandler);

// Payments management
router.put('/payments/:id', controller.updatePaymentHandler);
router.delete('/payments/:id', controller.deletePaymentHandler);

// Student Transport Fee
router.put('/student/:studentId/busFee', controller.updateStudentBusFeeHandler);

// Student fees & Year Close
router.delete('/studentFee/:id', controller.deleteStudentFeeHandler);
router.post('/closeFinancialYear', controller.closeFinancialYearHandler);

export default router;