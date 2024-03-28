import { User } from "../models/user.model.js";
import { apiError } from '../utils/apiError.js'
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import nodemailer from 'nodemailer';

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new apiError(500, "Something went wrong while generating referesh and access token")
    }
}


const RegisterUser = asyncHandler(async (req, res) => {
    const { username, fullName, email, password } = req.body 
if (!username || !fullName || !email || !password) {
        throw new apiError(400, 'All Fields are required !!')
    }
    const existedUser = await User.findOne(
        {
        $or: [{ username }, { email }]
        }
    )
    if (existedUser) {
        throw new apiError(409,  'User with email or Username already exist !!')
    }
    let avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new apiError(400, 'avatar required !!')
    }
    let avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new apiError(400, 'Avatar file is required !!')
    }
    console.log(avatar)
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        password,
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new apiError(500, "Internal server Error !!")
    }
    return res.status(200).json(
        new apiResponse(200, createdUser, "User created SuccessFully !!")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email) {
        throw new apiError(400, 'email & password is required !!')
    }
    const user = await User.findOne({
        email
    })

    if (!user) {
        throw new apiError(404, 'User not found !!')
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiError(401, 'Incorrect Password')
    }
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", refreshToken)
        .json(
            new apiResponse(
                200,
                {
                    user: loggedInUser,
                    refreshToken,
                    accessToken
                },
                "User Logged In successfully !!"
            )
        )
})
const logoutUser = asyncHandler(async (req, res) => {
    const id = req.user._id;
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        }, {
        new: true,
    }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken", options)
        .clearCookie("refreshToken", options).json(
            new apiResponse(200, {}, "User logged out successfully")
        )

})
const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if (!incomingRefreshToken) {
            throw new apiError(401, "unauthorized request")
        }
        // console.log(incomingRefreshToken)
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        let _id = decodedToken._id
        const user = await User.findById({ _id })
        if (!user) {
            throw new apiError(401, "invalid refresh token !!")
        }
        // console.log(user.refreshToken,user)
        if (incomingRefreshToken != user?.refreshToken) {
            throw new apiError(401, 'Refresh token is expired or used')
        }
        const options = {
            httpOnly: true,
            secure: true,
        }
        const { accessToken, newrefreshToken } = await generateAccessAndRefereshTokens(user?._id)
        return res.status(200)
            .cookie('accessToken', accessToken).
            cookie('refreshToken', newrefreshToken).json(new apiResponse(200, { accessToken, newrefreshToken }, "Access token refreshed"))
    } catch (error) {
        throw new apiError(401, error?.message || "Internal server error")
    }
})

const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    // console.log(oldPassword,newPassword,'gkhgk')
    const user_id = req.user?._id
    const user = await User.findById(user_id)
    console.log(user)
    const isPasswordCorrect = await user.isPasswrordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new apiError(400, 'Invalid old password')
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json(new apiResponse(200, {}, "Password Updated !!"))
})
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new apiResponse(200, req.user, 'User fetched successfully !!'))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new apiError(400, 'Avatar is missing')

    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new apiError(400, 'Error while updating avatar')
    }
    const person = await User.findById(req.user?._id);
    const prevUrl = person.avatar;
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }
        , { new: true }
    ).select("-password")
    deleteFromCloudinary(prevUrl)
    return res.status(200).json(new apiResponse(200, user, "avatar updated"))
})

const generateOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new apiError(400, 'Email is required.');
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
        throw new apiError(404, 'No user found with this email.');
    }

    // Generate OTP
    const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
    let otp = '';
    for (let i = 0; i < 6; i++) { // Generate a 6-character OTP
        otp += digits[Math.floor(Math.random() * digits.length)];
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: `${process.env.EMAIL}`,
            pass: `${process.env.EMAIL_PASSWORD}`,
        }
    });

    // Prepare email message
    let mailOptions = {
        from: `"BillBuddies" <${process.env.EMAIL}>`,
        to: email,
        subject: 'BillBuddies OTP',
        text: `${otp} is your OTP for password reset. Please do not share it with anyone.`,
        html: `<b>${otp}</b> is your OTP for password reset. Please do not share it with anyone.`// html body
    };

    // Send email
    await transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error in sending OTP:', err);
            throw new apiError(500, 'Error in sending OTP.');
        }
    });

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    await user.save();

    res.status(200).json(new apiResponse(200, '', 'OTP sent successfully.'));
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email, newPassword, otp } = req.body
    const user = await User.findOne({ email })
    if (!user) {
        throw new apiError(404, 'User not found!!')
    }
    if (!user.otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        throw new apiError(400, 'OTP has expired.');
    }

    if (user.otp != otp) {
        throw new apiError(400, 'Otp not matched !!')
    }
    const updatedUser = await User.findByIdAndUpdate(user._id, {
        newPassword, otp: "",
    }, { new: true }).select("-password -refreshToken")
    if (!updatedUser) {
        throw new apiError(500, 'Error in updating password')
    }
    res.status(200).json(new apiResponse(200, updatedUser, 'Password updated !!'))
})


export {
    RegisterUser,
    loginUser,
    getCurrentUser,
    refreshAccessToken,
    logoutUser,
    updateUserAvatar,
    changeUserPassword,
    generateOtp,
    forgotPassword
}
