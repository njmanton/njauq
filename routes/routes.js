// jshint node: true, esversion: 6
'use strict';
import { db } from '../models/index.js';
import { Week } from '../models/Week.js';
import { debug } from '../config/index.js';
import express from 'express';
import QRCode from 'qrcode';

const router = express.Router();

import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

router.get('/', (req, res) => {
  res.render('main');
})

router.get('/latest', async (req, res) => {
  try {
    const wid = await Week.latest(),
          data = await Week.questions(wid);

    res.render('questions', {
      debug: debug(data),
      pictures: data,
      week: wid,
      qr: await QRCode.toDataURL(`https://udderquiz.mxxyqh.com/quiz/${ wid }/?=qr`)
    })
  } catch (error) {
    res.status(500).send(false);
  }
});

router.get('/quiz/:wid', async (req, res, next) => {
  if (!Number.isInteger(req.params.wid * 1)) return(next());
  const data = await Week.questions(req.params.wid);
  res.render('questions', {
    debug: debug(data),
    pictures: data,
    week: req.params.wid,
    qr: await QRCode.toDataURL(`https://udderquiz.mxxyqh.com/quiz/${ req.params.wid }/?=qr`),
    status: await Week.status(req.params.wid)
  });
});

router.get('/quiz/:wid/answers', async (req, res, next) => {
  if (!Number.isInteger(req.params.wid * 1)) return(next());
  const data = await Week.questions(req.params.wid);
  res.render('questions', {
    debug: debug(data),
    pictures: data,
    week: req.params.wid,
    answers: true
  });
});

router.get('/quiz/:wid/sheet', async (req, res, next) => {
  if (!Number.isInteger(req.params.wid * 1)) return(next());
  const data = await Week.sheet(req.params.wid);
  res.render('sheet', {
    debug: debug(data),
    rowsA: data.rows.slice(0, 10), // split into 2x10 for side by side tables
    rowsB: data.rows.slice(10),
    groups: data.grouped,
    week: req.params.wid
  })
});

// default route if nothing else matches
router.get('*', (req, res) => {
  res.status(404).render('404', {});
});

export default router;