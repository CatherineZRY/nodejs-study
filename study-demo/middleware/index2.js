import express from "express";
import morgan from "morgan"; // 一个用于记录日志信息的中间件
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const app = express();
const port = 3000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const accessLogStream = fs.createWriteStream(__dirname + '/access.log', { flags: 'a' });
// app.use(morgan('combined', { stream: accessLogStream })); // 使用Stream进行日志记录到文件
app.use(morgan("tiny"));

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
