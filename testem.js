module.exports = {
  "launchers": {
    "Node": {
      "command": `qunit "dist/tests.js"`,
      "protocol": "tap"
    },
  },

  "src_files": [
    "dist/tests.js"
  ],

  "framework": "qunit",
  "test_page": "dist/index.html?hidepassed",

  "browser_args": {
    "Chrome": [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--remote-debugging-port=9222",
      "--user-data-dir=/tmp"
    ]
  },

  "disable_watching": true,
  "launch_in_dev": ["Node", "Chrome"],
  "launch_in_ci": ["Node", "Chrome"]
}
