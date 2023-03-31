import sharp from 'sharp';
import { readdirSync } from 'node:fs';

const path = `/Users/nickm/Library/CloudStorage/Dropbox/www/njauq/assets/img/week1`;

//loop over files, if png save it as jpg
(async ()=>{
  // Our starting point
  try {
      // Get the files as an array
      const files = readdirSync(path);
      let fn = '';
      // Loop them all with the new for...of
      for( const file of files ) {
        fn = file.substring(0, file.length - 4);
        console.log('processing', file);
        await sharp(`${ path }/${ file }`).jpeg({ mozjpeg: true, quality: 50 }).toFile(`${ path }/${ fn }.jpg`);
      } // End for...of
  }
  catch( e ) {
      // Catch anything bad that happens
      console.error( "We've thrown! Whoops!", e );
  }

})(); // Wrap in parenthesis and call now 
