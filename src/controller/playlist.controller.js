
import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    try {
        const { name, description = "" } = req.body

        if (!name)
            throw new ApiError(400, "Name is required")

        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user._id,
            videos: []
        })
        if (!playlist)
            throw new ApiError(400, "Playlist creation failed")

        res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - createPlaylist")
    }
});
const getUserPlaylists = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params
        if (!isValidObjectId(userId))
            throw new ApiError(400, "Invalid user id")
        const user = await User.findById(userId)
        if (!user)
            throw new ApiError(404, "User not found")



        const playlists = await Playlist.find({ owner: userId })
        if (!playlists)
            throw new ApiError(404, "Playlists not found")

        res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - getUserPlaylists")
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params
        if (!isValidObjectId(playlistId))
            throw new ApiError(400, "Invalid Playlist id")

        const playlist = await Playlist.findById(playlistId)
        if (!playlist)
            throw new ApiError(404, "Playlists not found")

        res.status(200).json(new ApiResponse(200, playlist, "Playlists fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - getPlaylistById")
    }

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId, videoId } = req.params
        if (!playlistId || !videoId)
            throw new ApiError(400, "Playlist id and video id are required")

        if (!isValidObjectId(playlistId))
            throw new ApiError(400, "Invalid playlist id")
        if (!isValidObjectId(videoId))
            throw new ApiError(400, "Invalid video id")


        const video = await Video.findById(videoId)
        if (!video)
            throw new ApiError(404, "Video not found")

        const searchedPlaylist = await Playlist.findById(playlistId)
        if (!searchedPlaylist)
            throw new ApiError(404, "Playlist not found")


        if (req.user._id !== searchedPlaylist.owner.toString())
            throw new ApiError(403, "You are not authorized to add video to this playlist")

        const playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $push: {
                    videos: videoId
                }
            },
            { new: true }
        )

        if (!playlist)
            throw new ApiError(400, "Playlist update failed")

        res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - addVideoToPlaylist")
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId, videoId } = req.params
        if (!playlistId || !videoId)
            throw new ApiError(400, "Playlist id and video id are required")

        if (!isValidObjectId(playlistId))
            throw new ApiError(400, "Invalid playlist id")
        if (!isValidObjectId(videoId))
            throw new ApiError(400, "Invalid video id")

        const video = await Video.findById(videoId)
        if (!video)
            throw new ApiError(404, "Video not found")

        const searchedPlaylist = await Playlist.findById(playlistId)
        if (!searchedPlaylist)
            throw new ApiError(404, "Playlist not found")

        if (req.user._id !== searchedPlaylist.owner.toString())
            throw new ApiError(403, "You are not authorized to remove video to this playlist")

        const playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull: {
                    videos: videoId
                }
            },
            { new: true }
        )

        if (!playlist)
            throw new ApiError(400, "Playlist update failed")

        res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - removeVideoFromPlaylist")
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params
        if (!playlistId)
            throw new ApiError(400, "Playlist id is required")
        if (!isValidObjectId(playlistId))
            throw new ApiError(400, "Invalid playlist id")

        
        const searchedPlaylist = await Playlist.findById(playlistId)
        if(!searchedPlaylist)
            throw new ApiError(404, "Playlist not found")

        if (req.user._id !== searchedPlaylist.owner.toString())
            throw new ApiError(403, "You are not authorized to delete this playlist")

        const playlist = await Playlist.findByIdAndDelete(playlistId)
        if (!playlist)
            throw new ApiError(404, "Playlist not found")

        res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - deletePlaylist")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params
        const { name, description } = req.body

        if (!isValidObjectId(playlistId))
            throw new ApiError(400, "Invalid playlist id")
        if (!name && !description)
            throw new ApiError(400, "At least one field is required")

        
        const searchedPlaylist = await Playlist.findById(playlistId)
        if(!searchedPlaylist)
            throw new ApiError(404, "Playlist not found")
        
        if (req.user._id !== searchedPlaylist.owner.toString())
            throw new ApiError(403, "You are not authorized to update this playlist")

        const playlist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set: {
                    name: name.trim() === "" ? searchedPlaylist.name : name.trim(),
                    description: description.trim() === "" ? searchedPlaylist.description : description.trim()
                }
            },
            { new: true }
        )

        if (!playlist)
            throw new ApiError(400, "Playlist update failed")

        res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))
    } catch (error) {
        throw new ApiError(500, "Internal server error - updatePlaylist")
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
