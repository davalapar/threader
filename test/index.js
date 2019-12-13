/* eslint-disable no-console */

const stringify = require('./stringify');

for (let i = 0, l = 20; i < l; i += 1) {
  stringify({ a: i })
    .then(console.log)
    .catch(console.error);
}

setTimeout(stringify.unref, 3000);
