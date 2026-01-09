import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { asyncHandler } from "../utills/asyncHandler.js";
import { deleteMediaFromCloudinary, deleteVideoFromCloudinary, uploadMedia } from "../utills/cloudinary.js";



export const createCourse = asyncHandler(async (req, res) => {
    try {
        const { courseTitle, category } = req.body;

        if (!courseTitle || !category) {
            throw new ApiError(400, "Course title and Category is required")
        }

        const course = await Course.create({
            courseTitle,
            category,
            creator: req.id
        })

        return res.status(201).json(new ApiResponse(201, course, "Course Created SuccessFully"))

    } catch (error) {
        throw new ApiError(500, "Failed to create course")
    }

})

export const searchCourse = asyncHandler(async (req, res) => {
    const { query = "", categories = [], sortByPrice = "" } = req.query;

    // create searchQuery 
    const SearchCriteria = {
        isPublished: true,
        $or: [
            { courseTitle: { $regex: query, $options: "i" } },
            { subTitle: { $regex: query, $options: "i" } },
            { category: { $regex: query, $options: "i" } },
        ]
    }

    // if categories selected
    if (categories.length > 0) {
        SearchCriteria.category = { $in: categories }
    }

    // define sorting order 
    const sortOptions = {};
    if (sortByPrice === "low") {
        sortOptions.coursePrice = 1
    }
    else if (sortByPrice === "high") {
        sortOptions.coursePrice = -1
    }

    let courses = await Course.find(SearchCriteria).populate({ path: "creator", select: "name photoUrl" }).sort(sortOptions);

    return res.status(200).json({
        success: true,
        courses: courses || []
    })
})


export const getCreatorCourses = asyncHandler(async (req, res) => {
    try {
        const userId = req.id;
        const courses = await Course.find({ creator: userId });
        if (!courses) {
            throw new ApiError(404, "Course Not Found")
        }
        return res.status(200).json({ courses })
    } catch (error) {
        throw new ApiError(500, "Failed to get creator courses")
    }

})


export const editCourse = asyncHandler(async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { courseTitle, subTitle, description, category, courseLevel, coursePrice } = req.body;
        const thumbnail = req.file;
        let course = await Course.findById(courseId);

        if (!course) {
            throw new ApiError(404, "Course Not Found");
        }
        let courseThumbnail;
        if (thumbnail) {
            if (course.courseThumbnail) {
                const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
                await deleteMediaFromCloudinary(publicId)
            }
            courseThumbnail = await uploadMedia(thumbnail.path)
        }
        const updateData = { courseTitle, subTitle, description, category, courseLevel, coursePrice, courseThumbnail: courseThumbnail?.secure_url };

        course = await Course.findByIdAndUpdate(courseId, updateData, { new: true });

        return res.status(200).json(new ApiResponse(200, course, "Course Updated Successfully"))

    } catch (error) {
        throw new ApiError(500, "Failed to edit course")
    }


})

export const getCourseById = asyncHandler(async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        if (!course) {
            throw new ApiError(404, "Course not found")
        }
        return res.status(200).json({ course });

    } catch (error) {
        throw new ApiError(500, "Failed to get course by id")
    }


})

export const getPublishedCourse = asyncHandler(async (req, res) => {
    const courses = await Course.find({ isPublished: true }).populate({ path: "creator", select: "fullName photoUrl" });
    if (!courses) {
        throw new ApiError(404, "Course not found")
    }
    return res.status(200).json({ courses })
})

///// Lecture Controller 

export const createLecture = asyncHandler(async (req, res) => {
    try {
        const { lectureTitle } = req.body;
        const { courseId } = req.params;

        if (!lectureTitle || !courseId) {
            throw new ApiError(400, "Lecture title and course id is required")
        }
        // create lecture
        const lecture = await Lecture.create({ lectureTitle });
        const course = await Course.findById(courseId);

        if (course) {
            course.lectures.push(lecture._id);
            await course.save()
        }

        return res.status(201).json({
            lecture,
            message: "Lecture created successfully"
        })
    } catch (error) {
        throw new ApiError(500, "Failed to create lecture")
    }
})


export const getCourseLecture = asyncHandler(async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId).populate("lectures");

        if (!course) {
            throw new ApiError(400, "No course found")
        }

        const lectures = course.lectures;

        return res.status(200).json({ lectures })

    } catch (error) {
        throw new ApiError(500, "Failed to get course lecture")
    }
})

export const editLecture = asyncHandler(async (req, res) => {
    try {
        const { lectureTitle, videoInfo, isPreviewFree } = req.body;
        const { courseId, lectureId } = req.params;
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            throw new Error(404, "Lecture not found")
        }
        if (lectureTitle) lecture.lectureTitle = lectureTitle;
        if (videoInfo?.videoUrl) lecture.videoUrl = videoInfo.videoUrl;
        if (videoInfo?.publicId) lecture.publicId = videoInfo.publicId;
        lecture.isPreviewFree = isPreviewFree;
        await lecture.save();

        // Ensure course still has the lecture id and if it was not already added
        const course = await Course.findById(courseId);
        if (!course) {
            throw new ApiError(404, "Course Not Found")
        }
        if (course && !course.lectures.includes(lecture._id)) {
            course.lectures.push(lectureId)
            await course.save();
        }

        return res.status(200).json(new ApiResponse(200, lecture, "Lecture Updated Successfully"))


    } catch (error) {
        throw new Error(500, "Failed to edit lecture")
    }
})


export const deleteLecture = asyncHandler(async (req, res) => {
    try {
        const { lectureId } = req.params;
        const lecture = await Lecture.findByIdAndDelete(lectureId)
        if (!lecture) {
            throw new Error(404, "Lecture not found")
        }
        // delete the lecture from cloudinary
        if (lecture.publicId) {
            await deleteVideoFromCloudinary(lecture.publicId);
        }
        // Remove the lecture reference from the associated course 
        await Course.updateOne(
            { lecture: lectureId },// find the course that contains the lecture
            { $pull: { lectures: lectureId } } // Remove the lecture from course
        )
        return res.status(200).json({ message: "Lecture deleted  successfully" })
    } catch (error) {
        throw new Error(500, "Failed to delete lecture")
    }
})


export const getLectureById = asyncHandler(async (req, res) => {
    try {
        const { lectureId } = req.params;
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({
                message: "Lecture not found!"
            });
        }
        return res.status(200).json({
            lecture
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Failed to get lecture by id"
        })
    }
})

// publish unpublish course logic 

export const togglePublishCourse = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { publish } = req.query;
    console.log(publish)
    const course = await Course.findById(courseId);
    if (!course) {
        throw new ApiError(404, "Course not Found")
    }
    // publish status based on the query parameter
    const isPublished = publish === "true";
    course.isPublished = isPublished;
    await course.save();
    return res.status(200).json({
        message: `Course is ${isPublished ? "Published" : "Unpublished"}`,
    });
})
