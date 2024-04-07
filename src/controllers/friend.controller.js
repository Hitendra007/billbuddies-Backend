import { Friend } from "../models/friend.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleFriend = asyncHandler(async (req, res) => {
    const { user_id1, user_id2 } = req.body;
    console.log(user_id1, user_id2)
    if (!user_id1 || !user_id2 || !mongoose.isValidObjectId(user_id1) || !mongoose.isValidObjectId(user_id2)) {
        throw new apiError(400, "Send user IDs correctly.");
    }

    // Check if friendship already exists
    const existingFriendship = await Friend.findOne({ user1: user_id1, user2: user_id2 });

    if (existingFriendship) {
        // Friendship already exists, delete it
        await Friend.findByIdAndDelete(existingFriendship._id);
        res.status(200).json(new apiResponse(200, null, 'Friendship deleted.'));
    } else {
        // Friendship does not exist, create it
        const newFriendship = await Friend.create({ user1: user_id1, user2: user_id2 });
        console.log(newFriendship)
        if (!newFriendship) {
            throw new apiError(500, 'Error in creating friendship.');
        }

        res.status(201).json(new apiResponse(201, newFriendship, 'Friendship added.'));
    }
});
const addFriend = asyncHandler(async (req, res) => {
    const { user1, user2 } = req.body
    if (!user1 || !user1 || !isValidObjectId(user1) || !isValidObjectId(user2)) {
        throw new apiError(401, 'send userIds correctly !!')
    }
    const existingFriendship = await Friend.findOne({
        user1,
        user2,
    })
    if (existingFriendship) {
        res.status(200).json(new apiResponse(200, '', 'Already friends !!'))
    }
    const newFriendship = await Friend.create({
        user1, user2
    })
    if (!newFriendship) {
        throw new apiError(500, 'Error occured while adding friend !!')
    }
    res.status(200).json(new apiResponse(200, newFriendship, 'Friend added !!'))
})
const fetchFriends = asyncHandler(async (req, res) => {
    const user_id = req?.user._id;

    // Fetch friends where user1 or user2 matches the user_id
    const friends = await Friend.find({
        $or: [
            { user1: user_id },
            { user2: user_id }
        ]
    });

    const data = friends.map(friend => {
        return friend.user1 !== user_id ? friend.user1 : friend.user2;
    });

    // Respond with the extracted data
    res.status(200).json(new apiResponse(200, data, 'Friends fetched successfully.'));
});

export { toggleFriend,addFriend,fetchFriends };
