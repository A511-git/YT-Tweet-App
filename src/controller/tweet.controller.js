import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {Tweet } from "../models/tweet.model.js";

const createTweet = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body;
        if (!content)
            throw new ApiError(400, "Content is required");

        const user = await User.findById(req.user._id); 
        if (!user)
            throw new ApiError(404, "User not found");

        const tweet = await Tweet.create({
            owner: user._id,
            content
        });

        if (!tweet)
            throw new ApiError(400, "Tweet creation failed");

        res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
    } catch (error) {
        new ApiError(500, "Internal server error - createTweet")
    }
});

const getUserTweets = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user)
            throw new ApiError(404, "User not found");

        const tweets = await Tweet.find({ owner: user._id });
        if (!tweets)
            throw new ApiError(404, "Tweets not found");

        res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));

    } catch (error) {
        new ApiError(500, "Internal server error - getUserTweets")
    }
});

const updateTweet = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body;   
        if(!content)
            throw new ApiError(400, "Content is required");

        const tweetId = req.params.tweetId;
        if(!tweetId)
            throw new ApiError(400, "Tweet id is required");

        const tweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content: content.trim() || tweet.content
                }
            },
            { new: true }
        )
        if (!tweet)
            throw new ApiError(400, "Tweet update failed");
        
        res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));

    } catch (error) {
        new ApiError(500, "Internal server error - updateTweet")    
    }
});

const deleteTweet = asyncHandler(async (req, res) => {
    try {
        const tweetId = req.params.tweetId;
        if(!tweetId)
            throw new ApiError(400, "Tweet id is required");

        const user = await User.findById(req.user._id);
        if (!user)
            throw new ApiError(404, "User not found");
        if(tweet.owner.toString() !== user._id.toString())
            throw new ApiError(403, "You are not authorized to delete this tweet");

        const tweet = await Tweet.findByIdAndDelete(tweetId);

        res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
        
    } catch (error) {
        new ApiError(500, "Internal server error - deleteTweet")
    }
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}