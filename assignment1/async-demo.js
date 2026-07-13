const fs = require("fs");
const path = require("path");

const sampleDirectory = path.join(__dirname, "sample-files");
const sampleFile = path.join(sampleDirectory, "sample.txt");
const fileContent = "Hello, async world!";

// Write a sample file for demonstration
if (!fs.existsSync(sampleDirectory)) {
  fs.mkdirSync(sampleDirectory, { recursive: true });
}

fs.writeFileSync(sampleFile, fileContent);

// 1. Callback style
fs.readFile(sampleFile, "utf8", (error, data) => {
  if (error) {
    console.error("Callback error:", error.message);
    return;
  }
  console.log("Callback read:", data);
});

// Callback hell example (test and leave it in comments):
fs.readFile("first.txt", "utf8", (error, firstData) => {
  if (error) {
    return;
  }

  fs.readFile("second.txt", "utf8", (error, secondData) => {
    if (error) {
      return;
    }

    fs.writeFile("result.txt", firstData + secondData, (error) => {
      if (error) {
        return;
      }

      console.log("Finished");
    });
  });
});

// 2. Promise style
function readFileWithPromise(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  });
}

readFileWithPromise(sampleFile)
  .then((data) => {
    console.log("Promise read:", data);
  })
  .catch((error) => {
    console.error("Promise error", error.message);
  });

// 3. Async/Await style
async function readFileWithAsyncAwait() {
  try {
    const data = await fs.promises.readFile(sampleFile, "utf8");
    console.log("Async/Await read:", data);
  } catch (error) {
    console.error("Async/Await error:", error.message);
  }
}

readFileWithAsyncAwait();
