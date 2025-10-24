import { JsonWebTokenError } from "jsonwebtoken";
import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { cloudinaryUpload } from "../utils/Cloudinary";
import { Video } from "../models/video.model.js";

const publishAVideo = asyncHandler(async (req, res) => {

    try {
        const { title, description, isPublished } = req.body;
        if (title.trim() === "")
            throw new ApiError(400, "Title is required")

        const user = await User.findById(req.user._id);
        if (!user)
            throw new ApiError(404, "User not found")


        const videoLocalPath = req.files?.video[0]?.path;
        const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

        if (!videoLocalPath)
            throw new ApiError(400, "Video is required")

        if (!thumbnailLocalPath)
            throw new ApiError(400, "Thumbnail is required")

        const [videoUploadResponse, thumbnailUploadResponse] =
            await Promise.all([
                cloudinaryUpload(videoLocalPath),
                cloudinaryUpload(thumbnailLocalPath)
            ]);

        if (!videoUploadResponse)
            throw new ApiError(400, "Video upload failed")

        if (!thumbnailUploadResponse)
            throw new ApiError(400, "Thumbnail upload failed")

        const videoDetails = {
            title,
            description,
            videoFile: videoUploadResponse.secure_url,
            thumbnail: thumbnailUpload,
            owner: user._id,
            duration: videoUploadResponse.duration,
            views: 0,
            isPublished
        }

        const video = await Video.create(videoDetails);

        if (!video)
            throw new ApiError(400, "Video creation failed")

        res.status(201).json(new ApiResponse(201, video, "Video created successfully"));
    } catch (error) {
        new ApiError(500, "Internal server error - postVideo")
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;
        const thumbnailLocalPath = req.files?.thumbnail?.[0].path || req?.file.path;

        if (!title && !description && !thumbnailLocalPath)
            throw new ApiError(400, "At least one field is required");

        let thumbnail;
        if (thumbnailLocalPath)
            thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        const videoId = req.params.videoId || req.params;
        if (!videoId)
            throw new ApiError(400, "Video id is required");

        const video = await Video.findById(videoId);
        if (!video)
            throw new ApiError(404, "Video not found");
        if (video.owner.toString() !== req?.user?._id.toString())
            throw new ApiError(403, "You are not authorized to update this video");

        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title: title.trim() || video.title,
                    description: description.trim() || video.description,
                    thumbnail: thumbnail?.secure_url || video.thumbnail
                }
            },
            { new: true }
        )

        if (!updatedVideo)
            throw new ApiError(400, "Video update failed")

        res.status(200).ApiResponse(200, updatedVideo, "Video updated successfully");
    } catch (error) {
        new ApiError(500, "Internal server error - updateVideoDetails")
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params;
        if (!videoId)
            throw new ApiError(400, "Video id is required");

        if (video.owner.toString() !== req?.user?._id.toString())
            throw new ApiError(403, "You are not authorized to delete this video");


        const video = await Video.findById(videoId);
        if (!video)
            throw new ApiError(404, "Video not found");

        const deletedVideo = await Video.findByIdAndDelete(videoId);
        if (!deletedVideo)
            throw new ApiError(400, "Video deletion failed");

        res.status(200).json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));

    } catch (error) {
        new ApiError(500, "Internal server error - deleteVideo")
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        if (!videoId)
            throw new ApiError(400, "Video id is required");

        const video = await Video.findById(videoId);
        if (!video)
            throw new ApiError(404, "Videos not found");

        res.status(200).ApiResponse(200, video, "Video fetched successfully");
    } catch (error) {
        new ApiError(500, "Internal server error - getVideoById")
    }
});


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        if (!videoId)
            throw new ApiError(400, "Video id is required");

        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    isPublished: !video.isPublished
                }
            },
            { new: true }
        )

        if (!video)
            throw new ApiError(400, "Video update failed");

        res.status(200).json(new ApiResponse(200, video, "Video published status updated successfully"));
    } catch (error) {
        new ApiError(500, "Internal server error - togglePublishStatus")
    }
});


const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const { username } = req.params;
        if (!username)
            throw new ApiError(400, "Username is required");

        const user = await User.findOne({ username });
        if (!user)
            throw new ApiError(404, "User not found");

        const videos = Video.find({ owner: user._id });
        if (!videos)
            throw new ApiError(404, "Videos not found");

        res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
    } catch (error) {
        new ApiError(500, "Internal server error - getChannelVideos")
    }
});


/*
const getVideos = asyncHandler(async (req, res) => {
    try {
        const videos = await Video.
    } catch (error) {
        new ApiError(500, "Internal server error - getVideos")
    }
});
const getTrendingVideos = asyncHandler(async (req, res) => { });
const getLikedVideos = asyncHandler(async (req, res) => { });
*/




export {
    publishAVideo,
    updateVideo,
    deleteVideo,
    getVideoById,
    getAllVideos,
    togglePublishStatus,
    getChannelVideos
}