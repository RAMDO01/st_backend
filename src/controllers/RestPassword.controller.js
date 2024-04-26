const User = require("../models/User.model")
const {ApiError} = require("../utils/ApiError")
const {ApiResponse} = require("../utils/ApiResponse")
const {asyncHandler} = require("../utils/asyncHandler")
const {mailSender} = require("../utils/mailSender")
const crypto = require("crypto")


//generate reset password token
const generateResetPasswordToken = asyncHandler(async(req, res) => {
    try {

        //fetch email from body
        //check user is present or not
        //generate token
        //make url
        //update the user with token
        //send the url by email
        //return response
        const {email} = req.body;
        if(!email) {
            throw new ApiError(404,"email is required")
        }

        const user = await User.findOne({email:email});
        if(!user) {
            throw new ApiError(404, "user not register")
        }

        const token = crypto.randomBytes(20).toString("hex");

        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 3600000

        user.save({validateBeforeSave:true})

        console.log(user);

        const url = `https://studynotion-edtect-project.vercel.app/update-password/${token}`

        await mailSender(
            email,
            "Passwor reset",
            `Your Link for email verification is ${url}. Please click this url to reset your password.`
        )

        return res
        .status(200)
        .json(
            new ApiResponse(201,token,"email is sent successfully")
        )

    } catch (error) {
        throw new ApiError(500,"error in generate reset password token")
    }
})


//change password 
const resetPassword = asyncHandler(async(req, res) => {
    try {
        const {token, password, confirmPassword} = req.body;
        if(!password || !confirmPassword) {
            throw new ApiError(404,"All fields are required")
        }

        if(!token){
            throw new ApiError(404, "token is not defined")
        }

        const userDeatils = await User.findOne({resetPasswordToken:token})
        if(!userDeatils) {
            throw new ApiError(404,"token is invalid")
        }

        if(!(userDeatils.resetPasswordExpires > Date.now())){
            throw new ApiError(404,"token is expires, please regenerate the token")
        }

        userDeatils.password = confirmPassword
        await userDeatils.save({validateBeforeSave:false})

        // await User.findOneAndUpdate(
        //     {resetPasswordToken:token},
        //     {
        //         $set:{
        //             password:confirmPassword
        //         }
        //     },
        //     {new:true}
        // )

        return res
        .status(200)
        .json(
            new ApiResponse(201,{},"password is change successfully")
        )
    } catch (error) {
        console.log(error);
        throw new ApiError(500,"error in reset password")
    }
})


module.exports = {resetPassword, generateResetPasswordToken}