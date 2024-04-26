const Category = require("../models/Category.model")
const {ApiError} = require("../utils/ApiError")
const {ApiResponse} = require("../utils/ApiResponse")
const {asyncHandler} = require("../utils/asyncHandler")

function getRandomInt(max){
    return Math.floor(Math.random()*max)
}

//create category
const createCategory = asyncHandler(async(req, res) => {
    try {
        //fetch the data from body
        //validate the data
        //create the category
        //return response
        
        const {name, description} = req.body;
        if(!name) {
            throw new ApiError(401,"category name is required")
        }

        const category = await Category.create({
            name:name,
            description:description
        })

        return res
        .status(200)
        .json(
            new ApiResponse(201,{},"category create success")
        )
    } catch (error) {
        throw new ApiError(500,"error in creating category")
    }
})


//show all category
const showAllCategory = asyncHandler(async(req, res) => {
    try {
        const allCategory = await Category.find({name:true})
        res.status(200)
        .json(
            new ApiResponse(201,allCategory,"all category is fetched")
        )
    } catch (error) {
        throw new ApiError(500,"error in show all category")
    }
})


//show category page details
const categoryPageDetails = asyncHandler(async(req, res) => {
    try {
        const {categoryId} = req.body;

        //get courses for the specified category
        const selectedCategory = await Category.findById(categoryId)
                                       .populate({
                                        path:"courses",
                                        match:{status: "Published"},
                                        populate:"ratingAndReviews"
                                       })
                                       .exec()
        if(!selectedCategory){
            throw new ApiError(404,"Category not found")
        }

        //handler the case when there are no courses in selected courses
        if(selectedCategory.courses.length === 0){
            throw new ApiError(404,"No courses found for the selected category")
        }

        //get courses for other category
        const categoriesExceptSelected = await Category.find({
            _id:{$ne:categoryId}
        })
        let differentCategory = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
            ._id
        ).populate({
            path:"courses",
            match:{status:"Published"}
        }).exec()

        //get top-selling courses across all categories
        const allCategories = await Category.find()
            .populate({
                path:"courses",
                match:{status:"Published"}
            }).exec()

        const allCourses = allCategories.flatMap((category) => category.courses)
        const mostSellingCourses = allCourses.sort((a,b) => b.sold - a.sold).slice(0,10)

        return res
        .status(200)
        .json(
            new ApiResponse(201,
            {
                selectedCategory,
                differentCategory,
                mostSellingCourses
            },
            "All cateory page details is fetched"
        )
        )
        } catch (error) {
        throw new ApiError(500,"error in get category page deatils")
    }
})


module.exports = {createCategory,showAllCategory, categoryPageDetails}