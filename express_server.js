const express = require("express");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:b2xVn2", (req, res) => {
  console.log(req.params);
  const templateVars = {
    id: req.params["b2xVn2"],
    longURL: urlDatabase["b2xVn2"],
  };
  res.render("urls_show", templateVars);
});

app.get("/urls/:9sm5xK", (req, res) => {
  const templateVars = {
    id: req.params["9sm5xK"],
    longURL: urlDatabase["9sm5xK"],
  };
  res.render("urls_show", templateVars);
});
