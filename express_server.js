const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const generateRandomString = (length) => {
  let resultStr = "";
  for (let i = 0; i < length; i++) {
    let isNum = Math.random() > 0.67;
    if (isNum) {
      resultStr += String(Math.floor(Math.random() * 10));
      isNum = Math.random() > 0.8;
    } else {
      let randomCharCode = Math.ceil(Math.random() * 122);
      while (
        randomCharCode < 65 ||
        (randomCharCode > 90 && randomCharCode < 97)
      ) {
        randomCharCode = Math.ceil(Math.random() * 122);
      }
      resultStr += String.fromCharCode(randomCharCode);
    }
  }
  return resultStr;
};

const getUserByEmail = (email) => {
  return Object.values(users).find((user) => user.email === email);
};

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_index", templateVars);
});

// GET /urls/new route needs to be defined before the GET /urls/:id route.
// Routes defined earlier will take precedence, so if we place this route after the /urls/:id definition, any calls to /urls/new will be handled by app.get("/urls/:id", ...) because Express will think that new is a route parameter.
// routes should be ordered from most specific to least specific.

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
  };
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(400).end("Cannot shorten URL when not logged in.\n");
  } else {
    const shortURL = generateRandomString(6);
    const longURL = req.body.longURL;

    if (!Object.values(urlDatabase).includes(longURL)) {
      urlDatabase[shortURL] = longURL;
    }
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = getUserByEmail(email)?.id;

  if (!email || !password) {
    res.status(400).end("You forgot to input email/password.\n");
  }

  if (!getUserByEmail(email)) {
    res.status(403).end("The email does not exist.\n");
  }

  if (users[userID].password !== password) {
    res.status(403).end("Incorrect password.\n");
  }

  res.cookie("user_id", userID);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).end("You forgot to input email/password.");
  }
  if (!!getUserByEmail(email)) {
    res.status(400).end("A user with this email exists.");
  }

  const userId = generateRandomString(10);
  users[userId] = {
    id: userId,
    email: email,
    password: password,
  };
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  const updatedLongURL = req.body.updatedLongURL;
  const shortURL = req.params.id;
  urlDatabase[shortURL] = updatedLongURL;
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    const errorVar = {
      message: "This short URL does not exist.",
    };
    res.render("error_page", errorVar);
  } else {
    const longURL = urlDatabase[id];
    res.redirect(longURL);
  }
});
