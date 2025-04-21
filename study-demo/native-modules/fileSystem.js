const fs = require('fs');// Common-Js写法

console.log('Hi')

fs.writeFile('./message.json', '{"test": "aaa"}', (error) => {
  if (error) throw error;
  console.log('There are some errors:');
  console.log(error)
})
console.log('finished write')

fs.readFile('message.json', "utf8", (err, data) => {
  if (err) {
    console.log(`There is a error: ${err}`)
    throw err
  }

  console.log('have read file')
  console.log(data);
});

console.log('readFile called');