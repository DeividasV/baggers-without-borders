module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0],
    "scope-enum": [
      2,
      "always",
      [
        "ui",
        "api",
        "db",
        "auth",
        "docs",
        "test",
        "deploy",
        "deps",
        "hof",
        "data",
        "admin",
        "infra",
        "tooling",
        "legal",
      ],
    ],
  },
};
