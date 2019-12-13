const threader = require('../index');

module.exports = threader(__filename, async (data) => {
  // do your thing here
  await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 1000)));
  const result = JSON.stringify(data);

  // return your data here
  return result;
});
