import chalk from 'chalk';
import imageToAscii from "image-to-ascii";
import fs, {promises} from 'fs';
// import fs from 'fs';
import _ from 'lodash';
import getStream from 'get-stream';
import { parse } from 'csv-parse';
import table from 'text-table';
import csv from 'csv-parser';

const primary = chalk.hex('#1A6DFF')

function maskingName(strName) {
  if (strName.length > 2) {
    var originName = strName.split('');
    originName.forEach(function(name, i) {
      if (i === 0 || i === originName.length - 1) return;
      originName[i] = '*';
    });
    var joinName = originName.join();
    return joinName.replace(/,/g, '');
  } else {
    var pattern = /.$/; // 정규식
    return strName.replace(pattern, '*');
  }
};

function maskingPhone(pn) {
  const regex = /\d(?=\d{4})/mg;
  return pn.replace(regex, "*");
}

function getFileContentsCsv(fileName){
  const results = [];
  const stream = fs.createReadStream(fileName)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    // .on('end', () => {
    //   console.log(results);
    // });
  ;
  return new Promise((resolve, reject) => {
    stream.on('error', function(err){
      // console.log('File read Error.');
      resolve(reject);
    })
  
    stream.on('end', function(){ // nodejs에서 Stream은 기본적으로 event emitter이다.
      // console.log('ReadStream End.');
      resolve(results);  // Array 반환
    })
  })
}

// core 'library' exposing native node console capabilities for co-routines

function getAnswer() {
  process.stdin.resume();
  return new Promise((resolve) => {
    process.stdin.once("data", function (data) {
      resolve(data.toString().trim());
    });
  });
}

async function runSequence(sequenceFactory, clearScreen = false, etcLog) {
  function print(msg, end = "\n") {
    process.stdin.write(msg + end);
  }
  let answer = undefined;
  const sequence = sequenceFactory(print);
  while (true) {
    const { value: question } = await sequence.next(answer);
    if (question) {
      print(question, " : ");
      answer = await getAnswer();
      if (clearScreen) {
        console.clear();
        etcLog && console.log(etcLog);
      }
    } else {
      break;
    }
  }
}

async function* createOriginalPostersSequence(print) {
  console.log(primary("\nJSConf imweb에 오신것을 환경합니다.\n"))
  let ready = "";
  while (!ready) {
    ready = yield "참여자 추첨 [Y/n]";
    // 기본값 처리
    if (!ready) {
      ready = 'Y';
    }
    if (ready == 'n' || ready == 'N') {
      process.exit(0);
    }
  }


  const data = await getFileContentsCsv('data.csv');
  const randomIndex = _.random(0, data.length - 1);
  const chosen = data[randomIndex];

  const c = `${chosen['이름']} ${chosen['연락처']}`
  const r = primary(`${maskingName(chosen['이름'])} ${maskingPhone(chosen['연락처'])}`);
  print(`
  🎉 축 당첨

  ${r}

  JSConf 2022 아임웹 부스에 참여해주셔서 감사합니다.
  `);

  await promises.writeFile('result.txt', c, err => {
    console.log(err);
  });
}

// 파일유무 확인
const fileExists = async path => !!(await promises.stat(path).catch(e => false));

async function run(logo) {
  console.clear();
  console.log(logo);
  const exists = await fileExists('./result.txt');
  if (exists) {
    console.log('이미 추첨이 완료되었습니다. 감사합니다')
    process.exit(0)
  };
  await runSequence(createOriginalPostersSequence);
  process.exit(0);
}

imageToAscii('https://vendor-cdn.imweb.me/images/main/imweb-favicon-192x192.png?v1', {
  white_bg: false,
  size: {
    width: 20,
    height: 20
  }
}, (err, converted) => {
  run(converted)
});


// fs.createReadStream('data.csv')
//   .pipe(csv())
//   .on('데이저 가져오기', (data) => {
//     const results = [];
//     results.push(data)
//     return results;
//   })
//   .on('랜덤 추출', () => {
//     // console.log(results);
//     const result = _.sample(results);
//     console.log(result);
//     return result;
//   })