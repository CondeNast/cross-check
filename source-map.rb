require "base64"
require "json"
require "fileutils"

include FileUtils

if ENV["SM_FILE"]
  file = File.read(ENV["SM_FILE"])
else
  rm_rf "DEBUG"
  ENV["BROCCOLI_DEBUG"] = "libkit:typescript:*"
  unless system "ember build"
    abort "ember build failed"
  end

  file = File.read("./DEBUG/libkit/typescript/after/src/index.js")
end

map = file.match(/# sourceMappingURL=data:application\/json;base64,(.*)/m)[1]
decoded = Base64.decode64(map)
json = JSON.parse(decoded)

puts "file:       #{json["file"]}"
puts "sourceRoot: #{json["sourceRoot"]}"
puts "sources:    #{json["sources"].inspect}"