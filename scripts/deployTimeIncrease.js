const increaseTime = require("../test/utils/increaseTime");

async function increase(callback) {
  try {
    const timeIncrease = 3600 * 31 * 24;
    await increaseTime(timeIncrease, web3);
    callback(new Error("Time increased Success"));
  } catch (error) {
    callback(error);
  }
}

module.exports = increase;
