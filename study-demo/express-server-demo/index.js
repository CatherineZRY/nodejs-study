import express from 'express';
const app = express();
const port = 3000;

app.use((req, res, next) => {
  console.log('middleware 1');
  next();
});

app.get('/', (req, res) => {
  // console.log(req.rawHeaders);
  res.send('<h1>home page</h1>');
});

app.get('/about', (req, res) => {
  // console.log(req.rawHeaders);
  res.send('<h1>about me</h1>');
});

app.post('/add', (req, res) => {
  res.sendStatus('201'); // 不能同时返回 body 和 status code
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});