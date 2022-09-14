import fs, {promises} from 'fs';
import { test } from 'jest';
import { duplicatedCheck, getFileContentsCsv } from '..';

// test('중복확인', () => {
//   expect('')
// })
async function run() {
  const data = await getFileContentsCsv('duplicate.csv')
  console.log(data);
}

run();