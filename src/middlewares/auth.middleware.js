const jwt = require("jsonwebtoken")
const {ApiError} = require("../utils/ApiError")
const {asyncHandler} = require("../utils/asyncHandler")
const User = require("../models/User.model")


//auth middler ware
const auth = asyncHandler(async(req, res, next) => {

        const token = req.body.accessToken
                      || req.cookies?.accessToken
                      || req.header("Authorisation")?.replace("Bearer ", "")

        if(!token) {
            throw new ApiError(401,"Unauthrized request")
        }
        console.log("token ",token)
    try {
        console.log("start verify");
        const decode = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        console.log("start sucess");
        const user = await User.findById(decode?._id).select("-password -refreshToken")

        console.log(user);
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