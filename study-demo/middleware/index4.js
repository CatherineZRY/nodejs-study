import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import fs from "fs";
import morgan from "morgan";

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const logFileStream = fs.createWriteStream(__dirname + "/access4.log", { flags: "a" });
console.log(__dirname);

let bandMsg = '';

app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`got request ${req.url}`);
  const resBody = req.body;
  bandMsg = `street name: ${resBody.street}, pet name: ${resBody.pet}`;
  next();
});
// app.use(bodyParser.json());
app.use(morgan("combined", { stream: logFileStream }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html"); // 使用的文件地址必须是绝对路径
});

app.post("/submit", (req, res) => {
  console.log("Got a POST request");
  const reqBody = req.body;
  // res.send(`street name: ${resBody.street}, pet name: ${resBody.pet}`);
  console.log(reqBody);
  res.send(bandMsg);
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
