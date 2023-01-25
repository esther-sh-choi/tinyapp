const express = require("express");
const cookiesSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
} = require("./helpers");

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

app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlsForUser(userID, urlDatabase),
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
    error: "",
  };
  if (!req.session.user_id) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    error: "",
  };
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    error: "",
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
    const userURLDatabase = urlsForUser(userID, urlDatabase);
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
      res.render("urls_new", templateVars);
    } else if (longURL.includes("http://") || longURL.includes("https://")) {
      urlDatabase[shortURL] = { longURL, userID };
      res.redirect(`/urls/${shortURL}`);
    } else {
      templateVars.error = "Please input a valid URL.";
      res.render("urls_new", templateVars);
    }
  }
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userID = getUserByEmail(email, users);
  const templateVars = {
    user: users[userID],
  };

  if (!email || !password) {
    templateVars.error = "You forgot to input email/password.";
    res
      .status(400)
      .render("urls_login", templateVars)
      .end("Email/password field is empty.\n");
  }

  if (!userID) {
    templateVars.error = "This email does not exist.";
    res
      .status(403)
      .render("urls_login", templateVars)
      .end("The email does not exist.\n");
  }

  if (!bcrypt.compareSync(password, users[userID].password)) {
    templateVars.error = "Incorrect password.";
    res
      .status(403)
      .render("urls_login", templateVars)
      .end("Incorrect password.\n");
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
  const templateVars = {
    user: "",
  };

  if (!email || !password) {
    templateVars.error = "You forgot to input email/password.";
    res
      .status(400)
      .render("urls_register", templateVars)
      .end("Email/password field is empty.\n");
  }
  if (getUserByEmail(email, users) !== undefined) {
    templateVars.error = "A user with this email exists.";
    res
      .status(400)
      .render("urls_register", templateVars)
      .end("A user with this email exists.\n");
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
  const userURLDatabase = urlsForUser(userID, urlDatabase);
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
  const userURLDatabase = urlsForUser(userID, urlDatabase);

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

app.post("/urls/:id/", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.user_id;
  const userURLDatabase = urlsForUser(userID, urlDatabase);

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
