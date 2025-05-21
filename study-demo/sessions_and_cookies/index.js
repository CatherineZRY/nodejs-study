import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";

// Passport.js支持多种认证策略，Local Strategy只是其中之一：
// Local Strategy：用户名/密码认证
// OAuth策略：如Google、Facebook、Twitter登录
// JWT策略：基于JSON Web Token的认证
// OpenID策略：OpenID Connect认证
// Local Strategy是最基础的，专注于传统的用户名/密码认证方式，而其他策略则处理更复杂的第三方或令牌认证。
import { Strategy } from "passport-local";

const app = express();
const port = 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// 使用session中间件来管理具体的session
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 设置cookie的过期时间
  })
);

// 初始化Passport中间件
// 作用： 
// 1. 在请求对象上初始化passport属性
// 2. 为每个请求创建新的Passport实例
// 3. 配置验证用户所需的基础环境
// 4. 必须在所有使用Passport的路由之前调用
// 5. 即使不使用session，这一步也是必需的
app.use(passport.initialize());

// 启用Passport与session的集成
// 作用：
// 1. 从session中检索用户信息(通过cookie中的sessionID)
// 2. 调用passport.deserializeUser()将存储的用户ID转换为完整用户对象
// 3. 将反序列化后的用户对象挂载到req.user上
// 4. 使应用可以通过req.user访问当前登录用户
// 5. 必须在express-session中间件配置之后调用
app.use(passport.session());

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

app.get("/secrets", (req, res) => {
  console.log("req.session:", req.session);
  console.log("req.user:", req.user);
  // 检查用户是否已通过认证
  // isAuthenticated() 是 Passport 提供的一个方法，用于检查当前请求是否已通过认证
  if (req.isAuthenticated()) {
    res.render("secrets.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE username = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      //hashing the password and saving it in the database
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          console.log("Hashed Password:", hash);
          const result = await db.query(
            "INSERT INTO users (username, password) VALUES ($1, $2)",
            [email, hash]
          );
          const user = result.rows[0];
          // 此方法为Passport提供，使用req.login()方法将用户信息存储到session中
          // 优点：
          // （1）不通过传统的passport.authenticate()中间件即可登录用户
          // （2）可以更灵活地控制登录过程
          // 执行流程：
          // （1）调用req.login(user, callback)
          // （2）Passport调用serializeUser函数
          // （3）将序列化后的用户信息存储到session中
          // （4）建立用户的登录状态
          // （5）执行回调函数
          req.login(user, (err) => {
            if (err) {
              console.error("Error logging in:", err);
            } else {
              res.redirect("/secrets");
            }
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// 使用passport.authenticate()中间件来处理登录请求
// 会调用配置的策略，即new Strategy(async (username, password, done) => {})
// 会调用配置的序列化函数，即passport.serializeUser((user, done) => {})
// 会调用配置的反序列化函数，即passport.deserializeUser(async (id, done) => {})
app.post("/login", passport.authenticate("local", {
  successRedirect: "/secrets",
  failureRedirect: "/login",
  failureFlash: true,
}));


// 在完整的应用中，使用Local Strategy通常涉及以下步骤：
// 配置策略：配置用户名/密码认证策略，即指定什么情况下认为用户登录成功
// 配置序列化函数：定义如何将用户对象存储到session
// 配置反序列化函数：定义如何从session恢复用户
// 添加登录路由：使用passport.authenticate('local')中间件处理登录请求

// （1）配置Passport策略
passport.use(
  // 从done(null, user)到req.user的完整流程：
  // 从done(null, user)到req.user的完整流程
  // 步骤1: 验证通过标记
  // - done(null, user)表示验证成功，第一个参数为null表示没有错误
  // - 第二个参数user是需要保存的用户信息对象

  // 步骤2: 序列化过程
  // - Passport接收到user对象后，调用passport.serializeUser()函数
  // - 序列化函数决定哪些用户数据被存储到session中（通常只存储用户ID）
  // - 例如: passport.serializeUser((user, cb) => { cb(null, user.id); });

  // 步骤3: 存储到Session
  // - 序列化后的数据（通常是用户ID）被存储到session中
  // - 这是session的一部分，由express-session中间件管理
  // - 实际存储在req.session.passport.user中

  // 步骤4: 后续请求中的反序列化
  // - 当用户发送后续请求时，passport.session()中间件会拦截请求
  // - 从req.session.passport.user中获取序列化的用户数据（如ID）
  // - 调用passport.deserializeUser()函数将ID转换回完整的用户对象

  // 步骤5: 设置req.user
  // - 反序列化后的完整用户对象被设置为req.user
  // - 此时req.user在所有路由和中间件中可用
  // - 可以通过req.user访问当前登录用户的信息
  new Strategy(async (username, password, done) => {
    console.log("username:", username);
    console.log("password:", password);
    try {
      const result = await db.query("SELECT * FROM users WHERE username = $1", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            return done(err);
          } else {
            if (result) {
              return done(null, user);
            } else {
              return done(null, false);
            }
          }
        });
      } else {
        return done('User not found');
      }
    } catch (err) {
      return done(err);
    }
  })
);

// （2）配置序列化函数
passport.serializeUser((user, done) => {
  console.log("serializeUser executed:", user);
  // 将用户ID存储到session中
  done(null, user.id);
  // done函数的参数含义：
  // 第一个参数是错误信息，如果为null，则表示没有错误
  // 第二个参数是存储到session中的数据，这里存储的是用户ID
});

// （3）配置反序列化函数
passport.deserializeUser(async (id, done) => {
  console.log("deserializeUser executed:", id);
  // 将用户ID存储到session中
  const result = await db.query("SELECT * FROM users WHERE id = $1", [
    id,
  ]);
  done(null, result.rows[0]);
  // done函数的参数含义：
  // 第一个参数是错误信息，如果为null，则表示没有错误
  // 第二个参数是存储到session中的数据，这里存储的是用户ID
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
