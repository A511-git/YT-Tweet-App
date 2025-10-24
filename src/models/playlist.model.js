import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema({
    //name, description, owner, videos
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    videos: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Video",
    }
}, {
    timestamps: true,
});

export const Playlist = mongoose.model("Playlist", playlistSchema);