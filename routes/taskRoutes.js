// POST /api/tasks -> create
// GET /api/tasks -> index
// GET /api/tasks/:id -> show
// PATCH /api/tasks/:id -> update task
// DELETE /api/tasks/:id -> delete task to trash bin
// GET /api/tasks/trashBin -> trash bin
// PATCH /api/tasks/:id/restore -> restore task
// DELETE /api/tasks/:id/permanent -> delete task

// GET / -> index
// GET /:id -> show
// POST / -> create
// PATCH /:id -> update
// DELETE /:id -> deleteTask

const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.get("/", taskController.index);
router.post("/", taskController.create);
router.post("/bulk", taskController.bulkCreate);
router.get("/trashBin", taskController.trashBin);
router.patch("/:id/restore", taskController.restoreTask);
router.delete("/:id/permanent", taskController.permanentlyDeleteTask);
router.get("/:id", taskController.show);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
