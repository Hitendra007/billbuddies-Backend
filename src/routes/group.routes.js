
import { Router } from "express";
import {fetchgroupInfo, fetchUserGroup, addMembertogroup, createGroup, addgroupExpense, fetchNetAmountYouGive, fetchNetAmountYouGot } from "../controllers/group.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/create-group', verifyJWT, createGroup);
router.post('/add-to-group', verifyJWT, addMembertogroup);
router.post('/fetch-user-group', verifyJWT, fetchUserGroup);
router.post('/add-group-expense', verifyJWT, addgroupExpense);
router.post('/fetch-net-amount-you-give', verifyJWT, fetchNetAmountYouGive);
router.post('/fetch-net-amount-you-got', verifyJWT, fetchNetAmountYouGot);
router.post('/fetch-group-info',verifyJWT,fetchgroupInfo)

export default router;