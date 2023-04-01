import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

export const debug = data => {
  try {
    return ( process.env.NJAUQ_DEV == 1 ) ? JSON.stringify(data, null, 2) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
  
}

export const minify = async (wid, qid, image) => {
  try {

    const path = `./assets/img/week${ wid }`;
    if (!existsSync(path)) mkdirSync(path);

    const output = `${ path }/${ qid }.jpg`,
          md = await sharp(image.data).metadata(),
          resize = (md.height > md.width) ? { height: 400 } : { width: 400 };
          
    const saved = await sharp(image.data).resize(resize).jpeg({ mozjpeg: true, quality: 50 }).toFile(output);
    const stats = {
      old_format: md.format,
      old_dimensions: `${ md.width }x${ md.height }`,
      new_dimensions: `${ saved.width }x${ saved.height }`,
      old_size: formatBytes(md.size),
      new_size: formatBytes(saved.size),
      reduction: (md.size / saved.size).toFixed(1)
    }

    return stats;

  } catch (error) {
    console.error(error);
    return { err: error };
  }

}

const formatBytes = (bytes, decimals = 1) => {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'K', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${ parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) }${sizes[i]}`
}