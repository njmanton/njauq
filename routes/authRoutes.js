'use strict';

import express from 'express';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import logger from '../logs/index.js';
import crypto from 'crypto';
import { debug } from '../config/index.js';
import { User } from '../models/User.js';
import { Week } from '../models/Week.js';

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.returnTo = req.url;
  res.redirect('/login');
  return next();
}

passport.use(new LocalStrategy(async (username, password, cb) => {
  try {
    const row = await User.find(username);
    if (!row) return cb(null, false, { message: 'Incorrect username or password' });
    crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', (err, hash) => {
      if (err) return cb(err);
      if (row.password !== hash.toString('hex')) {
        return cb(null, false, { message: 'Incorrect username or password '});
      }
      logger.info(`${ row.username } logged in`);
      return cb(null, row);
    })
  } catch (err) {
    console.log(err);
    return cb(err);
  }
}));

const authRouter = express.Router();

authRouter.get('/login', (req, res) => {
  res.render('login');
});

authRouter.get('/logout', (req, res, next) => {
  
  const logging_out_user = req.user.username;
  req.logout(err => {
    if (err) { return next(err); }
    logger.info(`${ logging_out_user } logged out`);
    res.locals.user = null;
    res.render('main', {
      message: true,
      message_text: 'Successfuly logged off'
    });
  });
});

authRouter.get('/status/:wid', async (req, res) => {
  res.send(await Week.status(req.params.wid));
})

authRouter.get('/quiz/:wid/edit', isAuthenticated, async (req, res) => {
  // get data on questions/links for given week
  try {

    const qs = await Week.questions(req.params.wid, false),
          ls = await Week.links(req.params.wid, false);

    let q_data = [], l_data = [];
    for (let x = 1; x < 21; x++) {
      let row = qs.find(({ q_order }) =>  q_order == (x) );
      q_data[x] = row || { q_order: x, week_id: req.params.wid };
    }
    for (let y= 0; y < 5; y++) {
      let row = ls.find(({ group_id }) =>  group_id == String.fromCharCode(65 + y) );
      l_data[y] = row || { group_id: String.fromCharCode(65 + y) };
    }
    res.render('edit2', {
      debug: debug([ q_data, l_data ]),
      week: req.params.wid,
      links: l_data,
      questions: q_data,
      title: `TUQ | Editing quiz ${ req.params.wid }`
    })
  } catch (err) {
    console.error(err);
    res.status(500).send(false);
  }

});

authRouter.get('/checkWeek/:wid', async (req, res) => {
  // use this to check the validity of a given week
  // 1. are there 20 images uploaded with correct filenames
  // 2. are there 5 link entries
  // 3. are there 20 question entries
  // 4. are there 4 sets of each link
  const data = await Week.check(req.params.wid);
  res.render('preview', {
    debug: debug(data),
    data: data,
    week: req.params.wid
  })
});

authRouter.post('/submit', async (req, res) => {
  if (req.files && req.files.image) {
    const data = await Week.insert(req.body, req.files.image);
    res.send(data);    
  } else {
    res.status(400).send(false);
  }
});

authRouter.post('/submitLinks', async (req, res) => {
  try {
    const data = await Week.insertLinks(req.body);
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error });
  }
});

authRouter.post('/publish', async (req, res) => {
  // publish a week to make it available to users
  // set preview flag to 0 and live to 1
  try {
    const data = await Week.publish(req.body.wid);
    res.send(data);
  } catch (error) {
    logger.error(error);
    res.status(500).send({ error: error });
  }
});

authRouter.post('/login', passport.authenticate('local', {
  keepSessionInfo: true,
  successReturnToOrRedirect: '/dashboard',
  failureRedirect: '/login'
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

export default authRouter;