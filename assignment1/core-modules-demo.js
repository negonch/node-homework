const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

// Path module
const joinedPath = path.join(
  "/path",
  "to",
  "sample-files",
  "folder",
  "file.txt",
);

console.log("Joined path:", joinedPath);

// fs.promises API
async function demoFS() {
  const filePath = path.join(sampleFilesDir, "demo.txt");
  await fs.promises.writeFile(filePath, "Hello from fs.promises!");

  const data = await fs.promises.readFile(filePath, "utf8");
  console.log("fs.promises read:", data);
}

demoFS().catch(console.error);

// Streams for large files- log first 40 chars of each chunk
const streamFilePath = path.join(sampleFilesDir, "demo.txt");

const readStream = fs.createReadStream(streamFilePath, {
  encoding: "utf8",
  highWaterMark: 40,
});

readStream.on("data", (chunk) => {
  console.log("Read chunk:", chunk.slice(0, 40));
});

readStream.on("end", () => {
  console.log("Finished reading large file with streams.");
});

readStream.on("error", (err) => {
  console.log("Error reading file:", err.mesage);
});
