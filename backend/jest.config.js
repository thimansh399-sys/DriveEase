module.exports = {
  testEnvironment: "node",
  preset: "@shelf/jest-mongodb",
  testMatch: ["**/tests/**/*.test.js"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8"
};