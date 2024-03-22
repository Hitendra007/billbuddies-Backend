import mongoose from "mongoose";
const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ]
}, { timestamps: true })
export const Group = mongoose.model('Group', groupSchema)
