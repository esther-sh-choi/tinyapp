const express = require("express");
const methodOverride = require("method-override");
const cookiesSession = require("cookie-session");
const { getUserLocale } = require("get-user-locale");
const bcrypt = require("bcryptjs");
const {
  getUserByEmail,
  generateRandomString,
  urlsForUser,
} = require("./helpers");
const { users, urlDatabase } = require("./userDB");

const app = express();
const PORT = 8080;

// Set server time to my location
process.env.TZ = "America/Toronto";
const userLocale = getUserLocale("en-US", true);

app.set("view engine", "ejs");

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(
  cookiesSession({
    name: "session",
    keys: ["key1"],
  })
);

/*--------------------- Landing Page ---------------------*/

// Ths root index redirects the user to /url when they are logged in.
// Otherwise they are redirected to /login
app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});

// page that displays a list of all the shortURLs
// and the corresponding longURLs created by the user
// this includes the edit and delete buttons
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: urlsForUser(userID, urlDatabase),
    user: users[userID],
    error: "Please register or log in to gain access.",
  };
  res.render("urls_index", templateVars);
});

// add a new shortURL associated with the longURL input by the user
// then stores it in the urlDatabase
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (!userID) {
    return res.status(400).end("Cannot shorten URL when not logged in.\n");
  }

  const shortURL = generateRandomString(6);
  const longURL = req.body.longURL;
  const userURLDatabase = urlsForUser(userID, urlDatabase);
  const templateVars = {
    user: users[userID],
    error: "",
  };

  // If longURL already exists
  // or if the longURL length is 0 or doesn't include http:// or https://
  // show error message below the edit section of the urls_new page
  if (
    Object.values(userURLDatabase).filter(
      (shortURL) => shortURL.longURL === longURL
    ).length
  ) {
    templateVars.error = "This URL already exists.";
    return res.render("urls_new", templateVars);
  } else if (
    !longURL.length ||
    !(longURL.includes("http://") || longURL.includes("https://"))
  ) {
    templateVars.error = "Please input a valid URL.";
    return res.render("urls_new", templateVars);
  }

  // store the date and time when shortURL is created
  const currentDate = new Date(Date.now());
  const localeDate = currentDate.toLocaleString(userLocale);

  // reset visit data when shortURL is created or edited
  urlDatabase[shortURL] = {
    longURL,
    userID,
    createdDate: localeDate,
    uniqueVisits: [],
    timestamps: [],
    visitCount: 0,
  };
  res.redirect(`/urls/${shortURL}`);
});

/*--------------------- Create New ShortURL Route ---------------------*/

// page for creating new shortURL by inputting a valid longURL
// if user is not logged in, redirect to /login page
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

/*--------------------- Show and Edit ShortURL Route ---------------------*/

// This goes to the shortURL info, edit, and history page
app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id ? req.session.user_id : undefined;
  const userURLDatabase = urlsForUser(userID, urlDatabase);
  const shortURL = req.params.id;
  const templateVars = {
    id: shortURL,
    longURL: userURLDatabase[shortURL]?.longURL,
    createdDate: userURLDatabase[shortURL]?.createdDate,
    visitCount: urlDatabase[shortURL]?.visitCount,
    uniqueVisitCount: urlDatabase[shortURL]?.uniqueVisits.length,
    timestamps: urlDatabase[shortURL]?.timestamps,
    user: users[userID],
    error: "",
  };

  if (!urlDatabase[shortURL]) {
    // Set error message if the shortURL is not in the urlDatabase
    templateVars.error = "This is an invalid link.";
  } else if (!userID) {
    // Set error message if there is no user_id in cookie (not logged in)
    templateVars.error = "Please register or log in to gain full access.";
  } else if (userURLDatabase[shortURL]?.userID !== userID) {
    // Set error message if user is logged in and shortURL exists, but does not own the shortURL.
    templateVars.error = "You do not own this URL.";
  }

  // If there is an error message in the templateVariables
  if (templateVars.error) {
    return res.render("error_page", templateVars);
  }

  // If no error message.
  res.render("urls_show", templateVars);
});

