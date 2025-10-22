import mongoose from "mongoose";

const subscription = new mongoose.Schema(
  {
    // stores the _id of the user who is subscribing  -- active viewer
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
   
    // stores the _id of the user who is being subscribed  -- channel owner
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model("Subscription", subscription);
