// jshint node: true, esversion: 6
'use strict';
import crypto from 'crypto';

import mysql from 'mysql2/promise';
let db = null;
try {
  db = mysql.createPool(process.env.NJAUQ_DB);
} catch (error) {
  console.error('Could not start MySQL: ' + error);
}

// var salt = crypto.randomBytes(8).toString('hex');
// console.log('salt', salt);
// db.execute('INSERT INTO Users (Username, password, salt) VALUES (?,?,?)', [
//   'username',
//   crypto.pbkdf2Sync('password', salt, 310000, 32, 'sha256').toString('hex'),
//   salt
// ]);
export { db };