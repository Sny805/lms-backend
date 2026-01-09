import express from "express";
import upload from "../utills/multer.js";
import { uploadMedia } from "../utills/cloudinary.js";


const mediaRouter = express.Router()

mediaRouter.route("/upload-video").post(upload.single("file"), async (req, res) => {
    try {
        const result = await uploadMedia(req.file.path)
        res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            data: result
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error uploading file" })
    }
})

export default mediaRouter;