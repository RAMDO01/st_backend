const Course = require("../models/Course.model")
const Category = require("../models/Category.model")
const User = require("../models/User.model")
const Section = require("../models/Section.model")
const SubSection = require("../models/Subsection.model")
const {ApiError} = require("../utils/ApiError")
const {ApiResponse} = require("../utils/ApiResponse")
const {asyncHandler} = require("../utils/asyncHandler")
const {uploadOnCloudinary, destroyFromCloudinary} = require("../utils/cloudinary")
const {convertSecondsToDuration} = require("../utils/secToDuration")


//create a new course
const createCourse = asyncHandler(async(req, res) => {
    try {
        //fetch the form body
        //validate the data
        //check user is instructor
        //check category is present or not 
        //mantain the course status

        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag:_tag,
            category,
            status,
            instructions:_instructions
        } = req.body;

        const thumbnailLocalPath = req.file?.path

        //convert the tag ans intructions form stringified Array to Array
        const tag = JSON.parse(_tag)
        const instructions = JSON.parse(_instructions)


        if(
            [
                courseName,
                courseDescription,
                whatYouWillLearn,
                price, 
                tag.length,category,
                instructions.length
            ].some((field) => field.trim() === "")
        ) {
            throw new ApiError(404,"All fields are required")
        }

        if(!status || status === undefined) {
            status = "Draft"
        }

        // check user is instrctor
        const instructorDetails = await User.findById(req.user?._id,{
            accountType:"Instructor"
        })

        if(!instructorDetails) {
            throw new ApiError(404,"Instructor details not found")
        }

        //check given category is valid
        const categoryDetails = await Category.findById(category)
        if(!categoryDetails){
            throw new ApiError(404,"category details not found")
        }

        //upload the thumbnail
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath,"image")
        if(!thumbnail.secure_url){
            throw new ApiError(404,"thumbnail is not upload")
        }

        //create the course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor:instructorDetails._id,
            whatYouWillLearn:whatYouWillLearn,
            price,
            tag,
            category:categoryDetails._id,
            thumbnail:thumbnail.secure_url,
            status:status,
            instructions,
        })

        //update the user 
        const updatedUser = await User.findByIdAndUpdate(
            {_id:instructorDetails._id},
            {
                $push:{
                    courses:newCourse._id,
                }
            },
            {new:true}
        )

        //update the category
        const updatedCategory = await Category.findByIdAndUpdate(
            {_id:category},
            {
                $push:{
                    courses:newCourse._id
                }
            },
            {new:true}
        )

        //return response
        return res
        .status(200)
        .json(
            new ApiResponse(201,newCourse,"course created successfully")
        )
    } catch (error) {
        throw new ApiError(500,"error in creating courses")
    }
})

//edit course details
const editCourse = asyncHandler(async(req, res) => {
    try {
        const {courseId} = req.body;
        const updates = req.body;

        const course = await Course.findById(courseId);
        if(!course) {
            throw new ApiError(404,"course is not found")
        }

        //if thumbnail is image is found, update it
        if(req.file){
            console.log("Thumbnail update")
            const oldThumbUrl = course.thumbnail;
            await destroyFromCloudinary(oldThumbUrl,"image");
            const thumbnailLocalPath = req.file?.path;
            const thumbnail = await uploadOnCloudinary(thumbnailLocalPath,"image");
            course.thumbnail = thumbnail.secure_url;
        }

        for(const key in updates){
            if(updates.hasOwnProperty(key)) {
                if(key === "tag" || key === "instructions") {
                    course[key] = JSON.parse(updates[key])
                } else{
                    course[key] = updates[key]
                }
            }
        }

        await course.save();
        //find updated course
        const updatedCourse = await Course.findOne({
            _id:courseId,
        })
            .populate({
                path:"instructor",
                populate: {
                    path: "additionalDetails",
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path:"courseContent",
                populate: {
                    path: "subSection",
                }
            })
            .exec()

            return res
            .status(200)
            .json(
                new ApiResponse(200,updatedCourse,"course update successfully")
            )
    } catch (error) {
        throw new ApiError(500,"error in editing course")
    }
})


//get Course List
const getAllCourse = asyncHandler(async(req, res) => {
    try {
        const allCourse = await Course.find(
            {status:"Published"},
            {
                courseName:true,
                price:true,
                thumbnail:true,
                instructor:true,
                ratingAndReviews:true,
                studentsEnroled:true
            }
        ).populate("instructor")
        .exec();

        return res
        .status(200)
        .json(
            new ApiResponse(200,allCourse,"all course is fetched")
        )
    } catch (error) {
        throw new ApiError(500,"error in fetching all courses")
    }
})

//get single course details

//get course details
const getCourseDetails = asyncHandler(async(req, res) => {
    try {
        const {courseId} = req.body;
        const courseDetails = await Course.findById(courseId)
                            .populate({
                                path:"instructor",
                                populate:{
                                    path:"additionalDetails",
                                },
                            })
                            .populate("category")
                            .populate("ratingAndReviews")
                            .populate({
                                path:"courseContent",
                                populate:{
                                    path:"subSection",
                                    select:"-videoUrl"
                                }
                            })
                            .exec()
        if(!courseDetails){
            throw new ApiError(400,"course is not found")
        }

        //timeDuration
        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInseconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInseconds;
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res
        .status(200)
        .json(
            new ApiResponse(201,{courseDetails,totalDuration},"course details is fetched")
        )
    } catch (error) {
        throw new ApiError(500,"error in fetch single course details")
    }
})

//get full course details


//get a list of course for a given instructor
const getInstructorCourses = asyncHandler(async(req, res) => {
    try {
        const instructorId = req.user?._id;

        const instructorCourses = await Course.find({
            instructor: instructorId
        }).sort({createdAt: -1})

        return res
        .status(200)
        .json(
            new ApiResponse(201,instructorCourses,"all instructor courses is fetched")
        )
    } catch (error) {
        throw new ApiError(500,"falied to retrieve instructor courses")
    }
})


//delete the course
const deleteCourse = asyncHandler(async(req, res) => {
    try {
        const {courseId} = req.body;

        //find course
        const course = await Course.findById(courseId);
        if(!course){
            throw new ApiError(404,"coursee is not found")
        }

        //unenrolled student form the course
        const studentsEnrolled = course.studentsEnroled;
        for(const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId,{
                $pull:{courses:courseId}
            })
        }

        //delete section and sub-section
        const courseSection = course.courseContent;
        for(const sectionId of courseSection) {
            const section = await Section.findById(sectionId)
            if(section){
                const subSection = section.subSection
                for(const subSectionId of subSection) {
                    await SubSection.findByIdAndDelete(subSectionId)
                }
            }

            //delete the section
            await Section.findByIdAndDelete(sectionId)
        }

        //delete course
        await Course.findByIdAndDelete(courseId)

        return res
        .status(200)
        .json(
            new ApiResponse(201,{},"course is delete")
        )
    } catch (error) {
        throw new ApiError(500,"error in course deleting")
    }
})