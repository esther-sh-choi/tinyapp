const express = require("express");
const cookiesSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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
app.use(
  cookiesSession({
    name: "session",
    keys: ["key1"],
  })
);

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const urlsForUser = (id) => {
  const userURL = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURL[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURL;
};

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlsForUser(userID),
    user: users[userID],
    error: "Please register or log in to gain full access.",
  };
  res.render("urls_index", templateVars);
});

// GET /urls/new route needs to be defined before the GET /urls/:id route.
// Routes defined earlier will take precedence, so if we place this route after the /urls/:id definition, any calls to /urls/new will be handled by app.get("/urls/:id", ...) because Express will think that new is a route parameter.
// routes should be ordered from most specific to least specific.

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    error: "You must be logged in to shorten URLs.",
  };
  if (!req.session.user_id) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    res.status(400).end("Cannot shorten URL when not logged in.\n");
  } else {
    const shortURL = generateRandomString(6);
    const longURL = req.body.longURL;
    const userID = req.session.user_id;
    const userURLDatabase = urlsForUser(userID);
    const templateVars = {
      user: users[userID],
      error: "",
    };
    if (
      !!Object.values(userURLDatabase).filter(
        (shortURL) => shortURL.longURL === longURL
      ).length
    ) {
      templateVars.error = "This URL already exists.";
      res.render("urls_show", templateVars);
    } else if (!longURL.length) {
      templateVars.error = "Please input a valid URL.";
      res.render("urls_show", templateVars);
    } else {
      urlDatabase[shortURL] = { longURL, userID };
      res.redirect(`/urls/${shortURL}`);
    }
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = getUserByEmail(email)?.id;

  if (!email || !password) {
    res.status(400).end("You forgot to input email/password.\n");
  }

  if (!userID) {
    res.status(403).end("The email does not exist.\n");
  }

  if (!bcrypt.compareSync(password, users[userID].password)) {
    res.status(403).end("Incorrect password.\n");
  }

  req.session.user_id = userID;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

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
    password: hashedPassword,
  };
  req.session.user_id = userId;
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  let errorMsg = "";
  if (!req.session.user_id) {
    errorMsg = "Please register or log in to gain full access.";
  }

  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    errorMsg = "This is an invalid link.";
  }

  const userID = req.session.user_id ? req.session.user_id : undefined;
  const userURLDatabase = urlsForUser(userID);
  if (
    userID &&
    urlDatabase[shortURL] &&
    userURLDatabase[shortURL]?.userID !== userID
  ) {
    errorMsg = "You do not own this URL.";
  }

  const templateVars = {
    id: shortURL,
    longURL: userURLDatabase[shortURL]?.longURL,
    user: users[userID],
    error: errorMsg,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.user_id ? req.session.user_id : undefined;
  const userURLDatabase = urlsForUser(userID);

  if (!userID) {
    res.status(400).send("Please register or log in to gain full access.\n");
  } else if (!urlDatabase[shortURL]) {
    res.status(400).send("This is an invalid link.\n");
  } else if (userURLDatabase[shortURL]?.userID !== userID) {
    res.status(400).send("Cannot delete another user's url.\n");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

app.post("/urls/:id/update", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.user_id;
  const userURLDatabase = urlsForUser(userID);

  if (!userID) {
    res.status(400).send("Please register or log in to gain full access.\n");
  } else if (!urlDatabase[shortURL]) {
    res.status(400).send("This is an invalid link.\n");
  } else if (userURLDatabase[shortURL]?.userID !== userID) {
    res.status(400).send("Cannot update another user's url.\n");
  } else {
    const updatedLongURL = req.body.updatedLongURL;
    urlDatabase[shortURL].longURL = updatedLongURL;
    res.redirect("/urls");
  }
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    const templateVars = {
      error: "This short URL does not exist.",
    };
    res.render("error_page", templateVars);
  } else {
    const longURL = urlDatabase[id].longURL;
    res.redirect(longURL);
  }
});
