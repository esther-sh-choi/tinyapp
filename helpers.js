/**
 * This function finds the user information object given the user email.
 * If email doesn't exist in the database, it will return undefined.
 *
 * @param {string} email The login email input by user.
 * @param {object} database The users database that potentional includes a user object with an email key.
 * @return {object} The user object that has user.email that is equal to input email.
 */
const getUserByEmail = (email, database) => {
  return Object.keys(database).find(
    (userID) => database[userID].email === email
  );
};

/**
 * This function returns a string of alphanumeric values given the length of the resulting string.
 * The chance of number appearing as one of the string is 33%.
 * Alphabets can include both upper and lower case.
 *
 * @param {integer} length The integer determines the length of the randomly generated string.
 * @return {string} A string of random alphanumeric values with a length given in the parameter.
 */
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

/**
 * This function finds the shortURL objects that are created a particular user.
 * This user is known by the user id passed in as an argument.
 *
 * @param {string} id The user ID of the user that is currently logged in.
 * @param {object} database The urlDatabase of all the shortURLs created by all users.
 * @return {object} Return an object with the only the shortURL objects created by the user who is logged in.
 */
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
