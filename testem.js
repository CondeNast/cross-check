module.exports = {
  launchers: {
    Node: {
      cwd: process.env.EMBER_CLI_TEST_OUTPUT,
      command: `qunit "tests.js"`,
      protocol: "tap"
    }
  },

  framework: "qunit",
  test_page: "index.testem.html?hidepassed",

  browser_args: {
    Chrome: [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--remote-debugging-port=9222",
      "--user-data-dir=/tmp"
    ]
  },

  disable_watching: true,
  launch_in_ci: ["Node", "Chrome"],
  launch_in_dev: ["Node", "Chrome"]
};
