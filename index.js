/* eslint-disable no-console */

const os = require('os');
const crypto = require('crypto');
const threads = require('worker_threads');

const threader = (filename, asyncTask, threadCount) => {
  if (typeof filename !== 'string') {
    throw Error('threader(filename, asyncTask, threadCount) : "filename" must be a string.');
  }
  if (typeof asyncTask !== 'function') {
    throw Error('threader(filename, asyncTask, threadCount) : "asyncTask" must be a function.');
  }
  if (threadCount !== undefined) {
    if (typeof threadCount !== 'number') {
      throw Error('threader(filename, asyncTask, threadCount) : "threadCount" must be a number.');
    }
    if (Number.isNaN(threadCount) === true || Number.isFinite(threadCount) === false) {
      throw Error('threader(filename, asyncTask, threadCount) : "threadCount" must be a valid number.');
    }
    if (Math.floor(threadCount) !== threadCount) {
      throw Error('threader(filename, asyncTask, threadCount) : "threadCount" must be an integer.');
    }
    if (threadCount <= 0) {
      throw Error('threader(filename, asyncTask, threadCount) : "threadCount" must be greater than zero.');
    }
  }
  if (threads.isMainThread === true) {
    const createWorker = (workers, indexes, i) => {
      const worker = new threads.Worker(filename);
      const index = {};
      worker.on('message', ([id, result, errorMessage]) => {
        const [resolve, reject] = index[id];
        if (errorMessage !== null) {
          reject(Error(errorMessage));
        } else {
          resolve(result);
        }
        delete index[id];
      });
      worker.on('error', (error) => {
        console.error(`Worker[${i}] error, restarting: ${error.message}`);
        createWorker(workers, indexes, i); // restart worker here
      });
      worker.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Worker[${i}] exit: ${code}`);
        }
      });
      workers[i] = worker; // eslint-disable-line no-param-reassign
      indexes[i] = index; // eslint-disable-line no-param-reassign
    };
    const cpuCount = os.cpus().length;
    const workers = new Array(cpuCount);
    const indexes = new Array(cpuCount);
    for (let i = 0, l = cpuCount; i < l; i += 1) {
      createWorker(workers, indexes, i);
    }
    let next = 0;
    const enqueue = (data) => new Promise((resolve, reject) => {
      const worker = workers[next]; // select our next worker
      const index = indexes[next]; // get our worker index
      const id = crypto.randomBytes(32).toString('hex'); // 256-bit random id
      index[id] = [resolve, reject]; // push current id, resolve, reject to index
      worker.postMessage([id, data]); // send our data
      next += 1; // cycle our round-robin
      if (next === workers.length) {
        next = 0;
      }
    });
    enqueue.ref = () => workers.forEach((worker) => worker.ref());
    enqueue.unref = () => workers.forEach((worker) => worker.unref());
    return enqueue;
  }
  threads.parentPort.on('message', async ([id, data]) => {
    try {
      const result = await asyncTask(data);
      threads.parentPort.postMessage([id, result, null]);
    } catch (e) {
      threads.parentPort.postMessage([id, null, e.message]);
    }
  });
  return undefined;
};

module.exports = threader;
