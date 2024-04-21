const dotenv = require("dotenv")
const {connectDB} = require("./db/index")
const {app} = require("./app")


dotenv.config({
    path:'./env'
})

connectDB()
.then(() => {
    app.listen(process.env.PORT || 4000, () => {
        console.log(`App is running at port no ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("db connection failed !!!",error)
})