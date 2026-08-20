import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
} from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
const router = Router()
router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  registerUser,
)
router.route('/login').post(loginUser)
//secured routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refreshToken').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changeCurrentPassword)
router.route('/current-user').post(verifyJWT, getCurrentUser)
router.route('/update-account').patch(verifyJWT, updateUserDetails)
router
  .route('/update-avatar')
  .patch(verifyJWT, upload.single('avatar'), updateUserAvatar)
router
  .route('/update-coverImage')
  .patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)
router.route('/channel/:username').get(verifyJWT, getUserChannelProfile)
router.route('/watch-history').get(verifyJWT, getUserWatchHistory)
export default router
