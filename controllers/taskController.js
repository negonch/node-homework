const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

const prisma = require("../db/prisma");

async function create(req, res, next) {
  try {
    if (!req.body) req.body = {};

    const { error, value } = taskSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const isCompleted = value.isCompleted ?? false;

    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: isCompleted,
        userId: global.user_id,
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
}

async function index(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id, // only the tasks for this user!
      },
      select: { title: true, isCompleted: true, id: true },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json(tasks);
  } catch (err) {
    return next(err);
  }
}

async function show(req, res, next) {
  try {
    const taskId = parseInt(req.params?.id);

    if (!taskId) {
      return res.status(400).json({
        message: "The task ID passed is not valid.",
      });
    }

    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: { id: true, title: true, isCompleted: true },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!req.body) req.body = {};

    const { error, value: taskChange } = patchTaskSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const taskId = parseInt(req.params?.id);

    if (!taskId) {
      return res.status(400).json({
        message: "The task ID passed is not valid.",
      });
    }

    const updatedTask = await prisma.task.update({
      data: taskChange,
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    }
    return next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const taskId = parseInt(req.params?.id);

    if (!taskId) {
      return res.status(400).json({
        message: "The task ID passed is not valid.",
      });
    }

    const deletedTask = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });

    return res.status(200).json(deletedTask);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    }
    return next(err);
  }
}

module.exports = { create, index, show, update, deleteTask, taskCounter };
