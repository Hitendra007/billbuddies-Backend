import mongoose from "mongoose";
const netAmountSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    netAmount: {
        type: Number,
        default:0
    },
    grpNetAmount:
        [
            {
                group: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Group'
                },
                groupNetAmount: {
                    type: Number,
                }

            }
        ],
    nonGroupAmount: {
        type: Number,
        default:0
    }

}, { timestamps: true })
export const NetAmount = mongoose.model('NetAmount', netAmountSchema);