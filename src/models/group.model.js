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
            required:true,
        }
    ]
}, { timestamps: true });

// Ensure that the model supports sessions
groupSchema.set('session', { session: null });

export const Group = mongoose.model('Group', groupSchema);
