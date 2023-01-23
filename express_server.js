const express = require("express");
const app = express();
const PORT = 8080;

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const generateRandomString = () => {
  let resultStr = "";
  for (let i = 0; i < 6; i++) {
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

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// GET /urls/new route needs to be defined before the GET /urls/:id route.
// Routes defined earlier will take precedence, so if we place this route after the /urls/:id definition, any calls to /urls/new will be handled by app.get("/urls/:id", ...) because Express will think that new is a route parameter.
// routes should be ordered from most specific to least specific.

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  if (!Object.values(urlDatabase).includes(longURL)) {
    urlDatabase[shortURL] = longURL;
  }
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});
