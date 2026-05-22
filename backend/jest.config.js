module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  moduleNameMapper: {
    "^@eof/shared$": "<rootDir>/../packages/shared/src/index.ts"
  },
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "../coverage/backend",
  testEnvironment: "node"
};
