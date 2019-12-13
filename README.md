## @davalapar/threader

worker_threads made ez

#### Goals

- easier threading for minimal i/o cpu-intensive tasks
- just works with `SharedArrayBuffer`

#### Api

- exports `threader (filename, asyncTask, threadCount)` function
  - `filename*` : always pass `__filename`
  - `asyncTask*` : your async function for your thread instance
  - `threadCount` : threads to spawn, defaults to `require('os').cpus().length`
  - returns `enqueue(data)` function
- `enqueue(data)`
  - `data` : data you wanna work on
  - returns `promise`
- `enqueue.unref()` - unrefs all your workers
- `enqueue.ref()` - refs all your workers

#### Usage

```js
// stringify.js

const threader = require('../index');

module.exports = threader(__filename, async (data) => {
  // do your thing here
  await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 1000)));
  const result = JSON.stringify(data);

  // return your data here
  return result;
});
```

```js
// index.js

const stringify = require('./stringify');

for (let i = 0, l = 20; i < l; i += 1) {
  stringify({ a: i })
    .then(console.log)
    .catch(console.error);
}

// unref your workers once you're done
setTimeout(stringify.unref, 3000);

```

#### License

MIT | @davalapar