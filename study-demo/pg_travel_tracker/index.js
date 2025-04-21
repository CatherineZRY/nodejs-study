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

async function getVisitedCountries() {
  const result = await db.query("SELECT country_code FROM visited_countries;");
  return result.rows;
}


app.get("/", async (req, res) => {
  //Write your code here.
  const visitedCountries = await getVisitedCountries();
  const existedCountries = visitedCountries.map((country) => country.country_code);
  console.log('countries:', existedCountries);
  res.render("index.ejs", { countries: existedCountries, total: existedCountries.length });
});

app.post("/add", async (req, res) => {
  const countryName = req.body.country.toLowerCase();
  const result = await db.query("SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';", [countryName]);
  const contryCode = result.rows?.length > 0 ? result.rows[0].country_code : '';
  // 若没有找到对应的国家，则加载错误信息
  if (!contryCode) {
    const visitedCountries = await getVisitedCountries();
    const existedCountries = visitedCountries.map((country) => country.country_code);
    res.render("index.ejs", {
      countries: existedCountries,
      total: existedCountries.length,
      error: "Country not found, try again.",
    });
    return;
  }
  try {
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1);", [contryCode]);
    res.redirect("/");
  } catch (error) {
    // 若添加失败，则加载错误信息
    const visitedCountries = await getVisitedCountries();
    const existedCountries = visitedCountries.map((country) => country.country_code);
    const curCountryHasExisted = visitedCountries.some((country) => country.country_code === contryCode);
    console.error('HAS ERROR:', error);
    res.render("index.ejs", {
      countries: existedCountries,
      total: existedCountries.length,
      error: curCountryHasExisted ? "Country has already been added, try again." : error,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
