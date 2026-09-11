const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const { userSchema } = require("../validation/userSchema");

const prisma = require("../db/prisma");

const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only when HTTPS is available
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

const { StatusCodes } = require("http-status-codes");

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res, next) {
  if (!req.body) req.body = {};

  try {
    let isPerson = false;
    if (req.body.recaptchaToken) {
      const token = req.body.recaptchaToken;
      const params = new URLSearchParams();
      params.append("secret", process.env.RECAPTCHA_SECRET);
      params.append("response", token);
      params.append("remoteip", req.ip);
      const response = await fetch(
        // might throw an error that would cause a 500 from the error handler
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          body: params.toString(),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
      const data = await response.json();
      if (data.success) isPerson = true;
      delete req.body.recaptchaToken;
    } else if (
      process.env.RECAPTCHA_BYPASS &&
      req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
    ) {
      // might be a test environment
      isPerson = true;
    }
    if (!isPerson) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Bot verification failed. Please complete the reCAPTCHA.",
      });
    }

    const { error, value } = userSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        details: error.details,
      });
    }

    value.hashedPassword = await hashPassword(value.password);
    delete value.password;

    // In your register method, after validation and password hashing:
    // Do the Joi validation, so that value contains the user entry you want.
    // hash the password, and put it in value.hashedPassword
    // delete value.password as that doesn't get stored
    const result = await prisma.$transaction(async (tx) => {
      // Create user account (similar to Assignment 6, but using tx instead of prisma)
      const newUser = await tx.user.create({
        data: {
          email: value.email,
          name: value.name,
          hashedPassword: value.hashedPassword,
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      // Create 3 welcome tasks using createMany
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      // Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });

    const csrfToken = setJwtCookie(req, res, result.user);

    return res.status(201).json({
      user: result.user,
      csrfToken,
    });
  } catch (err) {
    if (err.code === "P2002") {
      // send the appropriate error back -- the email was already registered
      return res.status(400).json({ error: "Email already registered" });
    } else {
      return next(err); // the error handler takes care of other errors
    }
  }
}

async function logon(req, res, next) {
  if (!req.body) req.body = {};

  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }
  try {
    email = email.toLowerCase(); // Joi validation always converts the email to lower case
    // but you don't want logon to fail if the user types mixed case
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        hashedPassword: true,
      },
    });
    // also Prisma findUnique can't do a case insensitive search

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const goodCredentials = await comparePassword(
      password,
      user.hashedPassword,
    );

    if (!goodCredentials) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const csrfToken = setJwtCookie(req, res, user);

    return res.status(200).json({
      name: user.name,
      email: user.email,
      csrfToken,
    });
  } catch (err) {
    return next(err);
  }
}

function logoff(req, res) {
  res.clearCookie("jwt", cookieFlags(req));
  return res.sendStatus(200);
}

async function show(req, res, next) {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        error: "Invalid user ID",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        tasks: {
          where: {
            isCompleted: false,
          },
          select: {
            id: true,
            title: true,
            priority: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  logon,
  logoff,
  hashPassword,
  comparePassword,
  show,
};
