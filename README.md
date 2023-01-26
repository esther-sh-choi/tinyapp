# Esther's TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

The front-end is implemented using Bootstrap with a little bit of inline CSS.

## Table of Content

- [Description](https://github.com/esther-sh-choi/tinyapp#esthers-tinyapp-project)
- [Final Product](https://github.com/esther-sh-choi/tinyapp#final-product)
  - [Registration/Login](https://github.com/esther-sh-choi/tinyapp#registerlogin-page)
  - [Creating New Short URLs](https://github.com/esther-sh-choi/tinyapp#create-new-short-url-page)
  - [Main Page](https://github.com/esther-sh-choi/tinyapp#main-page)
  - [Editing Short URLs](https://github.com/esther-sh-choi/tinyapp#short-url-detailedit-page)
  - [Short URLs Visit Log](https://github.com/esther-sh-choi/tinyapp#short-url-detailedit-page)
  - [Example of Error Message](https://github.com/esther-sh-choi/tinyapp#example-of-error-message-on-detailedit-page)
  - [Responsive Design](https://github.com/esther-sh-choi/tinyapp#short-url-detailedit-page-mobile)
  - [Error Page](https://github.com/esther-sh-choi/tinyapp#error-page)
- [Dependencies](https://github.com/esther-sh-choi/tinyapp#dependencies)
- [Getting Started](https://github.com/esther-sh-choi/tinyapp#getting-started)

## Final Product

#### Register/Login Page

- Register using a unique email. You cannot register with an existing email.
- If there are errors, an error message will appear below the form.
- Successful login and registration will store a cookie with the unique user ID, which will expire when the user logs out.

  !["Screenshot of registration page"](https://github.com/esther-sh-choi/tinyapp/blob/main/docs/register_page.png?raw=true)

#### Create New Short URL Page

- Enter the URL to shorten. A 6 characters-long alphanumeric short URL will be randomly generated.
- In order to use the short URL, follow the route _http://localhost:8080/u/[shortURL]_
- If it does not start with http:// or https:// or if the field is left empty, it will return an error.

  !["Screenshot of /url/new page"](https://github.com/esther-sh-choi/tinyapp/blob/main/docs/urls_new.png?raw=true)

#### Main Page

- Keep track of all of user's short URLs and manage them (ie., edit and delete).
- The tables displays the long URL, date created, number of visits, and the number of unique visits for each short URL.
- Other users cannot view or manipulate your URL data.

  !["Screenshot of /url page"](https://github.com/esther-sh-choi/tinyapp/blob/main/docs/urls_index.png?raw=true)

#### Short URL Detail/Edit Page

- Shows which route the selected short URL redirects to.
- Shows the date and time when URL was created.
- Edit the URL associated with this particular short ID.
- If it does not start with http:// or https:// or if the field is left empty, it will return an error.
- This page displays:
  - the total number of visits using the short URL;
  - the total number of unique visits (one visit per _visitor ID_);
  - and the history of all the visits (visitor ID and timestamp).
- _What to know about the visitor ID:_
  - The 8 character alphanumeric visitor ID is generated at the time of registration and it is stored to the user's database.
  - Each time user logs in, this unique visitor ID is stored to the cookie until sign out.
  - If the user is not logged in, the visitor ID will be generated and stored in the cookie and will remain in the browser until cookie is cleared or expires.

!["Screenshot of /url/:id page"](https://github.com/esther-sh-choi/tinyapp/blob/main/docs/urls_show.png?raw=true)

##### Example of Error Message on Detail/Edit Page

!["Screenshot of /url/:id page error message"](https://github.com/esther-sh-choi/tinyapp/blob/main/docs/error_message.png?raw=true)

#### Short URL Detail/Edit Page (Portrait Mode)

- This is an example of the Detail page responsve design using Bootstrap and CSS Flexbox.
  !["Screenshot of /url/:id page responsive design"](https://github.com/esther-sh-choi/tinyapp/blob/main/docs/urls_show_responsive.png?raw=true)

#### Error Page

- When the user tries to access the Main Page or Create New Short URL Page without logging in, this error page will appear.
  !["Screenshot of error page"](https://github.com/esther-sh-choi/tinyapp/blob/main/docs/error_page.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcryptjs
- cookie-session
- get-user-locale
- method-override

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.
