import mongoose from "mongoose";

const friendSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Ensure that the model supports sessions
friendSchema.set('session', { session: null });

export const Friend = mongoose.model('Friend', friendSchema);
