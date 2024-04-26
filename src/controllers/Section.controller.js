const Section = require("../models/Section.model")
const Course = require("../models/Course.model")
const SubSection = require("../models/Subsection.model")
const {ApiError} = require("../utils/ApiError")
const {ApiResponse} = require("../utils/ApiResponse")
const {asyncHandler} = require("../utils/asyncHandler")


//create section
const createSeciton = asyncHandler(async(req, res) => {
    try {
        const {sectionName, courseId} = req.body;
        if(!sectionName || !courseId){
            throw new ApiError(404,"missing required properties")
        }

        const newSection = await Section.create({sectionName})

        //add the new section to the course's contenet
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push:{
                    courseContent:newSection._id,
                }
            },
            {new:true}
        )
            .populate({
                path:"courseContnt",
                populate:{
                    path:"subSection",
                }
            })
            .exec()

    
        return res
        .status(200)
        .json(
            new ApiResponse(201,updatedCourse,"Section is created susscessfully")
        )
    } catch (error) {
        throw new ApiError(500,"error in creating section")
    }
})

//update section
const updatedSection = asyncHandler(async(req, res) => {
    try {
        const {sectionName, sectionId, courseId} = req.body;

        const section = await Section.findByIdAndUpdate(
            sectionId,
            {sectionName},
            { new:true }
        )

        const course = await Course.findById(courseId)
                        .populate({
                            path: "courseContent",
                            populate:{
                                path:"subSection"
                            }
                        })
                        .exec()

        return res
        .status(200)
        .json(
            new ApiResponse(201,{section,course},"section is updated successfully")
        )
    } catch (error) {
        throw new ApiError(500,"error in updating section")
    }
})

//delete section

const deleteSection = asyncHandler(async(req, res) => {
    try {
        const {sectionId, courseId} = req.body;

        //first we pull the all section id form course
        //delete the subsection
        //delete the section
        //update the course
        //return response
        await Course.findByIdAndUpdate(courseId,
        {
            $pull:{
                courseContent:sectionId,
            }
        },{new:true})

        const section = await Section.findById(sectionId)

        if(!section){
            throw new ApiError(404,"section is not found")
        }

        await SubSection.deleteMany({_id:{ $in:section.subSection }})
        await Section.findByIdAndDelete(sectionId)

        const course = await Course.findById(courseId)
                        .populate(({
                            path:"courseContent",
                            populate:{
                                path:"subSection"
                            }
                        }))
                        .exec()
        return res
        .status(200)
        .json(201,course,"section is deleted")

    } catch (error) {
        throw new ApiError(500,"error in deleting section")
    }
})