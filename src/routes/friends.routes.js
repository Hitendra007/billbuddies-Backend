import { Router } from 'express'
import {verifyJWT} from '../middlewares/auth.middleware.js'
import { addFriend,fetchFriends,toggleFriend } from '../controllers/friend.controller.js'
const router = Router()
router.route('/toggle-friend').post(verifyJWT,toggleFriend)
router.route('/fetch-friends').post(verifyJWT,fetchFriends)
router.route('/add-friend').post(verifyJWT,addFriend)
export default router;
