import { Group } from "../models/group.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { GroupExpense } from "../models/groupExpense.model.js";
import { Friend } from '../models/friend.model.js'
import { User } from "../models/user.model.js";
import { NetAmount } from "../models/netAmount.model.js";
import { UserGroup } from "../models/UserAndGroup.model.js";
const createGroup = asyncHandler(async (req, res) => {
    const { groupName, members } = req.body;
    const user_id = req?.user._id
    if (!groupName || !members) {
        throw new apiError(400, 'Please provide a group name and members.');
    }
    if (!Array.isArray(members) || members.length < 2) {
        throw new apiError(400, 'At least 2 members are required. Send array of members');
    }
    members.push(user_id)
    const group = await Group.create({
        groupName,
        members
    });

    // If group creation fails, throw an error
    if (!group) {
        throw new apiError(500, 'Error in creating group.');
    }

    // Initialize a flag to track if all user-group entries are created successfully
    let success = true;

    // Add each member to the UserGroup schema
    for (const member of members) {
        try {
            await UserGroup.create({
                user: member,
                group: group._id
            });
        } catch (error) {
            // If an error occurs while creating user-group entry, set success flag to false
            success = false;
            // Log the error or perform any necessary actions
            console.error('Error occurred while creating user-group entry:', error.message);
            // Rollback: Delete the created group and break out of the loop
            await Group.findByIdAndDelete(group._id);
            break;
        }
    }

    if (success) {
        // If all user-group entries are created successfully, respond with success message and created group
        res.status(201).json(new apiResponse(201, group, 'Group created successfully.'));
    } else {
        // If any user-group entry creation fails, respond with an error message
        throw new apiError(500, 'Error occurred while creating user-group entries.');
    }
});


// const fetchUserGroup = asyncHandler(async (req, res) => {
//     const user_id = req?.user._id
//     const groups = await UserGroup.find({
//         user: user_id
//     });

//     if (!groups) {
//         throw new apiError(404, 'No groups found!!');
//     }

//     res.status(200).json(new apiResponse(200, groups, 'Groups fetched!!'));
// });
const fetchUserGroup = asyncHandler(async (req, res) => {
    const user_id = req?.user._id;

    // Fetch group IDs associated with the user
    const userGroups = await UserGroup.find({
        user: user_id
    });

    if (!userGroups) {
        throw new apiError(404, 'No groups found!!');
    }

    // Extract group IDs from userGroups
    const groupIds = userGroups.map(userGroup => userGroup.group);

    // Fetch full details of each group using group IDs
    const groups = await Group.find({
        _id: { $in: groupIds }
    });

    if (!groups) {
        throw new apiError(404, 'No groups found!!');
    }

    res.status(200).json(new apiResponse(200, groups, 'Groups fetched!!'));
});

const addMembertogroup = asyncHandler(async (req, res) => {
    const { user_id, group_id } = req.body;

    // Validate user_id and group_id
    if (!user_id || !group_id || !mongoose.isValidObjectId(user_id) || !mongoose.isValidObjectId(group_id)) {
        throw new apiError(401, 'Send valid user and group id, required !!');
    }

    // Start a database transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the group
        const group = await Group.findById(group_id);
        if (!group) {
            throw new apiError(404, 'No group found with this id');
        }

        // Find the user
        const user = await User.findById(user_id);
        if (!user) {
            throw new apiError(404, 'User not found !!');
        }

        // Get the current members of the group
        const members = group.members;

        // Find all friendships involving the user
        const friendships = await Friend.find({ $or: [{ user1: user_id }, { user2: user_id }] });

        // Extract the friend IDs
        const friendIds = friendships.flatMap(friendship => {
            return friendship.user1.toString() === user_id ? friendship.user2 : friendship.user1;
        });

        // Find non-friends from the group members
        const nonfriends = members.filter(member => !friendIds.includes(member.toString()));

        // Add non-friends as friends
        for (const nonfriend of nonfriends) {
            const newFriend = await Friend.create([{
                user1: user_id,
                user2: nonfriend
            }], { session: session });
            if (!newFriend) {
                throw new apiError(500, 'Unable to add friend in group membership!!');
            }
        }

        // Update group members
        const newMembers = [...members, user_id];
        const newMemberadded = await Group.findByIdAndUpdate(group_id, { members: newMembers }, { new: true, session: session });
        if (!newMemberadded) {
            throw new apiError(500, 'Problem in adding a new member to group !!');
        }

        // Create group expenses
        for (const mem of newMembers) {
            const grpExpFromNewToOldMembers = await GroupExpense.create([{
                from: user_id,
                to: mem,
                group: group_id,
                amount: 0
            }], { session: session });
            const grpExpFromOldToNewMemeber = await GroupExpense.create([{
                from: mem,
                to: user_id,
                group: group_id,
                amount: 0
            }], { session: session });
            if (!grpExpFromNewToOldMembers || !grpExpFromOldToNewMemeber) {
                throw new apiError(500, 'Error while adding initial expense for the new member !!');
            }
        }

        // Create entry in UserGroup schema
        const newEntry = await UserGroup.create([{
            group: group_id,
            user: user_id
        }], { session: session });
        if (!newEntry) {
            throw new apiError(500, 'Error occured while creating entry into user-group schema');
        }

        // Commit the transaction
        await session.commitTransaction();

        // Close the session
        session.endSession();

        res.status(200).json(new apiResponse(200, newMemberadded, 'Added successfully'));
    } catch (error) {
        // Rollback the transaction on error
        await session.abortTransaction();

        // Close the session
        session.endSession();

        // Forward the error to the error handling middleware
        throw new apiError(500, 'Failed !!');
    }
});


