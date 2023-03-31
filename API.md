# list of API routes

| route | description |
| ---   | ---         |
| `GET /`                   | home page
| `GET /dashboard`          | dashboard (list of weeks)
| `GET /login`              | show the login screen
| `GET /quiz/:wid`          | get quiz for week **:wid**
| `GET /quiz/:wid/sheet`    | get answer sheet for week **:wid**
| `GET /quiz/:wid/answers`  | get quiz sheet with answers for week **:wid**
| `GET /quiz/:wid/edit`     | edit page for week **:wid** //TODO
| `GET /quiz/:wid/add` 🔑   | show new quiz screen and form


| route | description |
| ---   | ---         |
| `POST /uploadImage`       | process (preview, minify & save) an image dropped onto the 'new quiz' page
| `POST /uploadText`        | process the question and answer text from the 'new quiz' page
| `POST /login`             | handle login credentials
| `POST /logout`            | handle logging out process
