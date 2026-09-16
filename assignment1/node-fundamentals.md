# Node.js Fundamentals

## What is Node.js?

Node.js is a runtime that lets you run JavaScript outside the browser, on your computer or a server.

## How does Node.js differ from running JavaScript in the browser?

Node.js runs JavaScript outside the browser, usually on the server side. It is commonly used for backend development, working with files, databases, APIs, operating system resources. Node.js output displays in the terminal.
JavaScript in the browser runs on the client side and is used to control web pages, respond to user actions, update the page content.

## What is the V8 engine, and how does Node use it?

V8 is the high-performance JavaScript engine Google originally built for the Chrome browser.
Node.js uses the same JavaScript engine as Chrome, but it runs outside the browser.

## What are some key use cases for Node.js?

1. Building web APIs and servers that respond to requests from browsers or other applications.
2. Creating command-line tools that run in the terminal and automate tasks.
3. Developing real-time applications, such as chat apps and live dashboards, that send updates instantly.
4. Writing build tools and scripts that bundle code, process files, or automate development workflows.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**

CommonJS is module system used in Node.js. It uses require() to import code and module.exports or exports to export code.

```js
const { register, logoff } = require("../controllers/userController");
```

**ES Modules (supported in modern Node.js):**

ES Modules are the standard modern JavaScript module system. They use import to import code and export to export code.

```js
import { useState, useEffect } from "react";
```