const addgroupExpense = asyncHandler(async (req, res) => {
    const { group_id, moneyToMembers, paidby, description } = req.body;

    if (!group_id || !mongoose.isValidObjectId(group_id) || !moneyToMembers || !description || !paidby || !mongoose.isValidObjectId(paidby)) {
        throw new apiError(401, 'Please provide valid group id, money to members array, and paid by user id');
    }

    const session = await mongoose.startSession();
    if (!session) {
        throw new apiError(401, 'Failed to start session for transaction');
    }

    session.startTransaction();

    try {
        const group = await Group.findById(group_id).session(session);
        if (!group) {
            throw new apiError(404, 'No group found with this id');
        }

        const paidByUser = await User.findById(paidby).session(session);
        if (!paidByUser) {
            throw new apiError(404, 'No user found for the payer');
        }

        for (const mem of moneyToMembers) {
            const id = mem._id;
            const amount = mem.amount;

            const newEntry = await GroupExpense.create([{
                from: paidby,
                to: id,
                group: group_id,
                description,
                amount
            }], { session: session });

            if (!newEntry) {
                throw new apiError(500, 'Error occurred while adding expense');
            }

            let netAmount = await NetAmount.findOne({
                from: paidby,
                to: id,
            }).session(session);

            if (!netAmount) {
                netAmount = await NetAmount.create([{
                    from: paidby,
                    to: id,
                    netAmount: amount,
                    grpNetAmount: [{
                        group: group_id,
                        groupNetAmount: amount
                    }],
                    nonGroupAmount: 0
                }], { session: session });
            } else {
                netAmount.netAmount += amount;

                const groupIndex = netAmount.grpNetAmount.findIndex(group => group.group.toString() === group_id);
                if (groupIndex === -1) {
                    netAmount.grpNetAmount.push({
                        group: group_id,
                        groupNetAmount: amount
                    });
                } else {
                    netAmount.grpNetAmount[groupIndex].groupNetAmount += amount;
                }

                const savedNetAmount = await netAmount.save({ session: session });
                if (!savedNetAmount) {
                    throw new apiError(500, 'Error occurred while saving net expense');
                }
            }
        }

        await session.commitTransaction();
        session.endSession();
        res.status(200).json(new apiResponse(200, '', 'Expense Added'));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new apiError(500, `Error occurred while adding new expenses -- ${error?.message}`);
    }
});


const fetchNetAmountYouGive = asyncHandler(async (req, res) => {
    const { to } = req.body;
    const user_id = req.user._id;

    const netAmount = await NetAmount.findOne({ from: user_id, to });

    if (!netAmount) {
        return res.status(200).json(new apiResponse(200, {}, 'No transaction happened'));
    }

    return res.status(200).json(new apiResponse(200, netAmount, 'Fetched successfully'));
});

const fetchNetAmountYouGot = asyncHandler(async (req, res) => {
    const { from } = req.body;
    const user_id = req.user._id;

    const netAmount = await NetAmount.findOne({ from, to: user_id });

    if (!netAmount) {
        return res.status(200).json(new apiResponse(200, {}, 'No transaction happened'));
    }

    return res.status(200).json(new apiResponse(200, netAmount, 'Fetched successfully'));
});

const fetchgroupInfo = asyncHandler(async (req, res) => {
    const { group_id } = req.body;
    const user_id = req?.user._id;

    // Validate group_id
    if (!group_id || !mongoose.isValidObjectId(group_id)) {
        throw new apiError(401, 'Please send groupId correctly !!');
    }

    // Find the group by ID
    const group = await Group.findById(group_id);
    if (!group) {
        throw new apiError(400, 'No group found with this ID.');
    }

    // Find group expenses
    const groupExpenses = await GroupExpense.find({ group: group_id });
    if (!groupExpenses) {
        throw new apiError(404, 'No group expenses found.');
    }

    // Filter members excluding the current user
    const members = group.members.filter(mem => mem !== user_id);

    // Find net amounts paid by the current user to other members
    const paidbyme = await NetAmount.find({ from: user_id, to: { $in: members }, group: group_id });
    if (!paidbyme) {
        throw new apiError(500, 'Error occurred while fetching net amounts paid by the current user.');
    }

    // Find net amounts paid to the current user by other members
    const paidtome = await NetAmount.find({ from: { $in: members }, to: user_id, group: group_id });
    if (!paidtome) {
        throw new apiError(500, 'Error occurred while fetching net amounts paid to the current user.');
    }

    // Calculate net amounts user gets and owes
    const Iget = [];
    const Ihavetogive = [];

    members.forEach(member => {
        let amtGet = 0;
        let amtGive = 0;

        paidbyme.forEach(payment => {
            if (payment.to.toString() === member.toString()) {
                amtGet += payment.amount;
            }
        });

        paidtome.forEach(payment => {
            if (payment.from.toString() === member.toString()) {
                amtGive += payment.amount;
            }
        });

        Iget.push({ amount: amtGet, from: member });
        Ihavetogive.push({ amount: amtGive, from: member });
    });

    // Calculate net payment for each member
    const netpay = members.map(member => {
        const amountGet = Iget.find(item => item.from.toString() === member.toString())?.amount || 0;
        const amountGive = Ihavetogive.find(item => item.from.toString() === member.toString())?.amount || 0;
        return { member, net: amountGet - amountGive };
    });

    // Respond with the fetched data
    res.status(200).json(new apiResponse(200, { group, groupExpenses, paidbyme, paidtome, Iget, Ihavetogive, netpay }, 'Group information fetched successfully.'));
});


export { createGroup, addMembertogroup, fetchUserGroup, addgroupExpense, fetchNetAmountYouGive, fetchNetAmountYouGot, fetchgroupInfo };
