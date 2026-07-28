const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

function create(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };

  global.tasks = global.tasks || [];
  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;

  return res.status(201).json(sanitizedTask);
}

function index(req, res) {
  global.tasks = global.tasks || [];

  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email,
  );

  if (userTasks.length === 0) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  const sanitizedTasks = userTasks.map((task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
  });

  return res.status(200).json(sanitizedTasks);
}

function show(req, res) {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  global.tasks = global.tasks || [];

  const task = global.tasks.find(
    (t) => t.id === taskId && t.userId === global.user_id.email,
  );

  if (!task) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  const { userId, ...sanitizedTask } = task;

  return res.status(200).json(sanitizedTask);
}

function update(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = patchTaskSchema.validate(req.body, {
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

  global.tasks = global.tasks || [];

  const task = global.tasks.find(
    (t) => t.id === taskId && t.userId === global.user_id.email,
  );

  if (!task) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  Object.assign(task, value);

  const { userId, ...sanitizedTask } = task;

  return res.status(200).json(sanitizedTask);
}

function deleteTask(req, res) {
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  global.tasks = global.tasks || [];

  const taskIndex = global.tasks.findIndex(
    (t) => t.id === taskId && t.userId === global.user_id.email,
  );

  if (taskIndex === -1) {
    return res.status(404).json({
      message: "Task not found.",
    });
  }

  const { userId, ...sanitizedTask } = global.tasks[taskIndex];

  global.tasks.splice(taskIndex, 1);

  return res.status(200).json(sanitizedTask);
}

module.exports = { create, index, show, update, deleteTask, taskCounter };
