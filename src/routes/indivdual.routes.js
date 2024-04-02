import { Router } from 'express'
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { addIndividualExpense,allExpenses } from '../controllers/individualExpense.controller.js';
const router = Router()
router.route('/add-individual-expense').post(verifyJWT,addIndividualExpense)
router.route('/all-expenses').post(verifyJWT,allExpenses)
export default router;
