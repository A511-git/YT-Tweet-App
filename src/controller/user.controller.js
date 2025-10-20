import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cloudinaryUpload } from "../utils/Cloudinary.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    if (!user)
        throw new ApiError(404, "User not found")
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        if (!accessToken || !refreshToken)
            throw new ApiError(400, "Access & Refresh token generation failed")

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {
            accessToken,
            refreshToken
        }
    }
    catch (error) {
        throw new ApiError(500, "Access & Refresh token generation failed")
    }
}

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


    if ([username, email, fullName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    const [existedUserByUserName, existedUserByEmail] = await Promise.all([
        User.findOne({ username }),
        User.findOne({ email })
    ])
    if (existedUserByUserName)
        throw new ApiError(409, "userName already exists");
    if (existedUserByEmail)
        throw new ApiError(409, "Email already exists");


    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    console.log(`${avatarLocalPath} // ${coverImageLocalPath}`);


    if (!avatarLocalPath)
        throw new ApiError(400, "Avatar is required")

    const avatarUploadResponse = await cloudinaryUpload(avatarLocalPath);

    console.log(avatarUploadResponse);


    const coverImageUploadResponse = coverImageLocalPath && await cloudinaryUpload(coverImageLocalPath) || null;

    if (!avatarUploadResponse)
        throw new ApiError(400, "Avatar upload failed")

    let user = await User.create({
        fullName,
        avatar: avatarUploadResponse.secure_url,
        coverImage: coverImageUploadResponse?.secure_url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    console.log(user);

    user = await User.findById(user._id).select('-password -refreshTokens');

    if (!user)
        throw new ApiError(400, "User creation in DB failed");


    res.status(201).json(
        new ApiResponse(200, user, "User created successfully")
    )
})

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
    if ([email, password].some(field => field.trim() === ''))
        throw new ApiError(400, "All fields are required")

    const user = await User.findOne({ email })
    if (!user)
        throw new ApiError(404, "User not found")

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect)
        throw new ApiError(401, "Invalid credentials")

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken')



    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .json(new ApiResponse(
            200,
            { accessToken, refreshToken, loggedInUser },
            "Login successful"
        ))
})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:
            {
                refreshToken: 1
            }
        },
        { new: true }
    )

    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .clearCookie('accessToken', cookieOptions)
        .clearCookie('refreshToken', cookieOptions)
        .json(
            new ApiResponse(
                200,
                null,
                "Logout successful"
            )
        )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken  = req.cookies.refreshToken || req.body.refreshToken;
        if (!incomingRefreshToken)
            throw new ApiError(400, "Refresh token is required")
        
        const decodedIncomingRefreshToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        let user = await User.findById(decodedIncomingRefreshToken._id)

        if ( !user)
            throw new ApiError(404, "User not found")

        if(user.refreshToken !== incomingRefreshToken)
            throw new ApiError(401, "Expired or Used refresh token")        

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        const cookieOptions = {
            httpOnly: true,
            secure: true
        }

        res.status(200)
            .cookie('accessToken', accessToken, cookieOptions)
            .cookie('refreshToken', refreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully"
                )
            )

    } catch (error) {
        throw new ApiError(500, "Internal server error - refreshAccessToken");
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken};