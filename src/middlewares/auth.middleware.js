const jwt = require("jsonwebtoken")
const {ApiError} = require("../utils/ApiError")
const {asyncHandler} = require("../utils/asyncHandler")
const {User} = require("../models/User.model")


//auth middler ware
const auth = asyncHandler(async(req, res, next) => {
    try {
        const token = req.body.token || req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if(!token) {
            throw new ApiError(401,"Unauthrized request")
        }

        const decode = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decode?._id).select("-password -refreshToken")

        if(!user) {
            throw new ApiError(401, "invalid access token requrest")
        }

        req.user = user
        next()
         
    } catch (error) {
        throw new ApiError(401,"invalid access token")
    }
})

// student middler ware
const isStudent = asyncHandler(async(req, res, next) => {
        if(req.user?.accountType !== "Student" ) {
            throw new ApiError(401, "this router only for student")
        }
        next();
})

//is admin middle ware
const isAdmin = asyncHandler(async(req, res, next) => {
        if(req.user?.accountType !== "Admin" ) {
            throw new ApiError(401, "this router only for admin")
        }
        next();
})

//is instructor middle ware
const isInstructor = asyncHandler(async(req, res, next) => {
        if(req.user?.accountType !== "Instructor" ) {
            throw new ApiError(401, "this router only for instructor")
        }
        next();
})

module.exports = {auth, isAdmin, isInstructor, isStudent}