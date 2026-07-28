const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const { userSchema } = require("../validation/userSchema");

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

async function register(req, res) {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  global.users = global.users || [];

  try {
    const hashedPassword = await hashPassword(value.password);

    const newUser = {
      name: value.name,
      email: value.email,
      hashedPassword,
    };

    global.users.push(newUser);
    global.user_id = newUser;

    return res.status(201).json({
      name: newUser.name,
      email: newUser.email,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong creating the account.",
    });
  }
}

async function logon(req, res) {
  if (!req.body) req.body = {};

  const { email, password } = req.body;

  global.users = global.users || [];

  const user = global.users.find((user) => user.email === email);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  try {
    const goodCredentials =
      user && (await comparePassword(password, user.hashedPassword));

    if (!goodCredentials) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    global.user_id = user;

    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Something went wrong logging in.",
    });
  }
}
function logoff(req, res) {
  global.user_id = null;

  return res.status(200);
}

module.exports = {
  register,
  logon,
  logoff,
  hashPassword,
  comparePassword,
};
