'use strict';

import { db } from './index.js';

export const User = {
  
  find: async (username) => {
    try {
      const sql = 'SELECT * FROM users WHERE username = ? LIMIT 1;';
      const [rows] = await db.execute(sql, [username]); 
      return rows[0];     
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}