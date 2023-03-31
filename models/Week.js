// jshint node: true, esversion: 6
'use strict';

import { db } from './index.js';
import { marked } from 'marked';
import { DateTime } from 'luxon';
import { existsSync }  from 'node:fs';
import logger from '../logs/index.js';
import { minify } from '../config/index.js';

export const Week = {

  questions: async (wid, parse = true) => {
    try {
      const sql = 'SELECT Q.id, clarification_text, Q.week_id, answer_text, link_text, q_order, Q.link, group_id FROM questions AS Q LEFT JOIN links AS L ON L.link = Q.link WHERE Q.week_id = ? ORDER BY CAST(q_order AS UNSIGNED)';
      let [rows] = await db.execute(sql, [wid]);
      rows.map(row => { 
        if (parse) { row.answer_text = marked.parseInline(row.answer_text); }
        row.group_id = row.group_id || row.link.at(-1); 
      })
      return rows;
    } catch (err) {
      logger.error(`error (${ err }) in Week.questions`);
      console.error(err);
      return { err: err };
    }

  },

  links: async (wid, parse = true) => {
    try {
      const sql = 'SELECT explanation_text, group_id FROM links WHERE week_id = ?';
      let [rows, fields] = await db.execute(sql, [wid]);
      if (parse) { rows.map(row => { row.explanation_text = marked.parseInline(row.answer_text); }) };
      return rows;
    } catch (err) {
      return { err: err };
    }
  },

  list: async () => {
    try {
      const sql = 'SELECT W.id, W.preview, W.live, DATE_FORMAT(W.deadline,"%Y-%m-%d") AS deadline, COUNT(Q.id) AS questions FROM weeks AS W INNER JOIN questions AS Q ON W.id = Q.week_id GROUP BY W.id, W.preview, W.live, W.deadline ORDER BY W.deadline DESC';
      let [rows] = await db.query(sql);

      rows.map(r => {
        r.format = DateTime.fromISO(r.deadline).toLocaleString(DateTime.DATE_SHORT);
      });
      return rows;
    } catch (error) {
      console.error(error);
      return { err: error };
    }
  },

  latest: async () => {
    try {
      const [wid] = await db.execute('SELECT MAX(id) AS latest FROM weeks WHERE live = 1');
      return wid[0].latest;
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  sheet: async (wid) => {
    try {
      const sql = 'SELECT group_id, explanation_text, q_order, answer_text, link_text, q_order FROM questions AS Q INNER JOIN links AS L ON Q.link = L.link WHERE Q.week_id = ? ORDER BY CAST(q_order AS UNSIGNED)';
      const [rows] = await db.execute(sql, [wid]);
      
      // define an object to hold the links explanation
      let grouped = { 'A': { qs: [], text: '' }, 'B': { qs: [], text: '' }, 'C': { qs: [], text: '' }, 'D': { qs: [], text: '' }, 'E': { qs: [], text: '' } };
      rows.map(row => { 
        grouped[row.group_id].qs.push(row.q_order);
        if (grouped[row.group_id].text == '') grouped[row.group_id].text = row.explanation_text;
        row.answer_text = marked.parseInline(row.answer_text);
      });
      return { rows: rows, grouped: grouped };
    } catch (err) {
      console.error(err);
      return { err: err };
    }
  },

  insert: async (form, image) => {
    try {
      const stats = await minify(form.week, form.qid, image);
      const sql = 'INSERT INTO questions (week_id, clarification_text, answer_text, link_text, q_order, link) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE clarification_text = ?, answer_text = ?, link_text = ?, link = ?';
      const gp = `${ form.week }${ form.group }`;
      const [rows] = await db.execute(sql, [form.week, form.ct || null, form.ans, form.lt, form.qid, gp, form.ct || null, form.ans, form.lt, gp]);
      return { stats: stats, rows: rows.affectedRows};
    } catch (error) {
      console.error(error);
      logger.error(`Error (${ error }) in Week.insert`);
      return({ error: error });
    }
  },

  insertLinks: async (links) => {
    try {
      if (links.et.length !== 5 || links.gp.length !== 5) return false;
      const sql = 'INSERT INTO links (week_id, explanation_text, group_id, link) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE explanation_text = ?';
      let link = '', rows = null, res = 0;
      for (let x = 0; x < 5; x++) {
        link = links.week.concat(links.gp[x]);
        [rows] = await db.execute(sql, [links.week, links.et[x], links.gp[x], link, links.et[x]]);
        res += rows.affectedRows;
      }
      return (res >= 5);
    } catch (error) {
      console.log(`Error (${ error }) in Week.insertLinks`);
      return { error: error };
    }
  },

  check: async (wid) => {
    try {
      let checks = [];
      for (let x = 1; x < 21; x++) {
        if (!existsSync(`./assets/img/week${ wid }/${ x }.jpg`)) checks.push(`image /img/week${ wid }/${ x }.jpg is missing`)
      }
      const sql = 'SELECT RIGHT(link,1) AS links, COUNT(id) AS cnt FROM questions WHERE week_id = ? GROUP BY RIGHT(link,1)';
      let [rows] = await db.execute(sql, [wid]);
      for (let y = 65; y < 70; y++) {
        let row = rows.find(({ links }) => links == String.fromCharCode(y));
        if (!row || row.cnt != 4) checks.push(`Link ${ String.fromCodePoint(y) } has ${ (row) ? row.cnt : 0 }/4 associated questions`);
      }
      const lsql = 'SELECT COUNT(id) AS cnt FROM links WHERE week_id = ?';
      let [lrows] = await db.execute(lsql, [wid]);
      if (!lrows[0] || lrows[0].cnt != '5') checks.push(`Week ${ wid } has ${ lrows[0].cnt }/5 link entries`);
      return checks;
    } catch (error) {
      logger.error(`Error (${ error }) in Week.check`);
      return { err: error };
    }
  },

  status: async (wid) => {
    try {
      if (!Number.isInteger(wid * 1)) return null;
      const sql = 'SELECT preview, live FROM weeks WHERE id = ?';
      const [rows] = await db.execute(sql, [wid]);
      return rows[0];
    } catch (error) {
      logger.error(`Error (${ error }) in Week.status`);
      return { err: error };
    }
  },

  publish: async (wid) => {
    try {
      const sql = 'UPDATE weeks SET live = 1, preview = 0 WHERE id = ?';
      let [rows] = await db.execute(sql, [wid]);
      return rows;
    } catch (error) {
      logger.error(`Error (${ error }) in Week.publish`);
      return { err: error };
    }
  }

}
