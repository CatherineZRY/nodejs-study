import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "PaaS1!2@3#4$",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];


async function checkVisisted(userId) {
  let sqlStr = "SELECT country_code FROM visited_countries";
  if (userId) {
    sqlStr += ` JOIN users ON visited_countries.user_id = users.id WHERE users.id = ${userId}`;
  }
  const result = await db.query(sqlStr);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(`user ${userId} visited countries:`, countries);
  return countries;
}

async function getUser() {
  const result = await db.query("SELECT * FROM users");
  return result.rows;
}


app.get("/", async (req, res) => {
  const countries = await checkVisisted(currentUserId);
  console.log('countries:', countries);
  const userInfo = users.find(user => user.id === currentUserId);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: userInfo?.color || "teal",
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  const userId = req.body["user"];
  console.log('userId:', userId);
  if (userId) {
    currentUserId = parseInt(userId);
    res.redirect("/");
  } else {
    res.render("new.ejs");
  }
});

app.post("/new", async (req, res) => {
  const request = req.body;
  console.log('request:', request);
  const result = await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING id", [request.name, request.color]);
  const userId = result.rows[0].id;
  currentUserId = userId;
  res.redirect("/");
});

app.listen(port, async () => {
  console.log(`Server running on http://localhost:${port}`);
  users = await getUser();
  currentUserId = users?.length > 0 ? users[0].id : null;
});
