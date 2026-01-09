import { Router } from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { createCourse, createLecture, deleteLecture, editCourse, editLecture, getCourseById, getCourseLecture, getCreatorCourses, getLectureById, getPublishedCourse, searchCourse, togglePublishCourse } from "../controllers/course.controller.js";
import upload from "../utills/multer.js";


const courseRouter = Router();
courseRouter.route("/").post(isAuthenticated, createCourse);
courseRouter.route("/search").get(isAuthenticated,searchCourse)
courseRouter.route("/").get(isAuthenticated, getCreatorCourses);
courseRouter.route("/published-course").get( getPublishedCourse);
courseRouter.route("/:courseId").put(isAuthenticated, upload.single("courseThumbnail"), editCourse);
courseRouter.route("/:courseId").get(isAuthenticated, getCourseById);
courseRouter.route("/:courseId").patch(isAuthenticated,togglePublishCourse)
// Lecture Routes
courseRouter.route("/:courseId/lecture").post(isAuthenticated, createLecture);
courseRouter.route("/:courseId/lecture").get(isAuthenticated, getCourseLecture);
courseRouter.route("/:courseId/lecture/:lectureId").post(isAuthenticated, editLecture);
courseRouter.route("/lecture/:lectureId").delete(isAuthenticated, deleteLecture);
courseRouter.route("/lecture/:lectureId").get(isAuthenticated, getLectureById);


export default courseRouter;