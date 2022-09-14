import chalk from 'chalk';
import imageToAscii from "image-to-ascii";
import fs, {promises} from 'fs';
import _ from 'lodash';
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

function maskingEmail(email) {
  email = email.split('');
  let finalArr=[];
  let len = email.indexOf('@');
  email.forEach((item,pos)=>{
  (pos>=1 && pos<=len-2) ? finalArr.push('*') : finalArr.push(email[pos]);
  })
  return finalArr.join('')
}

/**
 * 중복참여 방지
 * 동명이인이 있을 수 있음으로 이메일로만 체크 
 * @param Array data 
 * @returns set
 */
export function duplicatedCheck(data) {
  // 중복 제거 기준 이름 확인 > 이메일
  return _.uniqBy(data, function (e) {
    return e['이메일'];
  });
}

export function getFileContentsCsv(fileName){
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


  let data = await getFileContentsCsv('data.csv');
  data = duplicatedCheck(data);

  let results = [];
  while(results.length < 5) {
    const is = yield 'enter!';
    print('🎉 축 당첨\n');
    const randomIndex = _.random(0, data.length - 1);
    const chosen = data[randomIndex];
    results.push(chosen);
    results.map((e, index) => {
      let unit = primary('2등: ');
      if (index == 4) {
        unit = chalk.hex('#00D69A')('1등: ')
      }
      const r = unit + `${maskingName(e['성함'])} ${maskingEmail(e['이메일'])} ${maskingPhone(e['연락처'])}`;
      
      print(r);
    })
  }

  print(`\nJSConf 2022 아임웹 부스에 참여해주셔서 감사합니다.\n\n\n\n\n\n\n\n\n`);

  await promises.writeFile('result.txt', results.map(e => `${e['성함']} ${e['이메일']} ${e['연락처']}`).join('\n'), err => {
    console.log(err);
  });
}

// 파일유무 확인
export const fileExists = async path => !!(await promises.stat(path).catch(e => false));

async function run(logo) {
  console.clear();
  console.log(logo);
  const exists = await fileExists('./result.txt');
  if (exists) {
    console.log('이미 추첨이 완료되었습니다. 감사합니다 🙏')
    process.exit(0)
  };
  await runSequence(createOriginalPostersSequence, true, logo);
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
