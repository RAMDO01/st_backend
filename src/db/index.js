const mongoose = require("mongoose")
const {DB_NAME} = require("../constant")
require("dotenv").config()

const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_DB_URL}/${DB_NAME}`);
        console.log(`Mongo db is connected !!! Host is ${connectionInstance.connection.host}`)
        // console.log("Db connection success")
    } catch (error) {
        console.log("Error in db connection",error)
        process.exit(1); 
    }
}

module.exports = {connectDB}