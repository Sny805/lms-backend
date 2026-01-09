import mongoose from "mongoose";
import { DB_NAME } from "../constatnts.js";

const connectDB = async () => {

    try {
        const dbinstant = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MongoDb connected !! DB HOST :${dbinstant.connection.host} `);
    }
    catch (err) {
        console.error("MONGO connection ERROR :", err)
        process.exit(1)
    }

}

export default connectDB;