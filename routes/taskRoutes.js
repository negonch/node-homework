// POST /api/tasks -> create
// GET /api/tasks -> index
// GET /api/tasks/:id -> show
// PATCH /api/tasks/:id -> update
// DELETE /api/tasks/:id -> deleteTask

// GET / -> index
// GET /:id -> show
// POST / -> create
// PATCH /:id -> update
// DELETE /:id -> deleteTask

const express = require("express");
const taskController = require("../controllers/taskController");

const router = express.Router();

router.get("/", taskController.index);
router.get("/:id", taskController.show);
router.post("/", taskController.create);
router.patch("/:id", taskController.update);
router.delete("/:id", taskController.deleteTask);

module.exports = router;
