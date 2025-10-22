import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cloudinaryUpload } from "../utils/Cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        if (!accessToken || !refreshToken)
            throw new ApiError(400, "Access & Refresh token generation failed");

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {
            accessToken,
            refreshToken,
        };
    } catch (error) {
        throw new ApiError(500, "Access & Refresh token generation failed");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    /*
      Registration logic
      - Data from frontend
      - check Data is present
      - check if user already exist (userName & email)
      - check if rest of the fields like avatar and coverImg are present
      - upload images on cloudinary
      - create user object in DB
      - remove password and refresh tokens from response
      - check for user creation
      - return response
      */

    const { username, email, fullName, password } = req.body;
    console.log(username);

    if (
        [username, email, fullName, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const [existedUserByUserName, existedUserByEmail] = await Promise.all([
        User.findOne({ username }),
        User.findOne({ email }),
    ]);
    if (existedUserByUserName) throw new ApiError(409, "userName already exists");
    if (existedUserByEmail) throw new ApiError(409, "Email already exists");

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    console.log(`${avatarLocalPath} // ${coverImageLocalPath}`);

    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    const avatarUploadResponse = await cloudinaryUpload(avatarLocalPath);

    console.log(avatarUploadResponse);

    const coverImageUploadResponse =
        (coverImageLocalPath && (await cloudinaryUpload(coverImageLocalPath))) ||
        null;

    if (!avatarUploadResponse) throw new ApiError(400, "Avatar upload failed");

    let user = await User.create({
        fullName,
        avatar: avatarUploadResponse.secure_url,
        coverImage: coverImageUploadResponse?.secure_url || "",
        email,
        password,
        username: username.toLowerCase(),
    });
    console.log(user);

    user = await User.findById(user._id).select("-password -refreshTokens");

    if (!user) throw new ApiError(400, "User creation in DB failed");

    res.status(201).json(new ApiResponse(200, user, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    /*
      Login user
       - get data
       - validate data
       - check if email exists in DB - else error
       - hash password -------- there exists a method isPasswordCorrect
       - check if hashed pass matches with DB hashed pass -------- there exists a method isPasswordCorrect
       - generate access and refresh tokens
       - send data as cookie
      */

    const { email, password } = req.body;
    if ([email, password].some((field) => field.trim() === ""))
        throw new ApiError(400, "All fields are required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) throw new ApiError(401, "Invalid credentials");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken, loggedInUser },
                "Login successful"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    };

    res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, null, "Logout successful"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken =
            req.cookies.refreshToken || req.body.refreshToken;
        if (!incomingRefreshToken)
            throw new ApiError(400, "Refresh token is required");

        const decodedIncomingRefreshToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        let user = await User.findById(decodedIncomingRefreshToken._id);

        if (!user) throw new ApiError(404, "User not found");

        if (user.refreshToken !== incomingRefreshToken)
            throw new ApiError(401, "Expired or Used refresh token");

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
            user._id
        );

        const cookieOptions = {
            httpOnly: true,
            secure: true,
        };

        res
            .status(200)
            .cookie("accessToken", accessToken, cookieOptions)
            .cookie("refreshToken", refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(500, "Internal server error - refreshAccessToken");
    }
});

const changePassword = asyncHandler(async (req, res) => {

    try {

        const { oldPassword, newPassword } = req.body;

        if ([oldPassword, newPassword].some((field) => field.trim() === ""))
            throw new ApiError(400, "All fields are required");

        const user = await User.findById(req.user._id);
        if (!user) throw new ApiError(404, "User not found");

        if (user.password === newPassword)
            throw new ApiError(400, "New password cannot be same as old password")

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if (!isPasswordCorrect)
            throw new ApiError(401, "Invalid credentials");

        user.password = newPassword;
        const savedUser = await user.save({ validateBeforeSave: false });

        if (!savedUser) throw new ApiError(400, "Password change failed");

        res
            .status(200)
            .json(new ApiResponse(200, null, "Password changed successfully"));
    } catch (error) {
        throw new ApiError(500, "Internal server error - changePassword");
    }
});

const getUser = asyncHandler(async (req, res) => {

    try {
        const user = await User.findById(req.user._id).select("-password -refreshToken");
        console.log(user)
        if (!user) throw new ApiError(404, "User not found");
        res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
    }
    catch (error) {
        throw new ApiError(500, "Internal server error - getUser");
    }
});

const updateAccountDetails = asyncHandler(async (req, res) => {

    /*
    update allowed
     - username
     - email
     - fullName
    */
    try {
        let { username, email, fullName } = req.body;
        if (!username || !email || !fullName)
            throw new ApiError(400, "At least one field is required");

        username = username?.trim().toLowerCase();
        email = email?.trim().toLowerCase();
        fullName = fullName?.trim();

        const user = await User.findById(req.user._id);
        if (!user)
            throw new ApiError(404, "User not found");


        if (username && username !== user.username) {
            const existedUserByUserName = await User
                .findOne({
                    username,
                    _id: { $ne: user._id }
                });
            if (existedUserByUserName)
                throw new ApiError(409, "Username already exists");
            user.username = username;
        }

        if (email && email !== user.email) {
            const existedUserByEmail = await User
                .findOne({
                    email,
                    _id: { $ne: user._id }
                });
            if (existedUserByEmail)
                throw new ApiError(409, "Email already exists");
            user.email = email;
        }

        if (fullName)
            user.fullName = fullName;

        const isUpdated = await user
            .save({ validateBeforeSave: false });

        if (!isUpdated)
            throw new ApiError(400, "User update failed");

        const updatedUser = await isUpdated.select("-password -refreshToken");

        if (!updatedUser)
            throw new ApiError(400, "User update failed");

        res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully"));
    }
    catch (error) {
        throw new ApiError(500, "Internal server error - updateAccountDetails");
    }
});


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
});

const getUserChannelDetails = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) throw new ApiError(400, "Username is required");

    const channelDetails = await User.aggregate([
        {
            $match: {
                username,
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "mySubscribers",
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "mySubscriptions",
            }
        },
        {
            $addFields: {
                mySubscriberCount: { $size: "$mySubscribers" },
                mySubscriptionCount: { $size: "$mySubscriptions" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$mySubscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                watchHistory: 1,
                password: 0,
                refreshToken: 0,
                mySubscribers: 0,
                mySubscriptions: 0,
                mySubscriberCount: 1,
                mySubscriptionCount: 1,
                isSubscribed: 1
            }
        }

    ])

    res.status(200).json(new ApiResponse(200, channelDetails[0], "Channel details fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req?.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",

                // nested pipeline 1st level

                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",

                            // nested pipeline 2nd level


                            pipeline: [{
                                $project: {
                                    username: 1,
                                    fullName: 1,
                                    avatar: 1
                                }
                            }]
                        }
                    },
                    {
                        $addFields: {
                        owner: { $first: "$owner" }
                    }
                    }
                ]
            }

        }

    ])

    res.status(200).json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"));

});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelDetails,
    getWatchHistory

};
