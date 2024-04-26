const User = require("../models/User.model")
const OTP = require("../models/OTP.model")
const Profile = require("../models/Profile.model")
const otpGenerator = require("otp-generator")
const {ApiError} = require("../utils/ApiError")
const {ApiResponse} = require("../utils/ApiResponse")
const {asyncHandler} = require("../utils/asyncHandler")


//generate the access token and refresh token
const generateTokenAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(404,"error in generating access and refresh token")
    }

}


//generate the otp and save in db
const createOtp = asyncHandler(async(req, res) => {
    try {

        //fetch email form frontend 
        //check user is already exists
        //generate otp 
        //check if same otp is generate 
        //then regerate the opt
        //create otp object
        //save in document
        //send successfull response
        const {email} = req.body;
        if(!email){
            throw new ApiError(404, "email is required ")
        }

        const userExists = await User.find({email})
        if(!userExists) {
            throw new ApiError(404,"user is already exists")
        }

        const otp = await otpGenerator.generate(6,{
            lowerCaseAlphabets:false,
            upperCaseAlphabets: false,
            specialChars:false
        })

        const result = await OTP.findOne({otp:otp});
        while(result) {
            otp = await otpGenerator.generate(6,{
                lowerCaseAlphabets:false,
                upperCaseAlphabets: false,
                specialChars:false
            })
        }

        const otpPayload = {email, otp};

        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        return res
        .status(200)
        .json(
            new ApiResponse(201,otpBody,"opt is created")
        )

    } catch (error) {
        throw new ApiError(500, "error in otp generator",error)
    }
})

//sign up

const registration = asyncHandler(async(req, res) => {
    try {
        //fetch the data from the body
        //validate the data
        //match the password
        //check user is already exists
        //match the otp
        //create user
        //and save
        //return response

        const {firstName, 
            lastName, 
            email, 
            password, 
            confirmPassword, 
            accountType, 
            otp 
        } = req.body
        if(
            [firstName, 
                lastName, 
                email, 
                password, 
                confirmPassword, 
                accountType, 
                otp
            ].some((field) => field?.trim() === "")
        ) {
            throw new ApiError(404, "all fields are required")
        }

        if(password !== confirmPassword) {
            throw new ApiError(401, "Password is not matched")
        }

        const userExists = await User.findOne({email:email});
        if(userExists){
            throw new ApiError(404,"user is allready exists")
        }

        //find the otp and match
        const response = await OTP.findOne({email:email}).sort({createdAt: -1}).limit(1)

        console.log("this is otp response ",response)
        if(response.lenght === 0){
            throw new ApiError(404, "The OTP is not valid")
        } else if(otp !== response[0].otp){
            throw new ApiError(404,"otp is wrong")
        }

        let approved = ""
        approved === "Instructor" ? (approved = false) : (approved = true)

        //create the profile
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null
        })

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            accountType:accountType,
            approved:approved,
            additionalDetails:profileDetails._id,
            image:""
        })

        const createdUser = await User.findById(user._id).select("-password -resetPasswordToken -refreshToken")

        if(!createdUser) {
            throw new ApiError(404,"occure error while user creating")
        }
        return res
        .status(200)
        .json(
            new ApiResponse(201,createdUser,"user is created")
        )

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "error in user registration",error)
    }
})


//login
const login = asyncHandler(async(req, res) => {
    try {
        //fetch the data form body
        //vaidate the data
        //user is exists
        //match the password
        //generate the token
        //set the token in cookies
        //return response

        const {email, password} = req.body
        if(!email || !password) {
            throw new ApiError(404,"All fields are required")
        }

        const userExists = await User.findOne({email:email});
        if(!userExists) {
            throw new ApiError(404,"user is not exists! please signup first")
        }

        const isPasswordVerify = userExists.isPasswordCorrect(password);
        if(!isPasswordVerify) {
            throw new ApiError(404,"Password is incorect")
        }

        const {accessToken, refreshToken} = await generateTokenAndRefreshToken(userExists._id);
        const loggedUser = await User.findById(userExists._id).select("-password -refreshToken -resetPasswordToken");


        //send the token in cookie
        const options = {
            httpOnly : true,
            secure:true
        }

        return res
        .status(200)
        .cookie("accessToken",accessToken, options)
        .cookie("refreshToken",refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                    user:loggedUser, accessToken, refreshToken
                },
                "User is logged in successfull"
            )
        )


    } catch (error) {
        throw new ApiError(500, "error in user login")
    }
})

//logout
const logout = asyncHandler(async(req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    refreshToken : undefined,
                }
            },
            {new:true}
        )

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new ApiResponse(201,{}, "user is logged out")
        )
    } catch (error) {
        throw new ApiError(500, " error in logout controller")
    }
})


//change password
const changePassword = asyncHandler(async(req, res) => {
    try {
        //fetch the data form body
        //validate the data
        //match the password
        //update the user with new password
        //return response

        const {password, newPassword, confirmNewPassword} = req.body
        if(!password || !newPassword || !confirmNewPassword) {
            throw new ApiError(404, "All fields are required")
        }

        if(newPassword !== confirmNewPassword) {
            throw new ApiError(404, "Password is not match")
        }

        const user = await User.findById(req.user?._id)
        if(!user){
            throw new ApiError(404, "User is not found")
        }

        const isPasswordVerify = await user.isPasswordCorrect(password);
        if(!isPasswordVerify) {
            throw new ApiError(404, "Password is incorrect")
        }

        user.password = newPassword
        await user.save({validateBeforeSave:false})

        // const updatedUser = await User.findByIdAndUpdate(
        //     req.user?._id,
        //     {
        //         $set:{
        //             password:newPassword,
        //         }
        //     },
        //     {new:true}
        // )

        return res
        .status(200)
        .json(
            new ApiResponse(201,{},"Password is update")
        )

    } catch (error) {
        console.log(error);
        throw new ApiError(500, "error in change password")
    }
})

module.exports = {
    createOtp, 
    registration, 
    login,
    logout,
    changePassword
}