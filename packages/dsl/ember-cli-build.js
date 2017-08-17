"use strict";

const fs = require('fs');
const path = require('path');

const funnel = require('broccoli-funnel');
const merge = require('broccoli-merge-trees');
const compileTypescript = require('broccoli-typescript-compiler').typescript;

module.exports = function() {
  let root = process.cwd();

  let src = [
    pick('src'),
    pick('node_modules')
  ];

  if (!isProdBuild()) {
    src.push(pick('test'));
  }

  let input = merge(src, {
    annotation: 'TypeScript Source'
  });

  let builds = [];

  builds.push(funnel(
    typescript(input, 'commonjs', {
      module: 'commonjs',
      target: 'es2015',
      lib: 'esnext',
      downlevelIteration: true,
      declaration: false
    }),
    { destDir : 'commonjs' }
  ));

  if (isProdBuild()) {
    let modules = typescript(input, 'modules', {
      module: 'es2015',
      target: 'esnext',
      declaration: true
    });

    builds.push(funnel(modules, {
      include: ['**/*.d.ts'],
      destDir: 'types'
    }));

    builds.push(funnel(modules, {
      exclude: ['**/*.d.ts'],
      destDir: 'modules'
    }));

    return merge(builds);
  } else {
    let merged = merge(builds);

    let testHTML = funnel('test', { include: ['index.html'] });

    let testModules = funnel(
      typescript(input, 'test', {
        module: 'es2015',
        target: 'es2015',
        lib: 'esnext',
        declaration: false
      })
    );

    let testBundle = new WebpackPlugin([testModules], {
      webpack: {
        entry: './test/index.js',
        output: { filename: 'tests.js' },
        resolve: {
          alias: {
            '@validations/dsl$': 'src/index.js'
          }
        }
      }
    });

    let qunit = funnel(path.dirname(require.resolve('qunitjs')));

    return merge([merged, testHTML, testBundle, qunit, funnel(merged, {
      srcDir: 'commonjs/src',
      destDir: 'commonjs/test/node_modules/@validations/dsl'
    })]);
  }
};

function pick(path) {
  return funnel(path, { destDir: path });
}

function typescript(input, annotation, compilerOptionsOverride) {
  return compileTypescript(input, {
    tsconfig: tsconfig(compilerOptionsOverride),
    annotation
  });
}

function tsconfig(compilerOptionsOverride) {
  let contents = fs.readFileSync('./tsconfig.json', 'utf-8');
  let parsed = new Function(`return ${contents}`)();

  parsed.compilerOptions = Object.assign(parsed.compilerOptions, compilerOptionsOverride);

  return parsed;
}

function isDevBuild() {
  return process.env.EMBER_ENV === 'development';
}

function isTestBuild() {
  return process.env.EMBER_ENV === 'test';
}

function isProdBuild() {
  return process.env.EMBER_ENV === 'production';
}

const CachingWriter = require('broccoli-caching-writer');
const Webpack = require("webpack");

class WebpackPlugin extends CachingWriter {
  constructor(input, { annotation, destDir, webpack } = {}) {
    super(input, { annotation });

    if (!webpack) {
      throw new Error('must supply webpack options');
    }

    this.destDir = destDir || '.';
    this.webpackOptions = webpack;
  }

  build() {
    let promises = this.inputPaths.map(context => {
      let options = Object.assign({}, this.webpackOptions, {
        context,
        resolve: Object.assign({}, this.webpackOptions.resolve, {
          modules: [path.resolve(process.cwd(), 'node_modules'), context]
        }),
        output: Object.assign({}, this.webpackOptions.output, {
          path: path.resolve(this.outputPath, this.destDir)
        })
      });

      let compiler = Webpack(options);

      return new Promise((res, rej) => {
        compiler.run((err, stats) => {
          if (err) rej(err);
          res(stats);
        })
      });
    });

    return Promise.all(promises);
  }
}
