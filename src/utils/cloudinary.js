const cloudinary = require("cloudinary").v2;
const fs = require("fs")
const {extractPublic} = require("cloudinary-build-url")

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async(localPath, resourceType) => {
    try {
        if(!localPath) return null;
        const response = await cloudinary.uploader.upload(localPath,{
            resource_type:`${resourceType}`
        })

        // file upload successfull
        fs.unlinkSync(localPath)
        return response;
    } catch (error) {
        fs.unlinkSync(localPath)
        console.log("Error in cloudinary constroller",error)
        return null
    }
}

const destroyFromCloudinary = async(fileUrl, resourceType) => {
    try {
        if(!fileUrl) return null
        //fetch public id from url
        const publicId = extractPublic(fileUrl);

        console.log("this is public id",publicId)

        await cloudinary.uploader.destroy(publicId,{
            resource_type:`${resourceType}`
        })
        return;
    } catch (error) {
        console.log("Error in deleting old file form cloudinary",error)
    }
}

module.exports = {uploadOnCloudinary, destroyFromCloudinary}