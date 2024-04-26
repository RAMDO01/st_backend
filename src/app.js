const cookieParser = require("cookie-parser");
const express = require("express");
const cors = require("cors");


//all routers
const {authRoute} = require("./routes/Auth.route")




const app = express()


app.use(express.json({
    limit:"20kb"
}))

app.use(express.urlencoded({extended:true, limit:"20kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
            Credential:true 
    }
))


app.use("/api/v1/study-notion",authRoute)


module.exports = {app}