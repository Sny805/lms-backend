import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { ApiError } from "../utills/ApiError.js";
import { asyncHandler } from "../utills/asyncHandler.js";


export const getCourseProgress = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.id;

    // fetch the user course progres 
    let courseProgress = await CourseProgress.findOne({ userId, courseId }).populate("courseId");
    const courseDetails = await Course.findById(courseId).populate("lectures")
    if (!courseDetails) {
        throw new ApiError(404, "CourseDetails Not Found")
    }
    
    /// Step-2 if no progresss found return the course
    if (!courseProgress) {
        return res.status(200).json({
            data: {
                courseDetails,
                progress: [],
                completed: false
            }
        })
    }
    // step -3 if progress return course with progress
    return res.status(200).json({
        data: {
            courseDetails,
            progress: courseProgress?.lectureProgress,
            completed: courseProgress?.completed
        }
    })


})

export const updateLectureProgress = asyncHandler(async (req, res) => {
    const { courseId, lectureId } = req.params;
    const userId = req.id

    let courseProgress = await CourseProgress.findOne({ userId, courseId })

    if (!courseProgress) {
        courseProgress = new CourseProgress({
            userId,
            courseId,
            completed: false,
            lectureProgress: []
        })
    }

    // find the lecture progress 
    const lectureIndex = courseProgress.lectureProgress.findIndex((lecture) => lecture.lectureId === lectureId);
    if (!lectureIndex == -1) {
        // if lecture is already exist , update its state
        courseProgress.lectureProgress[lectureIndex].viewed = true
    } else {
        courseProgress.lectureProgress.push({ lectureId, viewed: true })
    }

    // if all lectures completed 
    const lectureProgressLength = courseProgress.lectureProgress.filter((lecture) => lecture.viewed).length
    const course = await Course.findById(courseId)
    if (course.lectures === lectureProgressLength) {
        courseProgress.completed = true;
    }

    await courseProgress.save();

    return res.status(200).json({message:"Lecture updated successfully"})


})

export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({ courseId, userId });
    if (!courseProgress)
      return res.status(404).json({ message: "Course progress not found" });

    courseProgress.lectureProgress.map(
      (lectureProgress) => (lectureProgress.viewed = true)
    );
    courseProgress.completed = true;
    await courseProgress.save();
    return res.status(200).json({ message: "Course marked as completed." });
  } catch (error) {
    console.log(error);
  }
};

export const markAsInCompleted = async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.id;
  
      const courseProgress = await CourseProgress.findOne({ courseId, userId });
      if (!courseProgress)
        return res.status(404).json({ message: "Course progress not found" });
  
      courseProgress.lectureProgress.map(
        (lectureProgress) => (lectureProgress.viewed = false)
      );
      courseProgress.completed = false;
      await courseProgress.save();
      return res.status(200).json({ message: "Course marked as incompleted." });
    } catch (error) {
      console.log(error);
    }
  };