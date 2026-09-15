require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const {
  index,
  show,
  create,
  update,
  deleteTask,
  trashBin,
  restoreTask,
  permanentlyDeleteTask,
} = require("../controllers/taskController");

const EventEmitter = require("events");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const { StatusCodes } = require("http-status-codes");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
  user1 = await prisma.User.create({
    data: {
      name: "Bob",
      email: "bob@sample.com",
      hashedPassword: "nonsense",
    },
  });
  user2 = await prisma.User.create({
    data: {
      name: "Alice",
      email: "alice@sample.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(() => {
  prisma.$disconnect();
});

describe("testing task creation", () => {
  it("14. can't create a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    const saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    expect.assertions(1);

    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  it("15. can't create a task with a bogus user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });

    req.user = { id: 1000000000 };
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
    expect.assertions(1);

    try {
      await waitForRouteHandlerCompletion(create, req, res);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });

  it("16. creates a task with a valid user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });

    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(create, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });

  it("17. returned task has the expected title", async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("first task");
  });

  it("18. returned task has the right isCompleted value", () => {
    expect(saveData.isCompleted).toBe(false);
  });

  it("19. returned task does not contain userId", () => {
    saveTaskId = saveData.id;
    expect(saveData.userId).toBeUndefined();
  });
});

describe("test getting created tasks", () => {
  it("20. can't get a list of tasks without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(index, req, res);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  it("21. If you use user1's id on index() the call returns a 200 status.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });

  it("22. The returned object has a tasks array of length 1", async () => {
    saveData = saveRes._getJSONData();
    expect(saveData.tasks.length).toBe(1);
  });

  it("23. The title in the first array object is as expected", () => {
    expect(saveData.tasks[0].title).toBe("first task");
  });

  it("24. The first array object does not contain a userId", () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
  });

  it("25. If you get the list of tasks using user2's id, you get a 200 with an empty tasks array", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user2.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(index, req, res);
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.tasks).toEqual([]);
  });

  it("26. can retrieve the created task using show()", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(show, req, res);
    expect(res.statusCode).toBe(200);
  });

  it("27. User2 can't retrieve this task entry", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(show, req, res);
    expect(res.statusCode).toBe(404);
  });
});

describe("testing update and delete of tasks", () => {
  it("28. User1 can set the task to isCompleted true", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: {
        isCompleted: true,
      },
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(update, req, res);
    expect(res.statusCode).toBe(200);
  });

  it("29. User2 can't update this task", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: {
        isCompleted: false,
      },
    });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(update, req, res);
    expect(res.statusCode).toBe(404);
  });

  it("30. User2 can't delete this task", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });
    req.user = { id: user2.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(deleteTask, req, res);
    expect(res.statusCode).toBe(404);
  });

  it("31. User1 can delete this task", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(deleteTask, req, res);
    expect(res.statusCode).toBe(200);
  });

  it("32. Retrieving user1's active tasks after deletion returns an empty array", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(index, req, res);
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.tasks).toEqual([]);
  });
});

describe("testing trash bin, restore, and permanent delete", () => {
  it("66. User1 can see the deleted task in the trash bin", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(trashBin, req, res);
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(saveTaskId);
    expect(data[0].deletedAt).not.toBeNull();
  });
  it("67. User2 cannot see user1's deleted task in the trash bin", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user2.id };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(trashBin, req, res);
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data).toEqual([]);
  });
  it("68. User1 can restore the deleted task", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(restoreTask, req, res);
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.id).toBe(saveTaskId);
    expect(data.deletedAt).toBeNull();
  });
  it("69. Restored task appears in user1's active tasks", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(index, req, res);
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.tasks.length).toBe(1);
    expect(data.tasks[0].id).toBe(saveTaskId);
  });
  it("70. User1 can move the restored task back to the trash bin", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(deleteTask, req, res);
    expect(res.statusCode).toBe(200);
    const data = res._getJSONData();
    expect(data.deletedAt).not.toBeNull();
  });
  it("71. User1 can permanently delete a task from the trash bin", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });
    await waitForRouteHandlerCompletion(permanentlyDeleteTask, req, res);
    expect(res.statusCode).toBe(200);
  });
  it("72. Permanently deleted task no longer exists in the database", async () => {
    const task = await prisma.task.findUnique({
      where: {
        id: saveTaskId,
      },
    });
    expect(task).toBeNull();
  });
});
