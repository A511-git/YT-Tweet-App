import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const encodedAccessToken =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!encodedAccessToken) throw new ApiError(401, "Unauthorized access 1");

    const decodedAccessToken = jwt.verify(
      encodedAccessToken,
      process.env.ACCESS_TOKEN_SECRET
    );

    const user = await User.findById(decodedAccessToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) throw new ApiError(401, "Unauthorized access 2");

    req.user = user;
    next();

    /*
        why not just simply return the user why are we passing through req 

        its because at backend if we {return} it we will loose our request call and go blank 

        if so then we can simply make it a function and then call it why the middleware
            -- cuz its organized and easy routing 
        */
  } catch (error) {
    throw new ApiError(401, "Unauthorized access 3");
  }
});
