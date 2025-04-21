import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true })); // 使用qs模块解析请求参数，若为false则使用querystring模块解析

app.get("/", (req, res) => {
  console.log(__dirname + "/public/index.html");
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/submit", (req, res) => {
  console.log(req.body); // 若没有解析器解析，最后会支持打印出buffer信息
  res.send("Form submitted successfully!");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
