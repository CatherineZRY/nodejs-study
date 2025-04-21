// const generateName = require('sillyname'); // 此种导包方式需要和package.json中的设置的type相匹配
import generateName from 'sillyname';
// 若type中设置的导入包方式为commonjs, 则默认为使用commonJs的规范进行导包
// 若type中设置的导入包方式为module, 则默认为使用es6的规范进行导包

const sillyname = generateName();

console.log(`My Name is ${sillyname}`)