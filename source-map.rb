require "base64"
require "json"
require "fileutils"

include FileUtils

files = []

if ENV["SM_FILE"]
  files = [File.read(ENV["SM_FILE"])]
else
  rm_rf "DEBUG"
  ENV["BROCCOLI_DEBUG"] = "*"
  unless system "ember build"
    abort "ember build failed"
  end

  files << File.read("./DEBUG/libkit/$typescript/$core/$modules/$after/src/index.js")
  files << File.read("./DEBUG/libkit/$typescript/$dsl/$modules/$after/src/index.js")
  files << File.read("./DEBUG/libkit/$typescript/$schema/$modules/$after/src/index.js")
end

files.each do |file|
  map = file.match(/# sourceMappingURL=data:application\/json;base64,(.*)/m)[1]
  decoded = Base64.decode64(map)
  json = JSON.parse(decoded)

  puts "file:       #{json["file"]}"
  puts "sourceRoot: #{json["sourceRoot"]}"
  puts "sources:    #{json["sources"].inspect}"
end
