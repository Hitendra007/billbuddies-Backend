import { Router } from "express";
import { fetchgroupInfo, fetchUserGroup, addMembertogroup, createGroup, addgroupExpense, fetchNetAmountYouGive, fetchNetAmountYouGot } from "../controllers/group.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/create-group').post(verifyJWT, createGroup);
router.route('/add-to-group').post(verifyJWT, addMembertogroup);
router.route('/add-group-expense').post(verifyJWT, addgroupExpense);
router.route('/fetch-user-group').get(verifyJWT, fetchUserGroup);
router.route('/fetch-net-amount-you-give').get(verifyJWT, fetchNetAmountYouGive);
router.route('/fetch-net-amount-you-got').get(verifyJWT, fetchNetAmountYouGot);
router.route('/fetch-group-info').get(verifyJWT, fetchgroupInfo);

export default router;
