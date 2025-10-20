import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { cloudinaryUpload } from "../utils/Cloudinary.js";


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
const registerUser = asyncHandler(async (req, res) => {

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
    

    if(!avatarLocalPath)
        throw new ApiError(400, "Avatar is required")

    const avatarUploadResponse = await cloudinaryUpload(avatarLocalPath);

    console.log(avatarUploadResponse);

    
    const coverImageUploadResponse = coverImageLocalPath && await cloudinaryUpload(coverImageLocalPath) || null;

    if(!avatarUploadResponse)
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
    
    user = await  User.findById(user._id).select('-password -refreshTokens');

    if(!user)
        throw new ApiError(400, "User creation in DB failed");


    res.status(201).json(
        new ApiResponse(200, user, "User created successfully")
    )
})

export { registerUser };