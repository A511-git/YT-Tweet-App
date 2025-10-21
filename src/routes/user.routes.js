import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
} from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured route

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changePassword);

router.route("/").get(verifyJWT, getUser);

router.route("/update-account-details").post(verifyJWT, updateAccountDetails);

router.route("/update-avatar").post(
    verifyJWT,
     updateUserAvatar
);

router.route("/update-cover-image").post(
    verifyJWT,
     updateUserCoverImage
);


export default router;
