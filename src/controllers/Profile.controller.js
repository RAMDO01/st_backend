const Profile = require("../models/Profile.model")
const User = require("../models/User.model")
const Course = require("../models/Course.model")
const {ApiError} = require("../utils/ApiError")
const {ApiResponse} = require("../utils/ApiResponse")
const {asyncHandler} = require("../utils/asyncHandler")
const {uploadOnCloudinary, destroyFromCloudinary} = require("../utils/cloudinary")



//update the profile
const updateProfile = asyncHandler(async(req, res) => {
    try {
        const {
            firstName = "",
            lastName = "",
            dateOfBirth = "",
            about = "",
            contactNumber = "",
            gender = ""
        } = req.body;

        //find profile id
        const userDetails = await User.findById(req.user?._id);
        const profile = await Profile.findById(userDetails.additionalDetails?._id)

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                firstName,
                lastName
            }
        )

        // await user.save()

        //update the profile
        profile.dateOfBirth = dateOfBirth
        profile.about = about
        profile.contactNumber = contactNumber
        profile.gender = gender

        await profile.save();

        return res
        .status(200)
        .json(
            new ApiResponse(201,profile,"profile is update successfully")
        )
    } catch (error) {
        console.log(error)
        throw new ApiError(500,"error in updating profile")
    }
})



//delete account
const deleteAccount = asyncHandler(async(req, res) => {
    try {
        const user = await User.findById(req.user?._id);
        
        await Profile.findByIdAndDelete(user.additionalDetails)

        for(const courseId of user.courses){
            await Course.findByIdAndUpdate(
                courseId,
                { 
                    $pull: {
                        studentsEnroled : req.user._id
                    }
                },
                {new:true}
            )
        }

        //now we delete the user
        await User.findByIdAndDelete(req.user?._id);
        return res
        .status(200)
        .json(201,{},"account delete success")
    } catch (error) {
        throw new ApiError(500, "error in delete account")
    }
})


//update display picture
const updateDisplayPic = asyncHandler(async(req, res) => {
    try {
        const displayPicLocalPath = req.file?.path;
        if(!displayPicLocalPath){
            throw new ApiError(404,"image is required")
        }

        //first we delete the old pic
        const user = await User.findById(req.user?._id);
        const oldPicUrl = user.image;
        if(!oldPicUrl){
            return null
        }

        await destroyFromCloudinary(oldPicUrl,"image");

        //upload the new url
        const newDisplayPic = await uploadOnCloudinary(displayPicLocalPath, "image");

        if(!newDisplayPic.url){
            throw new ApiError(404,"display pic not upload")
        }


        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id,
            {image:newDisplayPic.secure_url},
            {new:true}
        )

        const userDetails = await User.findById(updatedUser._id).select("-password -refreshToken")


        return res
        .status(200)
        .json(
            new ApiResponse(201,userDetails, "user display pic is update")
        )

    } catch (error) {
        throw new ApiError(500, "error in display pic controller")
    }
})


//getAllUserDetails
const getAllUserDetails = asyncHandler(async(req, res) => {
    try {
        const userDetails = await User.findById(req.user?._id)
                            .populate("additionalDetails")
                            .exec();

        return res
        .status(200)
        .json(
            new ApiResponse(201, userDetails,"user deatils fetched")
        )
    } catch (error) {
        throw new ApiError(500,"error in fetch user data")
    }
})

//get enrolled Courses
const getEnrolledCourse = asyncHandler(async(req, res) => { 
    try {
        const userDetails = await User.findOne({
            _id:req.user._id
        })
        .populate({
            path:"courses",
            populate:{
                path:"courseContent",
                populate:{
                    path:"subSection",
                }
            }
        })
        .exec();


        return res
        .status(200)
        .josn(
            new ApiResponse(201,userDetails,"course is fetched")
        )

    } catch (error) {
        throw new ApiError(500, "error in fetch all enrolled courses")
    }
})


//instructor dashboard
