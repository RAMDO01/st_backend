const {contactUsEmail} = require("../mail/templates/contactFormRes")
const {mailSender} = require("../utils/mailSender")
const {ApiError} = require("../utils/ApiError")
const {ApiResponse} = require("../utils/ApiResponse")
const {asyncHandler} = require("../utils/asyncHandler")

const contactUsControllers = asyncHandler(async(req, res) => {
    try {
        const {email, firstName, lastName, message, phoneNo, countrycode} = req.body;
        if(
            [email, firstName, lastName, message, phoneNo, countrycode].some((field) => field.trim() === "")
        ){
            throw new ApiError(404, "All fields are required")
        }

        const emailResponse = await mailSender(
            email,
            "Your Data send Successfully",
            contactUsEmail(email, firstName, lastName, message, phoneNo,countrycode)
        )

        return res
        .status(200)
        .json(
            new ApiResponse(201,emailResponse,"Email send successfully")
        )
    } catch (error) {
        throw new ApiError(500, "error in contact us controllers")
    }
})


module.exports = {contactUsControllers}