import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    try {
        const { channelId } = req.params;
        if (!isValidObjectId(channelId))
            throw new ApiError(400, "Invalid channel id")
    
    
        const subscription = await Subscription.findOne({
            subscriber: req?.user?._id,
            channel: channelId
        })
    
        if (subscription) {
            await Subscription.findByIdAndDelete(subscription._id)
        } else
            await Subscription.create({
                subscriber: req.user._id,
                channel: channelId
            })
    
        res.status(200).json(new ApiResponse(200, null, "Subscription toggled successfully"))
    } catch (error) {
        new ApiError(500, "Internal server error - toggleSubscription")
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    try {
        
    } catch (error) {
        new ApiError(500, "Internal server error - getUserChannelSubscribers")
    }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const { subscriberId } = req.params
        if (!isValidObjectId(subscriberId))
            throw new ApiError(400, "Invalid subscriber id")
    
        const channels = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channel",
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
                    channel: { $first: "$channel" }
                }
            },
            {
                $project: {
                    _id: 0,
                    channel: 1
                }
            }
    
        ]);
    
        if (!channels)
            throw new ApiError(404, "Channels not found")
    
        res.status(200).json(new ApiResponse(200, channels, "Channels fetched successfully"))
    } catch (error) {
        new ApiError(500, "Internal server error - getSubscribedChannels")
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels

}