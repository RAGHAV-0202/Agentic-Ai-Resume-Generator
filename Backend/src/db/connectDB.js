import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()

const connectDB = async()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}` , {
            bufferCommands : false , 
            maxPoolSize : 50 , 
            minPoolSize : 1
        })
        console.log("Connected to the DB")
    }catch(error){
        console.log("Error connecting to the Database")
    }
}

export default connectDB