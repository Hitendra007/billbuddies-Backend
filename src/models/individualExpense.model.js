import mongoose from "mongoose";

const indivialExpenseSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    description:{
        type:String,
        required:true,
    },
    amount: {
        type: Number
    }
}, { timestamps: true });

// Ensure that the model supports sessions
indivialExpenseSchema.set('session', { session: null });

export const IndividualExpense = mongoose.model('IndividualExpense', indivialExpenseSchema);
