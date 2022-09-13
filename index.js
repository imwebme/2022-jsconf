import chalk from 'chalk';
import imageToAscii from "image-to-ascii";
// import {promises as fs} from 'fs';
import fs from 'fs';
import _ from 'lodash';
import getStream from 'get-stream';
import { parse } from 'csv-parse';
import table from 'text-table';

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
  console.log(primary("JSConf imweb에 오신것을 환경합니다."))
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


  const parseStream = parse({delimiter: ','});
  const data = await getStream.array(fs.createReadStream('data.csv').pipe(parseStream));
  const randomIndex = _.random(0, data.length - 1);
  const chosen = data[randomIndex];

  const c = `${chosen[1]} ${chosen[2]}`
  print(`
  축 당첨
  
  ${c}
  
  JSConf 2022 아임웹 부스에 참여해주셔서 감사합니다.
  `);

  let list = "";
  while (!list) {
    list = yield "참여자 명단 보기 [y/N]";
    if (!list) {
      list = 'N';
    }
    if (list == 'N' || list == 'n') {
      process.exit(0);
    }
  }

  const listTable = data.slice().map(array => {
    const time = array[0];
    let name = array[1];
    let phone = array[2];
    name = maskingName(name);
    phone = maskingPhone(phone);
    return [time, name, phone];
  })
  
  listTable[randomIndex] = listTable[randomIndex].map(text => primary(text))
  console.log(table(listTable, { align: [ 'l', 'r', 'r' ] }));

  console.log(c);
  await fs.writeFile('result.txt', c, err => {
    console.log(err);
  });
}

// 파일유무 확인
const fileExists = async path => !!(await fs.stat(path).catch(e => false));

async function run(logo) {
  console.clear();
  console.log(logo);
  // const exists = await fileExists('./result.txt');
  // if (exists) process.exit(0);
  await runSequence(createOriginalPostersSequence);
  process.exit(0);
}

imageToAscii('https://vendor-cdn.imweb.me/images/main/imweb-favicon-192x192.png?v1', {
  white_bg: false
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