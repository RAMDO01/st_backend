const express = require("express")
const router = express.Router();

//import all auth controllers
const {createOtp, registration, login, logout, changePassword} = require("../controllers/Auth.controller")

//reset password controllers
const {resetPassword, generateResetPasswordToken} = require("../controllers/RestPassword.controller")

//import all middle ware
const {auth, isStudent, isAdmin, isInstructor} = require("../middlewares/auth.middleware")


router.post("/getOtp",createOtp);
router.post("/user-register",registration)
router.post("/user-login", login)
router.post("/user-logout",auth, logout)
router.put("/update-password",auth, changePassword)



//reset password router
router.post("/generate-token",generateResetPasswordToken)
router.put("/change-password",resetPassword)
const authRoute = router;
module.exports = {authRoute}