app.delete("/urls/:id/", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.user_id ? req.session.user_id : undefined;
  const userURLDatabase = urlsForUser(userID, urlDatabase);

  // This is shown when malicious user tries to curl the command
  if (!userID) {
    return res
      .status(400)
      .send("Please register or log in to gain full access.\n");
  } else if (!urlDatabase[shortURL]) {
    return res.status(400).send("This is an invalid link.\n");
  } else if (userURLDatabase[shortURL]?.userID !== userID) {
    return res.status(400).send("Cannot delete another user's url.\n");
  }

  // if no error, delete urlDatabase
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// PUT /urls/:id updates the longURL stored in the shortURL
app.put("/urls/:id/", (req, res) => {
  const shortURL = req.params.id;
  const userID = req.session.user_id;
  const userURLDatabase = urlsForUser(userID, urlDatabase);
  const updatedLongURL = req.body.updatedLongURL;

  // If user is not logged in, shortURL doesn't exist, shortURL's userID doesn't match
  // or if the longURL length is 0 or doesn't include http:// or https://
  // show error message below the edit section of the urls_show page
  if (!userID) {
    return res
      .status(400)
      .send("Please register or log in to gain full access.\n");
  } else if (!urlDatabase[shortURL]) {
    return res.status(400).send("This is an invalid link.\n");
  } else if (userURLDatabase[shortURL]?.userID !== userID) {
    return res.status(400).send("Cannot update another user's url.\n");
  } else if (
    !updatedLongURL.length ||
    !(updatedLongURL.includes("http://") || updatedLongURL.includes("https://"))
  ) {
    const templateVars = {
      id: shortURL,
      longURL: userURLDatabase[shortURL].longURL,
      visitCount: urlDatabase[shortURL]?.visitCount,
      createdDate: urlDatabase[shortURL]?.createdDate,
      uniqueVisitCount: urlDatabase[shortURL]?.uniqueVisits.length,
      timestamps: urlDatabase[shortURL]?.timestamps,
      user: users[userID],
      error: "",
    };
    templateVars.error = "Please input a valid URL.";
    return res.render("urls_show", templateVars);
  }

  // if no errors update longURL
  urlDatabase[shortURL].longURL = updatedLongURL;
  res.redirect("/urls");
});

/*--------------------- Redirect to LongURL ---------------------*/

// users are able to use this route to go to any longURL website
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;

  // If the url does not exist, server will render the error page with
  // the custom error message.
  if (!urlDatabase[shortURL]) {
    const templateVars = {
      error: "This short URL does not exist.",
    };
    return res.render("error_page", templateVars);
  }

  // Before being redirected, save current time and visitorID in the uniqueVisit object
  // Store the visitorID in the cookie to be used to count
  const longURL = urlDatabase[shortURL].longURL;
  const currentDate = new Date(Date.now());
  const localeDate = currentDate.toLocaleString(userLocale);

  // check to see if user already has a visitor ID
  // it not, assign a new visitor ID and store it to cookie
  if (!req.session.visior_id) {
    const visitorID = generateRandomString(8);
    req.session.visior_id = visitorID;
  }

  // if visitor ID already exists, store it to visitorID variable
  const visitorID = req.session.visior_id;

  // if uniqueVisits array does not include the visitorID,
  // push the new visitorID onto the array.
  if (!urlDatabase[shortURL].uniqueVisits.includes(visitorID)) {
    urlDatabase[shortURL].uniqueVisits.push(visitorID);
  }
  // store the new timestamp with the visitorID onto the urlDatabase
  urlDatabase[shortURL].timestamps.push({ visitorID, time: localeDate });
  // increment the visitCount by one
  urlDatabase[shortURL].visitCount++;
  res.redirect(longURL);
});

/*--------------------- Registration Route ---------------------*/

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    error: "",
  };

  // check if cookie has a user_id
  // if user is logged in, redirect to GET /urls
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("register", templateVars);
});

// this method is called when form is submitted in login.ejs
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const templateVars = {
    user: null,
  };

  if (!email || !password) {
    templateVars.error = "You forgot to input email/password.";
    res
      .status(400)
      .render("register", templateVars)
      .end("Email/password field is empty.\n");
  }
  if (getUserByEmail(email, users) !== undefined) {
    templateVars.error = "A user with this email exists.";
    res
      .status(400)
      .render("register", templateVars)
      .end("A user with this email exists.\n");
  }

  // Store user input email and hashed password if there are no errors
  const userId = generateRandomString(10);
  // Store unique visitorID if there are no errors
  const visitorID = generateRandomString(8);

  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword,
    visitorID,
  };
  req.session.user_id = userId;
  req.session.visior_id = visitorID;
  res.redirect("/urls");
});

/*--------------------- Login Route ---------------------*/

// GET /login renders the login page
// if user is already signed in, they will be redirected to GET /urls
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
    error: "",
  };
  // check if cookie has a user_id
  // if logged in, redirect to GET /urls
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.render("login", templateVars);
});

// this method is called when form is submitted in login.ejs
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userID = getUserByEmail(email, users);
  const templateVars = {
    user: null,
  };

  if (!email || !password) {
    templateVars.error = "You forgot to input email/password.";
    return res
      .status(400)
      .render("login", templateVars)
      .send("Email/password field is empty.\n");
  }

  if (!userID) {
    templateVars.error = "This email does not exist.";
    return res
      .status(403)
      .render("login", templateVars)
      .send("The email does not exist.\n");
  }

  if (!bcrypt.compareSync(password, users[userID].password)) {
    templateVars.error = "Incorrect password.";
    return res
      .status(403)
      .render("login", templateVars)
      .send("Incorrect password.\n");
  }

  // set the user cookie to the userID stored in the userDatabase
  req.session.user_id = userID;
  res.redirect("/urls");
});

/*--------------------- Logout Route ---------------------*/

// clear userID cookie when logging out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

/*--------------------- Start Server ---------------------*/

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
