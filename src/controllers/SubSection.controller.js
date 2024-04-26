const SubSection = require("../models/Subsection.model")
const Section = require("../models/Section.model")
const {ApiError} = require("../utils/ApiError")
const {ApiResponse} = require("../utils/ApiResponse")
const { asyncHandler } = require("../utils/asyncHandler")
const {uploadOnCloudinary,destroyFromCloudinary} = require("../utils/cloudinary")


//create a new sub-section for a given section
const createSubSection = asyncHandler(async(req, res) => {
    try {
        const {title, description, sectionId} = req.body;
        const videoLocalPath = req.file?.path;

        if(!title || !description || !sectionId || !videoLocalPath){
            throw new ApiError(404,"All fields are required")
        }

        const video = await uploadOnCloudinary(videoLocalPath,"video")
        if(!video.secure_url){
            throw new ApiError(400,"error in video uplading")
        }

        const newSubSection  = await SubSection.create({
            title:title,
            description:description,
            timeDuration:`${video.duration}`,
            videoUrl:video.secure_url
        })

        //update the section
        const updatedSection = await Section.findByIdAndUpdate(
            {_id:sectionId},
            {
                $push:{
                    subSection:newSubSection._id,
                }
            },
            {new:true}
        ).populate("subSection")

        return res
        .status(200)
        .json(
            new ApiResponse(201,newSubSection,"sub section is created")
        )

    } catch (error) {
        throw new ApiError(500,"error in creating sub section")
    }
})

//update the sub section
const updateSubSection = asyncHandler(async(req, res) => {
    try {
        const {sectionId, subSectionId, title, description} = req.body

        const subSection = await SubSection.findById(sectionId)
        if(!subSection){
            throw new ApiError(404,"sub section is not found")
        }

        if(title !== undefined){
            subSection.title = title
        }
        if(description !== undefined){
            subSection.description = description
        }

        if(req.file && req.file?.path !== undefined){
            const videoLocalPath = req.file?.path;

            //delete the old video
            const oldVideoUrl = subSection.videoUrl;
            await destroyFromCloudinary(oldVideoUrl,"video")

            const newVideo = await uploadOnCloudinary(videoLocalPath,"video")

            subSection.videoUrl = newVideo.secure_url
            subSection.timeDuration = `${newVideo.duration}`
        }

        await subSection.save();

        const updatedSubSection = await SubSection.findById(sectionId).populate("subSection")

        return res
        .status(200)
        .json(
            new ApiResponse(201,updatedSubSection,"Section updated successfully")
        )
    } catch (error) {
        throw new ApiError(500,"error in updating sub section")
    }
})


//delete sub section
const deleteSubSection = asyncHandler(async(req, res) => {
    try {
        const {sectionId, subSectionId} = req.body;
        await Section.findByIdAndUpdate(
            {_id:sectionId},
            {  $pull:{
                subSection:subSectionId
              }
            },
            {new:true}
        )

        await SubSection.findByIdAndDelete(subSectionId);

        const updatedSection = await Section.findById(sectionId);

        return res
        .status(200)
        .json(
            new ApiResponse(201,updatedSection,"sub section delete successfully")
        )
    } catch (error) {
        throw new ApiError(500,"error in deleting subsection")
    }
})