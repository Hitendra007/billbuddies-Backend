import mongoose from "mongoose";

const userGroupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    }
}, { timestamps: true });

// Ensure that the model supports sessions
userGroupSchema.set('session', { session: null });

export const UserGroup = mongoose.model('UserGroup', userGroupSchema);
