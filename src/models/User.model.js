// Import the Mongoose library
const mongoose = require("mongoose")

//import the bcrypt package for encrypting password
const bcrypt = require("bcrypt")

//import the json web token for generate token
const jwt = require("jsonwebtoken")

// Define the user schema using the Mongoose Schema constructor
const userSchema = new mongoose.Schema(
  {
    // Define the name field with type String, required, and trimmed
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    // Define the email field with type String, required, and trimmed
    email: {
      type: String,
      required: true,
      trim: true,
    },

    // Define the password field with type String and required
    password: {
      type: String,
      required: true,
    },
    // Define the role field with type String and enum values of "Admin", "Student", or "Visitor"
    accountType: {
      type: String,
      enum: ["Admin", "Student", "Instructor"],
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    approved: {
      type: Boolean,
      default: true,
    },
    additionalDetails: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Profile",
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    refreshToken : {
      type:String,
    },
    image: {
      type: String,
    },
    courseProgress: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "courseProgress",
      },
    ],

    // Add timestamps for when the document is created and last modified
  },
  { timestamps: true }
)


//hash the password before the user registration
userSchema.pre("save" , async function(next) {
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password,10)
  next()
})


//make methode to check password incorrect or not
userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password)
} 


//make methode to generate the token 
//generate access token
userSchema.methods.generateAccessToken = async function() {
  return jwt.sign(
    {
      _id:this._id,
      email:this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

//generate refresh token
userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id:this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}



// Export the Mongoose model for the user schema, using the name "user"
module.exports = mongoose.model("user", userSchema)
