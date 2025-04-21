import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const currentDate = new Date().getDay();
  console.log(currentDate);
  let dataType = 'weekday';
  if (currentDate === 0 || currentDate === 6) {
    dataType = 'weekend';
  }
  res.render(__dirname + '/views/index.ejs', {
    dataType: dataType
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});