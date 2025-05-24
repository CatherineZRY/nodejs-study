import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import GoogleStrategy from "passport-google-oauth2";
import env from "dotenv";
import { HttpsProxyAgent } from 'https-proxy-agent';

const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
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

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// 处理Google认证请求
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // 请求的权限范围
  })
);

// 处理Google认证成功后的回调
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.get("/secrets", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    const user = req.user;
    res.render("secrets.ejs", { secret: user.secret });
  } else {
    res.redirect("/login");
  }
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", async (req, res) => {
  const secret = req.body.secret;
  const user = req.user;
  user.secret = secret;
  const result = await db.query("UPDATE users SET secret = $1 WHERE id = $2", [
    secret,
    user.id,
  ]);
  res.redirect("/secrets");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      req.redirect("/login");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// google认证策略
const gStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets", // 回调URL
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo", // 从Google获取用户信息
  },
  async function (accessToken, refreshToken, profile, cb) {
    // 处理Google认证成功后的回调
    const email = profile.email;
    const userId = profile.id;
    console.log("email:", email);
    console.log("id:", userId);
    try {
      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        email,
      ]);
      if (result.rows.length > 0) {
        return cb(null, result.rows[0]);
      } else {
        const insertUserResult = await db.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *", [
          email, // 用户邮箱
          userId, // 用户ID（常用），或者也可以使用特定的字符串作为密码
        ]);
        return cb(null, insertUserResult.rows[0]);
      }
    } catch (error) {
      console.log("has error:");
      console.log(error);
      return cb(error);
    }
  }
)

//设置proxy
// 在国内访问Google/Facebook需要设置代理
const agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
gStrategy._oauth2.setAgent(agent);
passport.use(gStrategy);

// 本地认证策略
passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            //Error with password check
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              //Passed password check
              return cb(null, user);
            } else {
              //Did not pass password check
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

passport.use(gStrategy);

passport.serializeUser((user, done) => {
  console.log("serializeUser executed:", user);
  // 将用户ID存储到session中
  done(null, user.id);
  // done函数的参数含义：
  // 第一个参数是错误信息，如果为null，则表示没有错误
  // 第二个参数是存储到session中的数据，这里存储的是用户ID
});
passport.deserializeUser(async (userId, done) => {
  const result = await db.query("SELECT * FROM users WHERE id = $1", [
    userId,
  ]);
  done(null, result.rows[0]);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
