const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// choose model
const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash",
});

module.exports = { model };