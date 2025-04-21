import express from "express";
import bodyParser from "body-parser";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
let curName = '';

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render(__dirname + "/views/index.ejs", { name: curName });
});

app.post("/submit", (req, res) => {
  console.log(req.body);
  curName = req.body.fName + req.body.lName;
  res.status(200).redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
