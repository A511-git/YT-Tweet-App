import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    // owner,video,content,timestamp
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
    },
    content: {
        type: String,
        required: true,
    }
}, {
    timestamps: true,
});

export const Comment = mongoose.model("Comment", commentSchema);