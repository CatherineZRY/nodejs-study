/* 
1. Use the inquirer npm package to get user input.
2. Use the qr-image npm package to turn the user entered URL into a QR code image.
3. Create a txt file to save the user input using the native fs node module.
*/

import inquirer from 'inquirer';
import qr from 'qr-image';
import fs from 'fs';

console.log('Hi, welcome to Node QR generator');

const questions = [
  {
    type: 'input',
    name: 'url',
    message: "What's your QR URL?",
    validate(value) {
      const pass = value.match(
        /^https:\/\//i,
      );
      if (pass) {
        return true;
      } else {
        return 'Please enter a valid url';
      }
    },
  },
];

inquirer.prompt(questions).then((answers) => {
  if (answers.url) {
    const validUrl = answers.url;
    console.log(`QR URL: ${validUrl}`);
    const qrPng = qr.image(validUrl);
    qrPng.pipe(fs.createWriteStream('generate-qr.png'));
  }
});
