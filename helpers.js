const getUserByEmail = (email, database) => {
  return Object.keys(database).find(
    (userID) => database[userID].email === email
  );
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

const urlsForUser = (id, database) => {
  const userURL = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === id) {
      userURL[shortURL] = database[shortURL];
    }
  }
  return userURL;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };
