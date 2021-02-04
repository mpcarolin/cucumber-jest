"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = execTest;

var _asciiTable = _interopRequireDefault(require("ascii-table"));

var _chalk = _interopRequireDefault(require("chalk"));

var _generateMessages = _interopRequireDefault(require("@cucumber/gherkin/dist/src/stream/generateMessages"));

var _IdGenerator = require("@cucumber/messages/dist/src/IdGenerator");

var _child_process = require("child_process");

var _data_table = _interopRequireDefault(require("cucumber/lib/models/data_table"));

var _support_code_library_builder = _interopRequireDefault(require("cucumber/lib/support_code_library_builder"));

var _escapeStringRegexp = _interopRequireDefault(require("escape-string-regexp"));

var _flattenAnything = require("flatten-anything");

var _jestUtil = require("jest-util");

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var env = _interopRequireWildcard(require("../env"));

var _getMocks = _interopRequireDefault(require("./getMocks"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_support_code_library_builder.default.finalize();

const space = '      ';

function createDataTable(rows) {
  const table = new _asciiTable.default();
  table.setHeading(...rows[0]);

  for (let i = 1; i < rows.length; i++) {
    table.addRow(...rows[i]);
  }

  return table.toString().split('\n').map(row => space + row).join('\n');
}

function parseFeature(cwd, featurePath, extensions) {
  const source = _fs.default.readFileSync(featurePath, 'utf8');

  const varMapExts = extensions.filter(ext => ext !== 'feature');

  const fileExtension = _path.default.extname(featurePath);

  const isJSON = fileExtension === 'json';
  const varMapPathsForEnv = JSON.parse((0, _child_process.spawnSync)('node', [_path.default.normalize(_path.default.resolve(__dirname, './getPaths.js')), cwd, _path.default.join('**', `${_path.default.basename(featurePath, fileExtension)}.${env.ENV_NAME}.vars`), JSON.stringify(varMapExts)], {
    encoding: 'utf-8'
  }).stdout); // scan relative directories to find any file that matches the feature file name,
  // but as another extension

  const varMapPaths = JSON.parse((0, _child_process.spawnSync)('node', [_path.default.normalize(_path.default.resolve(__dirname, './getPaths.js')), cwd, _path.default.join('**', `${_path.default.basename(featurePath, fileExtension)}.vars`), JSON.stringify(varMapExts)], {
    encoding: 'utf-8'
  }).stdout);

  if (!varMapPaths.length && !varMapPathsForEnv.length) {
    return featurePath;
  }

  const varMapLocation = (varMapPaths.length ? varMapPaths : varMapPathsForEnv).filter(path => !path.includes('node_modules'))[0]; // load the variable file; use default if it's not a json file

  const varMapFile = varMapLocation ? isJSON ? (0, _jestUtil.interopRequireDefault)(require(varMapLocation)) : (0, _jestUtil.interopRequireDefault)(require(varMapLocation)).default : null; // create a flattened structure, eg:
  // { 'foo.bar': 123, 'can[1]': 2 }

  const variables = (0, _flattenAnything.flattenObject)(varMapFile); // interpolate the feature file with the varMapFile

  const tmpSource = variables ? Object.entries(variables).reduce((acc, [key, value]) => acc.replace(new RegExp('\\$' + (0, _escapeStringRegexp.default)(key), 'g'), value.toString()), source + '') : source;

  const tmpPath = _path.default.normalize(_path.default.resolve(_path.default.join(cwd, _path.default.join('node_modules', '.tmp'))));

  const featureSourcePath = tmpSource !== source ? _path.default.normalize(_path.default.resolve(tmpPath, _path.default.basename(featurePath))) : featurePath;

  if (tmpSource !== source) {
    if (!_fs.default.existsSync(tmpPath)) {
      _fs.default.mkdirSync(tmpPath);
    }

    if (_fs.default.existsSync(featureSourcePath)) {
      _fs.default.unlinkSync(featureSourcePath);
    } // write the temp feature file to tmp directory


    _fs.default.writeFileSync(featureSourcePath, tmpSource);

    return featureSourcePath;
  }

  return featurePath;
}

function parseGherkinExampleTables(examples) {
  return (examples || []).reduce((acc, example) => {
    const keys = example.tableHeader.cells.reduce((acc, cell) => [...acc, cell.value], []);
    return [...acc, ...example.tableBody.reduce((acc, row) => [...acc, keys.reduce((acc, key, i) => [...acc, {
      key,
      value: row.cells[i].value
    }], [])], [])];
  }, []);
}

function parseGherkinVariables(example, text) {
  return example.reduce((acc, variable) => {
    return acc.replace(new RegExp(`<${variable.key}>`), variable.value);
  }, text + '');
}

function generateExampleTableSteps(examples, scenario) {
  return examples.reduce((acc, example) => [...acc, { ...scenario,
    name: parseGherkinVariables(example, scenario.name),
    steps: scenario.steps.map(step => ({ ...step,
      ...(step.docString ? {
        docString: { ...step.docString,
          content: parseGherkinVariables(example, step.docString.content)
        }
      } : {}),
      text: parseGherkinVariables(example, step.text)
    }))
  }], []);
}

function isJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch (e) {
    return false;
  }
}

function bindGherkinSteps(steps, definitions) {
  return steps.reduce((acc, step) => {
    var _definition$expressio, _definition$expressio2;

    const definition = definitions.find(def => {
      return def.matchesStepName(step.text);
    });
    const multiSteps = definitions.filter(def => {
      return def.matchesStepName(step.text);
    });

    if (!definition) {
      throw new Error(`\n${_chalk.default.red('Error:')}\nCould not find a step with pattern that matches the text:\n${_chalk.default.yellow(step.text)}\n`);
    }

    if (multiSteps.length > 1) {
      process.stdout.write(`${_chalk.default.yellow('Warning:')}\nmultiple steps found\nstep:${_chalk.default.yellow(step.text)}\npatterns:\n${multiSteps.map(step => `- ${step.pattern.toString()}`).join('\n')}\n`);
    }

    const args = Array.from(((_definition$expressio = definition.expression) === null || _definition$expressio === void 0 ? void 0 : (_definition$expressio2 = _definition$expressio.regexp) === null || _definition$expressio2 === void 0 ? void 0 : _definition$expressio2.exec(step.text)) || []).slice(1);
    const stepArgs = [...args, ...(step.dataTable ? [new _data_table.default(step.dataTable)] : []), ...(step.docString ? [isJson(step.docString.content) ? JSON.parse(step.docString.content) : step.docString.content] : [])];
    const type = (step.keyword || '').trim().toLowerCase();

    if (acc.last !== type && type !== 'and' && type !== 'but') {
      acc.last = type;
    }

    const tableDescription = step.dataTable ? '\n' + createDataTable(stepArgs[stepArgs.length - 1].rawTable) : '';
    const docStringDescription = step.docString ? '\n' + step.docString.content.split('\n').map(row => space + `${row}`).join('\n') : '';
    return { ...acc,
      [acc.last]: [...(acc[acc.last] || []), {
        description: `${step.keyword}${step.text}${tableDescription}${docStringDescription}`,
        ...step,
        code: definition.code,
        stepArgs
      }]
    };
  }, {
    last: 'given',
    given: [],
    when: [],
    then: []
  });
}

function includeTag(tagRaw) {
  const tag = tagRaw.replace('@', '');

  if (tag === 'skip') {
    return false;
  }

  if (tag === 'debug') {
    return true;
  }

  if (env.TAGS.length === 0) {
    return true;
  }

  const hasExcludes = env.EXCLUDE_TAGS.length > 0;
  const hasIncludes = env.INCLUDE_TAGS.length > 0;
  const isIncluded = hasIncludes && env.INCLUDE_TAGS.includes(tag);
  const isExcluded = hasExcludes && env.EXCLUDE_TAGS.includes(tag);
  return isExcluded ? false : !hasIncludes || isIncluded;
}

function parseGherkinSuites(cwd, feature, extensions, cucumberSupportCode) {
  const featurePath = parseFeature(cwd, feature, extensions);

  const source = _fs.default.readFileSync(featurePath, 'utf8');

  const events = (0, _generateMessages.default)(source, _path.default.normalize(_path.default.relative(cwd, featurePath)), {
    includeSource: false,
    includeGherkinDocument: true,
    includePickles: true,
    newId: (0, _IdGenerator.uuid)()
  });
  const document = events[0].gherkinDocument.feature;
  const hasBackground = !!document.children[0].background;
  const specs = hasBackground ? document.children.slice(1) : document.children;
  const hasExcludeTags = env.EXCLUDE_TAGS.length > 0;
  const hasTags = env.TAGS.length > 0;
  const documentTags = document.tags.map(({
    name
  }) => name);
  const documentHasTags = documentTags.length > 0 && documentTags.some(includeTag);
  const shouldSkipFeature = documentTags.includes('@skip');
  const documentContainsSpecsWithTags = specs.some(spec => spec.scenario.tags.length && spec.scenario.tags.some(({
    name
  }) => includeTag(name)));
  const scenarioTags = specs.reduce((acc, spec) => [...acc, ...spec.scenario.tags.map(({
    name
  }) => name)], []);
  const documentHasDebugTag = scenarioTags.includes('@debug');
  const scenarios = specs.reduce((acc, spec) => {
    const tags = spec.scenario.tags.map(({
      name
    }) => name);
    const examples = parseGherkinExampleTables(spec.scenario.examples);
    const shouldSkipForDebug = documentHasDebugTag && !tags.includes('@debug');
    const skip = shouldSkipForDebug || tags.includes('@skip') || hasTags && !!tags.length && !tags.some(includeTag);
    return [...acc, ...(examples.length ? generateExampleTableSteps(examples, spec.scenario).map(spec => ({ ...spec,
      skip
    })) : [{ ...spec.scenario,
      skip,
      steps: spec.scenario.steps
    }])];
  }, []);
  const skipFeature = shouldSkipFeature || hasTags && !documentHasTags && !documentContainsSpecsWithTags && !hasExcludeTags || scenarios.length === 0;
  const suites = scenarios.map(scenario => ({ ...scenario,
    path: featurePath,
    steps: [...(hasBackground ? document.children[0].background.steps : []), ...scenario.steps]
  }));
  return {
    document,
    afterEach: cucumberSupportCode.afterTestCaseHookDefinitions,
    afterAll: cucumberSupportCode.afterTestRunHookDefinitions,
    beforeEach: cucumberSupportCode.beforeTestCaseHookDefinitions,
    beforeAll: cucumberSupportCode.beforeTestRunHookDefinitions,
    skip: skipFeature,
    suites: suites.map(suite => ({ ...suite,
      steps: bindGherkinSteps(suite.steps, cucumberSupportCode.stepDefinitions)
    }))
  };
}

function execTest(cwd, featurePath, moduleFileExtensions, restoreMocks, keepMocks) {
  const act = typeof global['window'] === 'undefined' ? async fn => await fn() : require('react-dom/test-utils').act; // if projectConfig.restoreMocks, get all the __mock__ based mocks and remove them

  if (typeof restoreMocks === 'string' ? restoreMocks === 'true' : restoreMocks) {
    (0, _getMocks.default)(cwd).filter(file => !keepMocks.length || !keepMocks.includes(file)).forEach(file => {
      jest.unmock(file);
    });
  } // parse the feature file with given cucumber steps / hooks
  // generating a jasmine-like structure


  const spec = parseGherkinSuites(cwd, featurePath, moduleFileExtensions, _support_code_library_builder.default.options);

  const fileName = _path.default.basename(featurePath, _path.default.extname(featurePath));

  const hasSomeActiveSuites = spec.suites.some(suite => !suite.skip);
  const shouldSkipSuite = spec.skip || !hasSomeActiveSuites;
  const fn = shouldSkipSuite ? xdescribe || describe.skip : describe;
  fn(`Feature: ${spec.document.name}`, () => {
    let world;
    beforeAll(async () => {
      world = new _support_code_library_builder.default.options.World({});

      for (let i = 0; i < spec.beforeAll.length; i++) {
        await act(async () => {
          await spec.beforeAll[i].code.apply(world, [spec, fileName]);
        });
      }
    });
    afterAll(async () => {
      for (let i = 0; i < spec.afterAll.length; i++) {
        await act(async () => {
          await spec.afterAll[i].code.apply(world, [spec, fileName]);
        });
      }

      world = null;
    });
    spec.suites.forEach(suite => {
      const fn = suite.skip ? xdescribe || describe.skip : describe;
      fn(`${suite.keyword}: ${suite.name}`, () => {
        beforeAll(async () => {
          for (let i = 0; i < spec.beforeEach.length; i++) {
            await act(async () => {
              await spec.beforeEach[i].code.apply(world, [{
                spec,
                suite: suite
              }, fileName]);
            });
          }
        });
        afterAll(async () => {
          for (let i = 0; i < spec.afterEach.length; i++) {
            await act(async () => {
              await spec.afterEach[i].code.apply(world, [{
                spec,
                suite: suite
              }, fileName]);
            });
          }
        });

        for (let i = 0; i < suite.steps.given.length; i++) {
          it(suite.steps.given[i].keyword + suite.steps.given[i].text, async () => {
            await suite.steps.given[i].code.apply(world, suite.steps.given[i].stepArgs);
          });
        }

        for (let i = 0; i < suite.steps.when.length; i++) {
          it(suite.steps.when[i].description, async () => {
            await suite.steps.when[i].code.apply(world, suite.steps.when[i].stepArgs);
          });
        }

        for (let i = 0; i < suite.steps.then.length; i++) {
          it(suite.steps.then[i].description, async () => {
            await suite.steps.then[i].code.apply(world, suite.steps.then[i].stepArgs);
          });
        }
      });
    });
  });
}

module.exports = exports.default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9wYXJzZUZlYXR1cmUudHMiXSwibmFtZXMiOlsic3VwcG9ydENvZGVMaWJyYXJ5QnVpbGRlciIsImZpbmFsaXplIiwic3BhY2UiLCJjcmVhdGVEYXRhVGFibGUiLCJyb3dzIiwidGFibGUiLCJBc2NpaVRhYmxlIiwic2V0SGVhZGluZyIsImkiLCJsZW5ndGgiLCJhZGRSb3ciLCJ0b1N0cmluZyIsInNwbGl0IiwibWFwIiwicm93Iiwiam9pbiIsInBhcnNlRmVhdHVyZSIsImN3ZCIsImZlYXR1cmVQYXRoIiwiZXh0ZW5zaW9ucyIsInNvdXJjZSIsImZzIiwicmVhZEZpbGVTeW5jIiwidmFyTWFwRXh0cyIsImZpbHRlciIsImV4dCIsImZpbGVFeHRlbnNpb24iLCJwYXRoIiwiZXh0bmFtZSIsImlzSlNPTiIsInZhck1hcFBhdGhzRm9yRW52IiwiSlNPTiIsInBhcnNlIiwibm9ybWFsaXplIiwicmVzb2x2ZSIsIl9fZGlybmFtZSIsImJhc2VuYW1lIiwiZW52IiwiRU5WX05BTUUiLCJzdHJpbmdpZnkiLCJlbmNvZGluZyIsInN0ZG91dCIsInZhck1hcFBhdGhzIiwidmFyTWFwTG9jYXRpb24iLCJpbmNsdWRlcyIsInZhck1hcEZpbGUiLCJyZXF1aXJlIiwiZGVmYXVsdCIsInZhcmlhYmxlcyIsInRtcFNvdXJjZSIsIk9iamVjdCIsImVudHJpZXMiLCJyZWR1Y2UiLCJhY2MiLCJrZXkiLCJ2YWx1ZSIsInJlcGxhY2UiLCJSZWdFeHAiLCJ0bXBQYXRoIiwiZmVhdHVyZVNvdXJjZVBhdGgiLCJleGlzdHNTeW5jIiwibWtkaXJTeW5jIiwidW5saW5rU3luYyIsIndyaXRlRmlsZVN5bmMiLCJwYXJzZUdoZXJraW5FeGFtcGxlVGFibGVzIiwiZXhhbXBsZXMiLCJleGFtcGxlIiwia2V5cyIsInRhYmxlSGVhZGVyIiwiY2VsbHMiLCJjZWxsIiwidGFibGVCb2R5IiwicGFyc2VHaGVya2luVmFyaWFibGVzIiwidGV4dCIsInZhcmlhYmxlIiwiZ2VuZXJhdGVFeGFtcGxlVGFibGVTdGVwcyIsInNjZW5hcmlvIiwibmFtZSIsInN0ZXBzIiwic3RlcCIsImRvY1N0cmluZyIsImNvbnRlbnQiLCJpc0pzb24iLCJlIiwiYmluZEdoZXJraW5TdGVwcyIsImRlZmluaXRpb25zIiwiZGVmaW5pdGlvbiIsImZpbmQiLCJkZWYiLCJtYXRjaGVzU3RlcE5hbWUiLCJtdWx0aVN0ZXBzIiwiRXJyb3IiLCJjaGFsayIsInJlZCIsInllbGxvdyIsInByb2Nlc3MiLCJ3cml0ZSIsInBhdHRlcm4iLCJhcmdzIiwiQXJyYXkiLCJmcm9tIiwiZXhwcmVzc2lvbiIsInJlZ2V4cCIsImV4ZWMiLCJzbGljZSIsInN0ZXBBcmdzIiwiZGF0YVRhYmxlIiwiRGF0YVRhYmxlIiwidHlwZSIsImtleXdvcmQiLCJ0cmltIiwidG9Mb3dlckNhc2UiLCJsYXN0IiwidGFibGVEZXNjcmlwdGlvbiIsInJhd1RhYmxlIiwiZG9jU3RyaW5nRGVzY3JpcHRpb24iLCJkZXNjcmlwdGlvbiIsImNvZGUiLCJnaXZlbiIsIndoZW4iLCJ0aGVuIiwiaW5jbHVkZVRhZyIsInRhZ1JhdyIsInRhZyIsIlRBR1MiLCJoYXNFeGNsdWRlcyIsIkVYQ0xVREVfVEFHUyIsImhhc0luY2x1ZGVzIiwiSU5DTFVERV9UQUdTIiwiaXNJbmNsdWRlZCIsImlzRXhjbHVkZWQiLCJwYXJzZUdoZXJraW5TdWl0ZXMiLCJmZWF0dXJlIiwiY3VjdW1iZXJTdXBwb3J0Q29kZSIsImV2ZW50cyIsInJlbGF0aXZlIiwiaW5jbHVkZVNvdXJjZSIsImluY2x1ZGVHaGVya2luRG9jdW1lbnQiLCJpbmNsdWRlUGlja2xlcyIsIm5ld0lkIiwiZG9jdW1lbnQiLCJnaGVya2luRG9jdW1lbnQiLCJoYXNCYWNrZ3JvdW5kIiwiY2hpbGRyZW4iLCJiYWNrZ3JvdW5kIiwic3BlY3MiLCJoYXNFeGNsdWRlVGFncyIsImhhc1RhZ3MiLCJkb2N1bWVudFRhZ3MiLCJ0YWdzIiwiZG9jdW1lbnRIYXNUYWdzIiwic29tZSIsInNob3VsZFNraXBGZWF0dXJlIiwiZG9jdW1lbnRDb250YWluc1NwZWNzV2l0aFRhZ3MiLCJzcGVjIiwic2NlbmFyaW9UYWdzIiwiZG9jdW1lbnRIYXNEZWJ1Z1RhZyIsInNjZW5hcmlvcyIsInNob3VsZFNraXBGb3JEZWJ1ZyIsInNraXAiLCJza2lwRmVhdHVyZSIsInN1aXRlcyIsImFmdGVyRWFjaCIsImFmdGVyVGVzdENhc2VIb29rRGVmaW5pdGlvbnMiLCJhZnRlckFsbCIsImFmdGVyVGVzdFJ1bkhvb2tEZWZpbml0aW9ucyIsImJlZm9yZUVhY2giLCJiZWZvcmVUZXN0Q2FzZUhvb2tEZWZpbml0aW9ucyIsImJlZm9yZUFsbCIsImJlZm9yZVRlc3RSdW5Ib29rRGVmaW5pdGlvbnMiLCJzdWl0ZSIsInN0ZXBEZWZpbml0aW9ucyIsImV4ZWNUZXN0IiwibW9kdWxlRmlsZUV4dGVuc2lvbnMiLCJyZXN0b3JlTW9ja3MiLCJrZWVwTW9ja3MiLCJhY3QiLCJnbG9iYWwiLCJmbiIsImZpbGUiLCJmb3JFYWNoIiwiamVzdCIsInVubW9jayIsIm9wdGlvbnMiLCJmaWxlTmFtZSIsImhhc1NvbWVBY3RpdmVTdWl0ZXMiLCJzaG91bGRTa2lwU3VpdGUiLCJ4ZGVzY3JpYmUiLCJkZXNjcmliZSIsIndvcmxkIiwiV29ybGQiLCJhcHBseSIsIml0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7Ozs7O0FBRUFBLHNDQUEwQkMsUUFBMUI7O0FBRUEsTUFBTUMsS0FBSyxHQUFHLFFBQWQ7O0FBRUEsU0FBU0MsZUFBVCxDQUF5QkMsSUFBekIsRUFBK0I7QUFDM0IsUUFBTUMsS0FBSyxHQUFHLElBQUlDLG1CQUFKLEVBQWQ7QUFFQUQsRUFBQUEsS0FBSyxDQUFDRSxVQUFOLENBQWlCLEdBQUdILElBQUksQ0FBQyxDQUFELENBQXhCOztBQUVBLE9BQUssSUFBSUksQ0FBQyxHQUFHLENBQWIsRUFB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LE1BQXJDLEVBQTZDRCxDQUFDLEVBQTlDLEVBQWtEO0FBQzlDd0wsVUFBQUEsRUFBRSxDQUFDdEIsS0FBSyxDQUFDNUYsS0FBTixDQUFZMEMsSUFBWixDQUFpQmhILENBQWpCLEVBQW9CNEcsV0FBckIsRUFBa0MsWUFBWTtBQUM1QyxrQkFBTXNELEtBQUssQ0FBQzVGLEtBQU4sQ0FBWTBDLElBQVosQ0FBaUJoSCxDQUFqQixFQUFvQjZHLElBQXBCLENBQXlCMEUsS0FBekIsQ0FBK0JGLEtBQS9CLEVBQXNDbkIsS0FBSyxDQUFDNUYsS0FBTixDQUFZMEMsSUFBWixDQUFpQmhILENBQWpCLEVBQW9CaUcsUUFBMUQsQ0FBTjtBQUNILFdBRkMsQ0FBRjtBQUdIO0FBQ0osT0FuQ0MsQ0FBRjtBQW9DSCxLQXhDRDtBQXlDSCxHQW5FQyxDQUFGO0FBb0VIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEFzY2lpVGFibGUgZnJvbSAnYXNjaWktdGFibGUnO1xuaW1wb3J0IGNoYWxrIGZyb20gJ2NoYWxrJztcbmltcG9ydCBnZW5lcmF0ZU1lc3NhZ2VzIGZyb20gJ0BjdWN1bWJlci9naGVya2luL2Rpc3Qvc3JjL3N0cmVhbS9nZW5lcmF0ZU1lc3NhZ2VzJztcbmltcG9ydCB7IHV1aWQgfSBmcm9tICdAY3VjdW1iZXIvbWVzc2FnZXMvZGlzdC9zcmMvSWRHZW5lcmF0b3InO1xuaW1wb3J0IHsgc3Bhd25TeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgRGF0YVRhYmxlIGZyb20gJ2N1Y3VtYmVyL2xpYi9tb2RlbHMvZGF0YV90YWJsZSc7XG5pbXBvcnQgeyBkZWZhdWx0IGFzIHN1cHBvcnRDb2RlTGlicmFyeUJ1aWxkZXIgfSBmcm9tICdjdWN1bWJlci9saWIvc3VwcG9ydF9jb2RlX2xpYnJhcnlfYnVpbGRlcic7XG5pbXBvcnQgZXNjYXBlU3RyaW5nUmVnZXhwIGZyb20gJ2VzY2FwZS1zdHJpbmctcmVnZXhwJztcbmltcG9ydCB7IGZsYXR0ZW5PYmplY3QgfSBmcm9tICdmbGF0dGVuLWFueXRoaW5nJztcbmltcG9ydCB7IGludGVyb3BSZXF1aXJlRGVmYXVsdCB9IGZyb20gJ2plc3QtdXRpbCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmltcG9ydCAqIGFzIGVudiBmcm9tICcuLi9lbnYnO1xuaW1wb3J0IGdldE1vY2tzIGZyb20gJy4vZ2V0TW9ja3MnO1xuXG5zdXBwb3J0Q29kZUxpYnJhcnlCdWlsZGVyLmZpbmFsaXplKCk7XG5cbmNvbnN0IHNwYWNlID0gJyAgICAgICc7XG5cbmZ1bmN0aW9uIGNyZWF0ZURhdGFUYWJsZShyb3dzKSB7XG4gICAgY29uc3QgdGFibGUgPSBuZXcgQXNjaWlUYWJsZSgpO1xuXG4gICAgdGFibGUuc2V0SGVhZGluZyguLi5yb3dzWzBdKTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcm93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0YWJsZS5hZGRSb3coLi4ucm93c1tpXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYmxlLnRvU3RyaW5nKCkuc3BsaXQoJ1xcbicpLm1hcCgocm93KSA9PiAoXG4gICAgICAgIHNwYWNlICsgcm93XG4gICAgKSkuam9pbignXFxuJyk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlRmVhdHVyZShjd2Q6IHN0cmluZywgZmVhdHVyZVBhdGg6IHN0cmluZywgZXh0ZW5zaW9uczogc3RyaW5nW10pIHtcblxuICAgIGNvbnN0IHNvdXJjZSA9IGZzLnJlYWRGaWxlU3luYyhmZWF0dXJlUGF0aCwgJ3V0ZjgnKTtcblxuICAgIGNvbnN0IHZhck1hcEV4dHMgPSBleHRlbnNpb25zLmZpbHRlcigoZXh0KSA9PiBleHQgIT09ICdmZWF0dXJlJyk7XG5cbiAgICBjb25zdCBmaWxlRXh0ZW5zaW9uID0gcGF0aC5leHRuYW1lKGZlYXR1cmVQYXRoKTtcbiAgICBjb25zdCBpc0pTT04gPSBmaWxlRXh0ZW5zaW9uID09PSAnanNvbic7XG5cbiAgICBjb25zdCB2YXJNYXBQYXRoc0ZvckVudiA9IEpTT04ucGFyc2UoXG4gICAgICAgIHNwYXduU3luYyhcbiAgICAgICAgICAgICdub2RlJyxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBwYXRoLm5vcm1hbGl6ZShwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9nZXRQYXRocy5qcycpKSxcbiAgICAgICAgICAgICAgICBjd2QsXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKCcqKicsIGAke3BhdGguYmFzZW5hbWUoZmVhdHVyZVBhdGgsIGZpbGVFeHRlbnNpb24pfS4ke2Vudi5FTlZfTkFNRX0udmFyc2ApLFxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHZhck1hcEV4dHMpXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVuY29kaW5nOiAndXRmLTgnXG4gICAgICAgICAgICB9XG4gICAgICAgICkuc3Rkb3V0XG4gICAgKTtcbiAgICAvLyBzY2FuIHJlbGF0aXZlIGRpcmVjdG9yaWVzIHRvIGZpbmQgYW55IGZpbGUgdGhhdCBtYXRjaGVzIHRoZSBmZWF0dXJlIGZpbGUgbmFtZSxcbiAgICAvLyBidXQgYXMgYW5vdGhlciBleHRlbnNpb25cbiAgICBjb25zdCB2YXJNYXBQYXRocyA9IEpTT04ucGFyc2UoXG4gICAgICAgIHNwYXduU3luYyhcbiAgICAgICAgICAgICdub2RlJyxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICBwYXRoLm5vcm1hbGl6ZShwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9nZXRQYXRocy5qcycpKSxcbiAgICAgICAgICAgICAgICBjd2QsXG4gICAgICAgICAgICAgICAgcGF0aC5qb2luKCcqKicsIGAke3BhdGguYmFzZW5hbWUoZmVhdHVyZVBhdGgsIGZpbGVFeHRlbnNpb24pfS52YXJzYCksXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodmFyTWFwRXh0cylcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZW5jb2Rpbmc6ICd1dGYtOCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgKS5zdGRvdXRcbiAgICApO1xuXG4gICAgaWYgKCF2YXJNYXBQYXRocy5sZW5ndGggJiYgIXZhck1hcFBhdGhzRm9yRW52Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmVhdHVyZVBhdGg7XG4gICAgfVxuXG4gICAgY29uc3QgdmFyTWFwTG9jYXRpb24gPSAoXG4gICAgICAgIHZhck1hcFBhdGhzLmxlbmd0aCA/XG4gICAgICAgICAgICB2YXJNYXBQYXRocyA6XG4gICAgICAgICAgICB2YXJNYXBQYXRoc0ZvckVudlxuICAgICkuZmlsdGVyKChwYXRoKSA9PiAhcGF0aC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpWzBdO1xuXG4gICAgLy8gbG9hZCB0aGUgdmFyaWFibGUgZmlsZTsgdXNlIGRlZmF1bHQgaWYgaXQncyBub3QgYSBqc29uIGZpbGVcbiAgICBjb25zdCB2YXJNYXBGaWxlID0gdmFyTWFwTG9jYXRpb24gP1xuICAgICAgICAoaXNKU09OID9cbiAgICAgICAgICAgICAgICBpbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZSh2YXJNYXBMb2NhdGlvbikpIDpcbiAgICAgICAgICAgICAgICBpbnRlcm9wUmVxdWlyZURlZmF1bHQocmVxdWlyZSh2YXJNYXBMb2NhdGlvbikpLmRlZmF1bHRcbiAgICAgICAgKSBhcyB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBib29sZWFuIHwgRGF0ZSB8IG51bWJlciB9IDpcbiAgICAgICAgbnVsbDtcblxuICAgIC8vIGNyZWF0ZSBhIGZsYXR0ZW5lZCBzdHJ1Y3R1cmUsIGVnOlxuICAgIC8vIHsgJ2Zvby5iYXInOiAxMjMsICdjYW5bMV0nOiAyIH1cbiAgICBjb25zdCB2YXJpYWJsZXMgPSBmbGF0dGVuT2JqZWN0KHZhck1hcEZpbGUpO1xuXG4gICAgLy8gaW50ZXJwb2xhdGUgdGhlIGZlYXR1cmUgZmlsZSB3aXRoIHRoZSB2YXJNYXBGaWxlXG4gICAgY29uc3QgdG1wU291cmNlID0gdmFyaWFibGVzID9cbiAgICAgICAgT2JqZWN0LmVudHJpZXModmFyaWFibGVzKS5yZWR1Y2UoKGFjYywgW2tleSwgdmFsdWVdKSA9PiAoXG4gICAgICAgICAgICBhY2MucmVwbGFjZShuZXcgUmVnRXhwKCdcXFxcJCcgKyBlc2NhcGVTdHJpbmdSZWdleHAoa2V5KSwgJ2cnKSwgdmFsdWUudG9TdHJpbmcoKSlcbiAgICAgICAgKSwgc291cmNlICsgJycpIDpcbiAgICAgICAgc291cmNlO1xuXG4gICAgY29uc3QgdG1wUGF0aCA9IHBhdGgubm9ybWFsaXplKHBhdGgucmVzb2x2ZShwYXRoLmpvaW4oY3dkLCBwYXRoLmpvaW4oJ25vZGVfbW9kdWxlcycsICcudG1wJykpKSk7XG5cbiAgICBjb25zdCBmZWF0dXJlU291cmNlUGF0aCA9IHRtcFNvdXJjZSAhPT0gc291cmNlID9cbiAgICAgICAgcGF0aC5ub3JtYWxpemUocGF0aC5yZXNvbHZlKHRtcFBhdGgsIHBhdGguYmFzZW5hbWUoZmVhdHVyZVBhdGgpKSkgOlxuICAgICAgICBmZWF0dXJlUGF0aDtcblxuICAgIGlmICh0bXBTb3VyY2UgIT09IHNvdXJjZSkge1xuXG4gICAgICAgIGlmICghZnMuZXhpc3RzU3luYyh0bXBQYXRoKSkge1xuICAgICAgICAgICAgZnMubWtkaXJTeW5jKHRtcFBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoZmVhdHVyZVNvdXJjZVBhdGgpKSB7XG4gICAgICAgICAgICBmcy51bmxpbmtTeW5jKGZlYXR1cmVTb3VyY2VQYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdyaXRlIHRoZSB0ZW1wIGZlYXR1cmUgZmlsZSB0byB0bXAgZGlyZWN0b3J5XG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMoZmVhdHVyZVNvdXJjZVBhdGgsIHRtcFNvdXJjZSk7XG5cbiAgICAgICAgcmV0dXJuIGZlYXR1cmVTb3VyY2VQYXRoO1xuICAgIH1cblxuICAgIHJldHVybiBmZWF0dXJlUGF0aDtcbn1cblxuZnVuY3Rpb24gcGFyc2VHaGVya2luRXhhbXBsZVRhYmxlcyhleGFtcGxlcykge1xuICAgIHJldHVybiAoZXhhbXBsZXMgfHwgW10pXG4gICAgICAgIC5yZWR1Y2UoKGFjYywgZXhhbXBsZSkgPT4ge1xuXG4gICAgICAgICAgICBjb25zdCBrZXlzID0gZXhhbXBsZS50YWJsZUhlYWRlci5jZWxsc1xuICAgICAgICAgICAgICAgIC5yZWR1Y2UoKGFjYywgY2VsbCkgPT4gKFsuLi5hY2MsIGNlbGwudmFsdWVdKSwgW10pO1xuXG4gICAgICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgICAgIC4uLmFjYyxcbiAgICAgICAgICAgICAgICAuLi5leGFtcGxlLnRhYmxlQm9keVxuICAgICAgICAgICAgICAgICAgICAucmVkdWNlKChhY2MsIHJvdykgPT4gKFtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmFjYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXMucmVkdWNlKChhY2MsIGtleSwgaSkgPT4gKFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5hY2MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiByb3cuY2VsbHNbaV0udmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBdKSwgW10pXG4gICAgICAgICAgICAgICAgICAgIF0pLCBbXSlcbiAgICAgICAgICAgIF07XG4gICAgICAgIH0sIFtdKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VHaGVya2luVmFyaWFibGVzKGV4YW1wbGUsIHRleHQpIHtcbiAgICByZXR1cm4gZXhhbXBsZS5yZWR1Y2UoKGFjYywgdmFyaWFibGUpID0+IHtcbiAgICAgICAgcmV0dXJuIGFjYy5yZXBsYWNlKG5ldyBSZWdFeHAoYDwke3ZhcmlhYmxlLmtleX0+YCksIHZhcmlhYmxlLnZhbHVlKTtcbiAgICB9LCB0ZXh0ICsgJycpO1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUV4YW1wbGVUYWJsZVN0ZXBzKGV4YW1wbGVzLCBzY2VuYXJpbykge1xuICAgIHJldHVybiBleGFtcGxlcy5yZWR1Y2UoKGFjYywgZXhhbXBsZSkgPT4gKFtcbiAgICAgICAgLi4uYWNjLFxuICAgICAgICB7XG4gICAgICAgICAgICAuLi5zY2VuYXJpbyxcbiAgICAgICAgICAgIG5hbWU6IHBhcnNlR2hlcmtpblZhcmlhYmxlcyhleGFtcGxlLCBzY2VuYXJpby5uYW1lKSxcbiAgICAgICAgICAgIHN0ZXBzOiBzY2VuYXJpby5zdGVwcy5tYXAoKHN0ZXApID0+ICh7XG4gICAgICAgICAgICAgICAgLi4uc3RlcCxcbiAgICAgICAgICAgICAgICAuLi5zdGVwLmRvY1N0cmluZyA/IHtcbiAgICAgICAgICAgICAgICAgICAgZG9jU3RyaW5nOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAuLi5zdGVwLmRvY1N0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHBhcnNlR2hlcmtpblZhcmlhYmxlcyhleGFtcGxlLCBzdGVwLmRvY1N0cmluZy5jb250ZW50KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSA6IHt9LFxuICAgICAgICAgICAgICAgIHRleHQ6IHBhcnNlR2hlcmtpblZhcmlhYmxlcyhleGFtcGxlLCBzdGVwLnRleHQpXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgfVxuICAgIF0pLCBbXSk7XG59XG5cbmZ1bmN0aW9uIGlzSnNvbih0ZXh0KTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgICAgSlNPTi5wYXJzZSh0ZXh0KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBiaW5kR2hlcmtpblN0ZXBzKHN0ZXBzLCBkZWZpbml0aW9ucykge1xuXG4gICAgcmV0dXJuIHN0ZXBzLnJlZHVjZSgoYWNjLCBzdGVwKSA9PiB7XG5cbiAgICAgICAgY29uc3QgZGVmaW5pdGlvbiA9IGRlZmluaXRpb25zLmZpbmQoKGRlZikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGRlZi5tYXRjaGVzU3RlcE5hbWUoc3RlcC50ZXh0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbXVsdGlTdGVwcyA9IGRlZmluaXRpb25zLmZpbHRlcigoZGVmKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZGVmLm1hdGNoZXNTdGVwTmFtZShzdGVwLnRleHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWRlZmluaXRpb24pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgXFxuJHtjaGFsay5yZWQoJ0Vycm9yOicpfVxcbkNvdWxkIG5vdCBmaW5kIGEgc3RlcCB3aXRoIHBhdHRlcm4gdGhhdCBtYXRjaGVzIHRoZSB0ZXh0OlxcbiR7Y2hhbGsueWVsbG93KHN0ZXAudGV4dCl9XFxuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobXVsdGlTdGVwcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgJHtjaGFsay55ZWxsb3coJ1dhcm5pbmc6Jyl9XFxubXVsdGlwbGUgc3RlcHMgZm91bmRcXG5zdGVwOiR7Y2hhbGsueWVsbG93KHN0ZXAudGV4dCl9XFxucGF0dGVybnM6XFxuJHttdWx0aVN0ZXBzLm1hcCgoc3RlcCkgPT4gKFxuICAgICAgICAgICAgICAgIGAtICR7c3RlcC5wYXR0ZXJuLnRvU3RyaW5nKCl9YFxuICAgICAgICAgICAgKSkuam9pbignXFxuJyl9XFxuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhcmdzID0gQXJyYXkuZnJvbShkZWZpbml0aW9uLmV4cHJlc3Npb24/LnJlZ2V4cD8uZXhlYyhzdGVwLnRleHQpIHx8IFtdKS5zbGljZSgxKVxuXG4gICAgICAgIGNvbnN0IHN0ZXBBcmdzID0gW1xuICAgICAgICAgICAgLi4uYXJncyxcbiAgICAgICAgICAgIC4uLnN0ZXAuZGF0YVRhYmxlID9cbiAgICAgICAgICAgICAgICBbbmV3IERhdGFUYWJsZShzdGVwLmRhdGFUYWJsZSldIDpcbiAgICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgIC4uLnN0ZXAuZG9jU3RyaW5nID9cbiAgICAgICAgICAgICAgICBbaXNKc29uKHN0ZXAuZG9jU3RyaW5nLmNvbnRlbnQpID8gSlNPTi5wYXJzZShzdGVwLmRvY1N0cmluZy5jb250ZW50KSA6IHN0ZXAuZG9jU3RyaW5nLmNvbnRlbnRdIDpcbiAgICAgICAgICAgICAgICBbXVxuICAgICAgICBdO1xuXG4gICAgICAgIGNvbnN0IHR5cGUgPSAoc3RlcC5rZXl3b3JkIHx8ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBpZiAoYWNjLmxhc3QgIT09IHR5cGUgJiYgdHlwZSAhPT0gJ2FuZCcgJiYgdHlwZSAhPT0gJ2J1dCcpIHtcbiAgICAgICAgICAgIGFjYy5sYXN0ID0gdHlwZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRhYmxlRGVzY3JpcHRpb24gPSBzdGVwLmRhdGFUYWJsZSA/XG4gICAgICAgICAgICAnXFxuJyArIGNyZWF0ZURhdGFUYWJsZShzdGVwQXJnc1tzdGVwQXJncy5sZW5ndGggLSAxXS5yYXdUYWJsZSlcbiAgICAgICAgICAgIDogJyc7XG5cbiAgICAgICAgY29uc3QgZG9jU3RyaW5nRGVzY3JpcHRpb24gPSBzdGVwLmRvY1N0cmluZyA/XG4gICAgICAgICAgICAnXFxuJyArIHN0ZXAuZG9jU3RyaW5nLmNvbnRlbnQuc3BsaXQoJ1xcbicpLm1hcCgocm93KSA9PiAoXG4gICAgICAgICAgICAgICAgc3BhY2UgKyBgJHtyb3d9YFxuICAgICAgICAgICAgKSkuam9pbignXFxuJykgOiAnJztcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uYWNjLFxuICAgICAgICAgICAgW2FjYy5sYXN0XTogW1xuICAgICAgICAgICAgICAgIC4uLmFjY1thY2MubGFzdF0gfHwgW10sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7c3RlcC5rZXl3b3JkfSR7c3RlcC50ZXh0fSR7dGFibGVEZXNjcmlwdGlvbn0ke2RvY1N0cmluZ0Rlc2NyaXB0aW9ufWAsXG4gICAgICAgICAgICAgICAgICAgIC4uLnN0ZXAsXG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IGRlZmluaXRpb24uY29kZSxcbiAgICAgICAgICAgICAgICAgICAgc3RlcEFyZ3NcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfSwge1xuICAgICAgICBsYXN0OiAnZ2l2ZW4nLFxuICAgICAgICBnaXZlbjogW10sXG4gICAgICAgIHdoZW46IFtdLFxuICAgICAgICB0aGVuOiBbXVxuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbmNsdWRlVGFnKHRhZ1Jhdykge1xuXG4gICAgY29uc3QgdGFnID0gdGFnUmF3LnJlcGxhY2UoJ0AnLCAnJyk7XG5cbiAgICBpZiAodGFnID09PSAnc2tpcCcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICh0YWcgPT09ICdkZWJ1ZycpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGVudi5UQUdTLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBjb25zdCBoYXNFeGNsdWRlcyA9IGVudi5FWENMVURFX1RBR1MubGVuZ3RoID4gMDtcbiAgICBjb25zdCBoYXNJbmNsdWRlcyA9IGVudi5JTkNMVURFX1RBR1MubGVuZ3RoID4gMDtcblxuICAgIGNvbnN0IGlzSW5jbHVkZWQgPSBoYXNJbmNsdWRlcyAmJiBlbnYuSU5DTFVERV9UQUdTLmluY2x1ZGVzKHRhZyk7XG4gICAgY29uc3QgaXNFeGNsdWRlZCA9IGhhc0V4Y2x1ZGVzICYmIGVudi5FWENMVURFX1RBR1MuaW5jbHVkZXModGFnKTtcblxuICAgIHJldHVybiBpc0V4Y2x1ZGVkID8gZmFsc2UgOiAhaGFzSW5jbHVkZXMgfHwgaXNJbmNsdWRlZDtcbn1cblxuZnVuY3Rpb24gcGFyc2VHaGVya2luU3VpdGVzKGN3ZCwgZmVhdHVyZTogc3RyaW5nLCBleHRlbnNpb25zOiBzdHJpbmdbXSwgY3VjdW1iZXJTdXBwb3J0Q29kZTogYW55KSB7XG5cbiAgICBjb25zdCBmZWF0dXJlUGF0aCA9IHBhcnNlRmVhdHVyZShjd2QsIGZlYXR1cmUsIGV4dGVuc2lvbnMpO1xuXG4gICAgY29uc3Qgc291cmNlID0gZnMucmVhZEZpbGVTeW5jKGZlYXR1cmVQYXRoLCAndXRmOCcpO1xuXG4gICAgY29uc3QgZXZlbnRzID0gZ2VuZXJhdGVNZXNzYWdlcyhzb3VyY2UsIHBhdGgubm9ybWFsaXplKHBhdGgucmVsYXRpdmUoY3dkLCBmZWF0dXJlUGF0aCkpLCB7XG4gICAgICAgIGluY2x1ZGVTb3VyY2U6IGZhbHNlLFxuICAgICAgICBpbmNsdWRlR2hlcmtpbkRvY3VtZW50OiB0cnVlLFxuICAgICAgICBpbmNsdWRlUGlja2xlczogdHJ1ZSxcbiAgICAgICAgbmV3SWQ6IHV1aWQoKVxuICAgIH0pO1xuXG4gICAgY29uc3QgZG9jdW1lbnQgPSBldmVudHNbMF0uZ2hlcmtpbkRvY3VtZW50LmZlYXR1cmU7XG4gICAgY29uc3QgaGFzQmFja2dyb3VuZCA9ICEhZG9jdW1lbnQuY2hpbGRyZW5bMF0uYmFja2dyb3VuZDtcbiAgICBjb25zdCBzcGVjcyA9IGhhc0JhY2tncm91bmQgPyBkb2N1bWVudC5jaGlsZHJlbi5zbGljZSgxKSA6IGRvY3VtZW50LmNoaWxkcmVuO1xuXG4gICAgY29uc3QgaGFzRXhjbHVkZVRhZ3MgPSBlbnYuRVhDTFVERV9UQUdTLmxlbmd0aCA+IDA7XG4gICAgY29uc3QgaGFzVGFncyA9IGVudi5UQUdTLmxlbmd0aCA+IDA7XG5cbiAgICBjb25zdCBkb2N1bWVudFRhZ3MgPSBkb2N1bWVudC50YWdzLm1hcCgoe25hbWV9KSA9PiBuYW1lKTtcbiAgICBjb25zdCBkb2N1bWVudEhhc1RhZ3MgPSBkb2N1bWVudFRhZ3MubGVuZ3RoID4gMCAmJiBkb2N1bWVudFRhZ3Muc29tZShpbmNsdWRlVGFnKTtcbiAgICBjb25zdCBzaG91bGRTa2lwRmVhdHVyZSA9IGRvY3VtZW50VGFncy5pbmNsdWRlcygnQHNraXAnKTtcblxuICAgIGNvbnN0IGRvY3VtZW50Q29udGFpbnNTcGVjc1dpdGhUYWdzID0gc3BlY3Muc29tZSgoc3BlYykgPT4gKFxuICAgICAgICBzcGVjLnNjZW5hcmlvLnRhZ3MubGVuZ3RoICYmXG4gICAgICAgIHNwZWMuc2NlbmFyaW8udGFncy5zb21lKCh7bmFtZX0pID0+IGluY2x1ZGVUYWcobmFtZSkpXG4gICAgKSk7XG5cbiAgICBjb25zdCBzY2VuYXJpb1RhZ3MgPSBzcGVjcy5yZWR1Y2UoKGFjYywgc3BlYykgPT4gKFtcbiAgICAgICAgLi4uYWNjLFxuICAgICAgICAuLi5zcGVjLnNjZW5hcmlvLnRhZ3MubWFwKCh7bmFtZX0pID0+IG5hbWUpXG4gICAgXSksIFtdKTtcblxuICAgIGNvbnN0IGRvY3VtZW50SGFzRGVidWdUYWcgPSBzY2VuYXJpb1RhZ3MuaW5jbHVkZXMoJ0BkZWJ1ZycpO1xuXG4gICAgY29uc3Qgc2NlbmFyaW9zID0gc3BlY3MucmVkdWNlKChhY2MsIHNwZWMpID0+IHtcblxuICAgICAgICBjb25zdCB0YWdzID0gc3BlYy5zY2VuYXJpby50YWdzLm1hcCgoe25hbWV9KSA9PiBuYW1lKTtcblxuICAgICAgICBjb25zdCBleGFtcGxlcyA9IHBhcnNlR2hlcmtpbkV4YW1wbGVUYWJsZXMoc3BlYy5zY2VuYXJpby5leGFtcGxlcyk7XG5cbiAgICAgICAgY29uc3Qgc2hvdWxkU2tpcEZvckRlYnVnID0gKGRvY3VtZW50SGFzRGVidWdUYWcgJiYgIXRhZ3MuaW5jbHVkZXMoJ0BkZWJ1ZycpKTtcblxuICAgICAgICBjb25zdCBza2lwID0gc2hvdWxkU2tpcEZvckRlYnVnIHx8IHRhZ3MuaW5jbHVkZXMoJ0Bza2lwJykgfHxcbiAgICAgICAgICAgIChoYXNUYWdzICYmICEhdGFncy5sZW5ndGggJiYgIXRhZ3Muc29tZShpbmNsdWRlVGFnKSk7XG5cbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIC4uLmFjYyxcbiAgICAgICAgICAgIC4uLmV4YW1wbGVzLmxlbmd0aCA/XG4gICAgICAgICAgICAgICAgZ2VuZXJhdGVFeGFtcGxlVGFibGVTdGVwcyhleGFtcGxlcywgc3BlYy5zY2VuYXJpbykubWFwKChzcGVjKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAuLi5zcGVjLFxuICAgICAgICAgICAgICAgICAgICBza2lwXG4gICAgICAgICAgICAgICAgfSkpIDpcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLnNwZWMuc2NlbmFyaW8sXG4gICAgICAgICAgICAgICAgICAgICAgICBza2lwLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcHM6IHNwZWMuc2NlbmFyaW8uc3RlcHNcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgXTtcbiAgICB9LCBbXSk7XG5cbiAgICBjb25zdCBza2lwRmVhdHVyZSA9IHNob3VsZFNraXBGZWF0dXJlIHx8IChoYXNUYWdzICYmICFkb2N1bWVudEhhc1RhZ3MgJiYgIWRvY3VtZW50Q29udGFpbnNTcGVjc1dpdGhUYWdzICYmICFoYXNFeGNsdWRlVGFncykgfHxcbiAgICAgICAgc2NlbmFyaW9zLmxlbmd0aCA9PT0gMDtcblxuICAgIGNvbnN0IHN1aXRlcyA9IHNjZW5hcmlvcy5tYXAoKHNjZW5hcmlvKSA9PiAoe1xuICAgICAgICAuLi5zY2VuYXJpbyxcbiAgICAgICAgcGF0aDogZmVhdHVyZVBhdGgsXG4gICAgICAgIHN0ZXBzOiBbXG4gICAgICAgICAgICAuLi5oYXNCYWNrZ3JvdW5kID8gZG9jdW1lbnQuY2hpbGRyZW5bMF0uYmFja2dyb3VuZC5zdGVwcyA6IFtdLFxuICAgICAgICAgICAgLi4uc2NlbmFyaW8uc3RlcHNcbiAgICAgICAgXVxuICAgIH0pKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGRvY3VtZW50LFxuICAgICAgICBhZnRlckVhY2g6IGN1Y3VtYmVyU3VwcG9ydENvZGUuYWZ0ZXJUZXN0Q2FzZUhvb2tEZWZpbml0aW9ucyxcbiAgICAgICAgYWZ0ZXJBbGw6IGN1Y3VtYmVyU3VwcG9ydENvZGUuYWZ0ZXJUZXN0UnVuSG9va0RlZmluaXRpb25zLFxuICAgICAgICBiZWZvcmVFYWNoOiBjdWN1bWJlclN1cHBvcnRDb2RlLmJlZm9yZVRlc3RDYXNlSG9va0RlZmluaXRpb25zLFxuICAgICAgICBiZWZvcmVBbGw6IGN1Y3VtYmVyU3VwcG9ydENvZGUuYmVmb3JlVGVzdFJ1bkhvb2tEZWZpbml0aW9ucyxcbiAgICAgICAgc2tpcDogc2tpcEZlYXR1cmUsXG4gICAgICAgIHN1aXRlczogc3VpdGVzLm1hcCgoc3VpdGUpID0+ICh7XG4gICAgICAgICAgICAuLi5zdWl0ZSxcbiAgICAgICAgICAgIHN0ZXBzOiBiaW5kR2hlcmtpblN0ZXBzKFxuICAgICAgICAgICAgICAgIHN1aXRlLnN0ZXBzLFxuICAgICAgICAgICAgICAgIGN1Y3VtYmVyU3VwcG9ydENvZGUuc3RlcERlZmluaXRpb25zXG4gICAgICAgICAgICApXG4gICAgICAgIH0pKVxuICAgIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGV4ZWNUZXN0KGN3ZDogc3RyaW5nLCBmZWF0dXJlUGF0aDogc3RyaW5nLCBtb2R1bGVGaWxlRXh0ZW5zaW9uczogc3RyaW5nW10sIHJlc3RvcmVNb2NrczogYm9vbGVhbiB8IHN0cmluZywga2VlcE1vY2tzPzogc3RyaW5nW10pIHtcblxuICAgIGNvbnN0IGFjdCA9IHR5cGVvZiBnbG9iYWxbJ3dpbmRvdyddID09PSAndW5kZWZpbmVkJyA/XG4gICAgICAgIGFzeW5jIChmbikgPT4gYXdhaXQgZm4oKSA6XG4gICAgICAgIHJlcXVpcmUoJ3JlYWN0LWRvbS90ZXN0LXV0aWxzJykuYWN0O1xuXG4gICAgLy8gaWYgcHJvamVjdENvbmZpZy5yZXN0b3JlTW9ja3MsIGdldCBhbGwgdGhlIF9fbW9ja19fIGJhc2VkIG1vY2tzIGFuZCByZW1vdmUgdGhlbVxuICAgIGlmICh0eXBlb2YgcmVzdG9yZU1vY2tzID09PSAnc3RyaW5nJyA/IHJlc3RvcmVNb2NrcyA9PT0gJ3RydWUnIDogcmVzdG9yZU1vY2tzKSB7XG4gICAgICAgIGdldE1vY2tzKGN3ZClcbiAgICAgICAgICAgIC5maWx0ZXIoKGZpbGUpID0+IChcbiAgICAgICAgICAgICAgICAha2VlcE1vY2tzLmxlbmd0aCB8fFxuICAgICAgICAgICAgICAgICFrZWVwTW9ja3MuaW5jbHVkZXMoZmlsZSlcbiAgICAgICAgICAgICkpXG4gICAgICAgICAgICAuZm9yRWFjaCgoZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgIGplc3QudW5tb2NrKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gcGFyc2UgdGhlIGZlYXR1cmUgZmlsZSB3aXRoIGdpdmVuIGN1Y3VtYmVyIHN0ZXBzIC8gaG9va3NcbiAgICAvLyBnZW5lcmF0aW5nIGEgamFzbWluZS1saWtlIHN0cnVjdHVyZVxuICAgIGNvbnN0IHNwZWMgPSBwYXJzZUdoZXJraW5TdWl0ZXMoXG4gICAgICAgIGN3ZCxcbiAgICAgICAgZmVhdHVyZVBhdGgsXG4gICAgICAgIG1vZHVsZUZpbGVFeHRlbnNpb25zLFxuICAgICAgICBzdXBwb3J0Q29kZUxpYnJhcnlCdWlsZGVyLm9wdGlvbnNcbiAgICApO1xuXG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZlYXR1cmVQYXRoLCBwYXRoLmV4dG5hbWUoZmVhdHVyZVBhdGgpKTtcblxuICAgIGNvbnN0IGhhc1NvbWVBY3RpdmVTdWl0ZXMgPSBzcGVjLnN1aXRlcy5zb21lKChzdWl0ZSkgPT4gIXN1aXRlLnNraXApO1xuXG4gICAgY29uc3Qgc2hvdWxkU2tpcFN1aXRlID0gc3BlYy5za2lwIHx8ICFoYXNTb21lQWN0aXZlU3VpdGVzO1xuXG4gICAgY29uc3QgZm4gPSBzaG91bGRTa2lwU3VpdGUgPyB4ZGVzY3JpYmUgfHwgZGVzY3JpYmUuc2tpcCA6IGRlc2NyaWJlO1xuXG4gICAgZm4oYEZlYXR1cmU6ICR7c3BlYy5kb2N1bWVudC5uYW1lfWAsICgpID0+IHtcblxuICAgICAgICBsZXQgd29ybGQ7XG5cbiAgICAgICAgYmVmb3JlQWxsKGFzeW5jICgpID0+IHtcblxuICAgICAgICAgICAgd29ybGQgPSBuZXcgc3VwcG9ydENvZGVMaWJyYXJ5QnVpbGRlci5vcHRpb25zLldvcmxkKHt9KTtcblxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGVjLmJlZm9yZUFsbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNwZWMuYmVmb3JlQWxsW2ldLmNvZGUuYXBwbHkod29ybGQsIFtzcGVjLCBmaWxlTmFtZV0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBhZnRlckFsbChhc3luYyAoKSA9PiB7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3BlYy5hZnRlckFsbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGF3YWl0IGFjdChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHNwZWMuYWZ0ZXJBbGxbaV0uY29kZS5hcHBseSh3b3JsZCwgW3NwZWMsIGZpbGVOYW1lXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdvcmxkID0gbnVsbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc3BlYy5zdWl0ZXMuZm9yRWFjaCgoc3VpdGUpID0+IHtcblxuICAgICAgICAgICAgY29uc3QgZm4gPSBzdWl0ZS5za2lwID8geGRlc2NyaWJlIHx8IGRlc2NyaWJlLnNraXAgOiBkZXNjcmliZTtcblxuICAgICAgICAgICAgZm4oYCR7c3VpdGUua2V5d29yZH06ICR7c3VpdGUubmFtZX1gLCAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBiZWZvcmVBbGwoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNwZWMuYmVmb3JlRWFjaC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgYWN0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzcGVjLmJlZm9yZUVhY2hbaV0uY29kZS5hcHBseSh3b3JsZCwgW3tzcGVjLCBzdWl0ZTogc3VpdGV9LCBmaWxlTmFtZV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGFmdGVyQWxsKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzcGVjLmFmdGVyRWFjaC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgYWN0KGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzcGVjLmFmdGVyRWFjaFtpXS5jb2RlLmFwcGx5KHdvcmxkLCBbe3NwZWMsIHN1aXRlOiBzdWl0ZX0sIGZpbGVOYW1lXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWl0ZS5zdGVwcy5naXZlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpdChzdWl0ZS5zdGVwcy5naXZlbltpXS5rZXl3b3JkICsgc3VpdGUuc3RlcHMuZ2l2ZW5baV0udGV4dCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc3VpdGUuc3RlcHMuZ2l2ZW5baV0uY29kZS5hcHBseSh3b3JsZCwgc3VpdGUuc3RlcHMuZ2l2ZW5baV0uc3RlcEFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1aXRlLnN0ZXBzLndoZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaXQoc3VpdGUuc3RlcHMud2hlbltpXS5kZXNjcmlwdGlvbiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc3VpdGUuc3RlcHMud2hlbltpXS5jb2RlLmFwcGx5KHdvcmxkLCBzdWl0ZS5zdGVwcy53aGVuW2ldLnN0ZXBBcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWl0ZS5zdGVwcy50aGVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0KHN1aXRlLnN0ZXBzLnRoZW5baV0uZGVzY3JpcHRpb24sIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHN1aXRlLnN0ZXBzLnRoZW5baV0uY29kZS5hcHBseSh3b3JsZCwgc3VpdGUuc3RlcHMudGhlbltpXS5zdGVwQXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbiJdfQ==