import mongoose from "mongoose";

const groupExpenseSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    to: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    description: {
        type: String,
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Ensure that the model supports sessions
groupExpenseSchema.set('session', { session: null });

export const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);
