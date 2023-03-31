// jshint node: true, esversion: 6
'use strict';

/******************************************************************************
index.js main - entry point for app
******************************************************************************/

import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();
import { db }     from './models/index.js';
import { engine } from 'express-handlebars';
import pkg        from './package.json' assert { type: 'json' };
import router     from './routes/routes.js';
import authRouter from './routes/authRoutes.js';
import session    from 'express-session';
import logger     from './logs/index.js'; 
import passport   from 'passport';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fileUpload = require('express-fileupload');

app.engine('.hbs', engine({ 
  extname: '.hbs',
  defaultLayout: 'default',
  helpers: {
    select: (selected, option) => {
      return (selected == option) ? 'selected' : '';
    }
  }
  
}));

// set static route
app.use(express.static('assets'));
app.set('port', process.env.PORT || 2021); // a good year?

// parse post data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(fileUpload());

app.set('view engine', '.hbs');
app.set('views', './views');

app.use(session({
  secret: 'sfshbjlkkgkwegekwge',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));
// make User object available in handlebars views
app.use((req, res, next) => {
  if (!res.locals.user && req.user) {
    res.locals.user = req.user;
  }
  next();
});

app.use('/', authRouter);
app.use('/', router);

// start the server
try {
  console.log(`----------| ${ pkg.name } started |----------`);
  const db_name = await db.query('SELECT DATABASE();');

  console.log(`database  : ${ db_name[0][0]['DATABASE()'] }`);
  app.listen(app.get('port'), () => {
    //console.log(`system up : ${ moment().format('DD MMM HH:mm:ss') } `)
    console.log(`port      : ${ app.get('port') }`);
    console.log(`--------------------------------------`);
    logger.info('system started');
  })
} catch ( err ) {
  console.error(err);
}
