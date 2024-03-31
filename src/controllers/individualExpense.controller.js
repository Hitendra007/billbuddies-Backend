import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { IndividualExpense } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { NetAmount } from "../models/netAmount.model.js";
import { Friend } from "../models/friend.model.js";

const addIndividualExpense = asyncHandler(async (req, res) => {
    const { paid_by, paid_to, amount, description } = req.body
    if (!paid_by || !paid_to || !mongoose.isValidObjectId(paid_by) || !mongoose.isValidObjectId(paid_to) || !amount || !description) {
        throw new apiError(401, 'send user ids to add expense and amount !!')
    }
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const newexpense = await IndividualExpense.create({
            from: paid_by,
            to: paid_to,
            amount,
            description
        }).session(session)
        if (!newexpense) {
            session.abortTransaction()
            session.endSession()
            throw new apiError(500, 'error occured while creating new entry !!')
        }

        const netAmountEntry = await NetAmount.findOne({
            from: paid_by,
            to: paid_to,
        }).session(session)
        if (!netAmountEntry) {
            const newNetAmountEntry = await NetAmount.create({
                from: paid_by,
                to: paid_to,
                amount
            })
            if (!newNetAmountEntry) {
                session.abortTransaction()
                session.endSession()
                throw new apiError(500, 'cannot add expense try again !!')
            }
        }
        else {
            netAmountEntry.netAmount += amount;
            netAmountEntry.nonGroupAmount += amount;
            const entry = await netAmountEntry.save()
            if (!entry) {
                session.abortTransaction()
                session.endSession()
                throw new apiError(500, 'Error occured while updating netamounts - individual net amount !!')
            }
        }
        session.commitTransaction()
        session.endSession()
        res.status(200).json(new apiResponse(200, newexpense, 'new Individual Expnese added !!'))
    } catch (error) {
        session.abortTransaction()
        session.endSession();
        throw new apiError(500, 'Error occured while adding new expense .Try again !!')
    }
})
const allExpenses = asyncHandler(async(req,res)=>{
      const user_id = req?.user._id
      const MoneyYouGet = await NetAmount.find({
        from:user_id,
      })
      if(!MoneyYouGet)
      {
        throw new apiError(404,'no expense found')
      }
      const MoneyYouHaveToPay = await NetAmount.find({
        to:user_id
      })
      if(!MoneyYouHaveToPay)
      {
        throw new apiError(404,'no expense found')
      }
      res.status(200).json(new apiResponse(200,{MoneyYouGet,MoneyYouHaveToPay},'All expenses Fetched !!'))
})
export {
    addIndividualExpense,
    allExpenses
}