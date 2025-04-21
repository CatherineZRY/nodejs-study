import express from "express";

const app = express();
const port = 3000;

const logger = (req, res, next) => {
  console.log(`Request made to ${req.url}`);
  next(); // 调用下一个中间件 或者 http 请求handler
}

app.use(logger); // 自定义中间件

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
