import { User } from "../models/user.model";
import { Video } from "../models/video.model";
import {Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const addComment = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body;
        if (!content)
            throw new ApiError(400, "Content is required");
        const videoId = req.params.videoId;
        if (!videoId)
            throw new ApiError(400, "Video id is required");
        const user = await User.findById(req.user._id);
        if (!user)
            throw new ApiError(404, "User not found");
        const video = await Video.findById(videoId);
        if (!video)
            throw new ApiError(404, "Video not found");
        const comment = await Comment.create({
            owner: user._id,
            video: videoId,
            content
        });
        if (!comment)
            throw new ApiError(400, "Comment creation failed");
        res.status(201).json(new ApiResponse(201, comment, "Comment created successfully"));
    } catch (error) {
        new ApiError(500, "Internal server error - addComment")
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    try {
        const commentId = req.params.commentId;
        if (!commentId)
            throw new ApiError(400, "Comment id is required");
        const user = await User.findById(req.user._id);
        if (!user)
            throw new ApiError(404, "User not found");
        if (comment.owner.toString() !== user._id.toString())
            throw new ApiError(403, "You are not authorized to delete this comment");
        const comment = await Comment.findByIdAndDelete(commentId);
        if (!comment)
            throw new ApiError(404, "Comment not found");
        res.status(200).json(new ApiResponse(200, comment, "Comment deleted successfully"));
    } catch (error) {
        new ApiError(500, "Internal server error - deleteComment")
    }
});

const updateComment = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body;
        if (!content)
            throw new ApiError(400, "Content is required");
        const commentId = req.params.commentId;
        if(!commentId)
            throw new ApiError(400, "Comment id is required");

        const user = await User.findById(req.user._id);
        if (!user)
            throw new ApiError(404, "User not found");

        const comment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {
                    content: content.trim() || comment.content
                }
            },
            { new: true }
        )
        
        if (!comment)
            throw new ApiError(400, "Comment update failed");
        
        res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
    } catch (error) {
        new ApiError(500, "Internal server error - updateComment")
    }
});

const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const videoId = req.params.videoId;
        if (!videoId)
            throw new ApiError(400, "Video id is required");
        const video = await Video.findById(videoId);
        if (!video)
            throw new ApiError(404, "Video not found");
        const comments = await Comment.find({ video: videoId });
        if (!comments)
            throw new ApiError(404, "Comments not found");
        res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
    } catch (error) {
        new ApiError(500, "Internal server error - getVideoComments")
    }
});
export {
    addComment,
    deleteComment,
    updateComment,
    getVideoComments

}