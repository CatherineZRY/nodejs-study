import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "secrets",
  password: "PaaS1!2@3#4$",
  port: 5432,
});
db.connect();


app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE username = $1", [email]);
    if (checkResult.rows.length > 0) {
      res.send("User already exists");
    } else {
      await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [email, password]);
      res.redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.send("Error registering user");
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT password FROM users WHERE username = $1", [email]);
    if (checkResult.rows.length > 0) {
      if (checkResult.rows[0].password === password) {
        res.redirect("/secrets");
      } else {
        res.send("Wrong password");
      }
    } else {
      res.send("User does not exist");
    }
  } catch (error) {
    console.error(error);
    res.send("Error logging in");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
