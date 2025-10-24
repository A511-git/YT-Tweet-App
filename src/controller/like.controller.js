
import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        if (!isValidObjectId(videoId))
            throw new ApiError(400, "Invalid video id")

        const video = await Video.findById(videoId)
        if (!video)
            throw new ApiError(404, "Video not found")

        const like = await Like.findOne({
            video: videoId,
            likedBy: req.user._id
        })
        if (like)
            await Like.findByIdAndDelete(like._id)
        else
            await Like.create({
                video: videoId,
                likedBy: req.user._id
            })

        res.status(200).json(new ApiResponse(200, null, "Like toggled successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - toggleVideoLike")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params
        if (!isValidObjectId(commentId))
            throw new ApiError(400, "Invalid comment id")

        const comment = await Comment.findById(commentId)
        if (!comment)
            throw new ApiError(404, "Comment not found")

        const like = await Like.findOne({
            comment: commentId,
            likedBy: req.user._id
        })
        if (like)
            await Like.findByIdAndDelete(like._id)
        else
            await Like.create({
                comment: commentId,
                likedBy: req.user._id
            })

        res.status(200).json(new ApiResponse(200, null, "Like toggled successfully"))


    } catch (error) {
        throw new ApiError(500, "Internal server error - toggleCommentLike")
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params
        if (!isValidObjectId(tweetId))
            throw new ApiError(400, "Invalid tweet id")

        const tweet = await Tweet.findById(tweetId)
        if (!tweet)
            throw new ApiError(404, "Tweet not found")

        const like = await Like.findOne({
            tweet: tweetId,
            likedBy: req.user._id
        })
        if (like)
            await Like.findByIdAndDelete(like._id)
        else
            await Like.create({
                tweet: tweetId,
                likedBy: req.user._id
            })

        res.status(200).json(new ApiResponse(200, null, "Like toggled successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - toggleTweetLike")
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
        if (!user)
            throw new ApiError(404, "User not found")
    
        // Step 1: Use populate for a clean, readable database query
        const likeDocuments = await Like.find({
            likedBy: user._id
        }).populate({
            path: 'video',
            select: 'title thumbnail duration views owner' // Select only necessary video fields
        });
    
        // Step 2: Transform the result in memory to extract only the videos
        const likedVideos = likeDocuments.map(likeDoc => {
            // We check if video is null (in case the video was deleted after it was liked)
            return likeDoc.video;
        }).filter(video => video !== null);
    
        // FINAL RESULT: [ { V1 data }, { V2 data }, ... ]
    
        res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - getLikedVideos")   
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
