const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("tell", (message) => {
  console.log("listener 1 got a tell message:");
});

emitter.on("tell", (message) => {
  console.log("listener 2 got a tell message:");
});

emitter.on("error", (error) => {
  console.log("The emitter reported an error.");
});

emitter.emit("tell", "Hi there!");
emitter.emit("tell", "second message");
emitter.emit("tell", "all done");
