require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
let csrfToken = null;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("register a user ", () => {
  let saveRes = null; // we'll declare this out here, so that we can reference it in several tests
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post("/api/users/register").send(newUser);
    expect(saveRes.status).toBe(201);
  });

  it("47. Registration returns an object with the expected name", () => {
    expect(saveRes.body.user.name).toBe("John Deere");
  });

  it("48. The returned object includes a csrfToken", () => {
    expect(saveRes.body.csrfToken).toBeDefined();
  });

  it("49. You can logon as the newly registered user", async () => {
    const user = {
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post("/api/users/logon").send(user);
    expect(saveRes.status).toBe(200);

    csrfToken = saveRes.body.csrfToken;
  });

  it("50. Verify that you are logged in", async () => {
    const res = await agent.get("/api/tasks");
    expect(res.status).not.toBe(401);
  });

  it("51. Verify that you can log out", async () => {
    const res = await agent
      .post("/api/users/logoff")
      .set("X-CSRF-TOKEN", csrfToken);
    expect(res.status).toBe(200);
  });

  it("52. Make sure that you are really logged out", async () => {
    const res = await agent.get("/api/tasks");
    expect(res.status).toBe(401);
  });
});
