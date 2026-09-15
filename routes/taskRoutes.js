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
