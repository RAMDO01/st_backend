const nodemailer = require("nodemailer")
const {ApiError} = require("../utils/ApiError")

const mailSender = async(email, title, body) => {
    const transporter = nodemailer.createTransport({
        host:process.env.MAIL_HOST,
        auth:{
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    })


    try {
        let info = transporter.sendMail({
            from: 'Study-notion || code help',
            to:`${email}`,
            text:`${title}`,
            html:`${body}`
        })

        console.log("this is mail info => ",info);
        return info;
    } catch (error) {
        console.log("ERROR: error in mail sending",error);
        throw new ApiError(500, "error in mail sender")
    }
}

module.exports = {mailSender}