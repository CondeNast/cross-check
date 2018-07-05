module.exports = {
  launchers: {
    Node: {
      cwd: "dist",
      command: `qunit "tests.js"`,
      protocol: "tap"
    }
  },

  cwd: "dist",
  src_files: ["tests.js"],
  test_page: "index.testem.html",

  framework: "qunit",

  browser_args: {
    Chrome: [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--remote-debugging-port=9222",
      "--user-data-dir=/tmp/chrome"
    ]
  },

  launch_in_dev: ["Node", "Chrome"],
  launch_in_ci: ["Node", "Chrome"]
};
