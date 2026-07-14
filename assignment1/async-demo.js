const fs = require("fs");
const path = require("path");

const sampleDirectory = path.join(__dirname, "sample-files");
const sampleFile = path.join(sampleDirectory, "sample.txt");
const fileContent = "Hello, async world!";

// Write a sample file for demonstration
if (!fs.existsSync(sampleDirectory)) {
  fs.mkdirSync(sampleDirectory, { recursive: true });
}

fs.writeFileSync(sampleFile, fileContent, "utf8");

// 1. Callback style
fs.readFile(sampleFile, "utf8", (_, data) => {
  console.log(`Callback read: ${data}`);
});

// Callback hell example (test and leave it in comments):
// Callback hell happens when async callbacks are nested inside one another, making code difficult to read and maintain.
/* fs.readFile("firstFile.txt", "utf8", (_, firstData) => {
  fs.readFile("secondFile.txt", "utf8", (_, secondData) => {
    fs.writeFile("result.txt", firstData + secondData, "utf8", () => {
      console.log("Finished");
    });
  });
});
*/

// 2. Promise style
function readFileWithPromise(filePath) {
  return new Promise((resolve) => {
    fs.readFile(filePath, "utf8", (_, data) => {
      resolve(data);
    });
  });
}

readFileWithPromise(sampleFile).then((data) => {
  console.log(`Promise read: ${data}`);
});

// 3. Async/Await style
async function readFileWithAsyncAwait() {
  {
    const data = await fs.promises.readFile(sampleFile, "utf8");
    console.log(`Async/Await read: ${data}`);
  }
}

readFileWithAsyncAwait();
