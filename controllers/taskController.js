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
        userId: req.user.id,
        priority: value.priority,
      },
      select: {
        title: true,
        isCompleted: true,
        id: true,
        priority: true,
      },
    });

    return res.status(201).json(task);
  } catch (err) {
    return next(err);
  }
}

const getOrderBy = (query) => {
  const validSortFields = [
    "title",
    "priority",
    "createdAt",
    "id",
    "isCompleted",
  ];

  const sortBy = query.sortBy || "createdAt";

  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

  if (validSortFields.includes(sortBy)) {
    return {
      [sortBy]: sortDirection,
    };
  }
  return {
    createdAt: "desc",
  };
};

async function index(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1) {
      return res.status(400).json({
        error: "Page must be at least 1",
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Limit must be between 1 and 100",
      });
    }

    if (req.query.find && req.query.find.trim().length < 2) {
      return res.status(400).json({
        error: "Search query must be at least 2 characters long",
      });
    }
    const skip = (page - 1) * limit;
    const whereClause = { userId: req.user.id };

    if (req.query.find) {
      whereClause.title = {
        contains: req.query.find,
        mode: "insensitive",
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: getOrderBy(req.query),
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        error: "No tasks found",
      });
    }

    const totalTasks = await prisma.task.count({
      where: whereClause,
    });

    const pagination = {
      page: page,
      limit: limit,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limit),
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      tasks,
      pagination,
    });
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
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
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
          userId: req.user.id,
        },
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
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
          userId: req.user.id,
        },
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
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

// Bulk create with validation
async function bulkCreate(req, res, next) {
  const { tasks } = req.body;

  // Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted ?? false,
      priority: value.priority ?? "medium",
      userId: req.user.id,
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    return res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
  taskCounter,
  bulkCreate,
};
