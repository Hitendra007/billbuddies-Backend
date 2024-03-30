import { Router } from 'express'
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { addIndividualExpense } from '../controllers/individualExpense.controller.js';
const router = Router()
router.route('/add-individual-expense').post(verifyJWT,addIndividualExpense)
export default router;
