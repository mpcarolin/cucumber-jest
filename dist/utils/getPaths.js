"use strict";

var _fastGlob = _interopRequireDefault(require("fast-glob"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const params = process.argv.slice(2);

(async () => {
  const extensions = params[2] ? `{${JSON.parse(params[2]).join(',')}}` : '*';

  const glob = _path.default.normalize(_path.default.join(params[0], `${params[1]}.${extensions}`));

  const paths = await (0, _fastGlob.default)([glob], {
    cwd: params[0],
    absolute: true
  });
  process.stdout.write(JSON.stringify(paths), () => {
    process.exit();
  });
})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9nZXRQYXRocy50cyJdLCJuYW1lcyI6WyJwYXJhbXMiLCJwcm9jZXNzIiwiYXJndiIsInNsaWNlIiwiZXh0ZW5zaW9ucyIsIkpTT04iLCJwYXJzZSIsImpvaW4iLCJnbG9iIiwicGF0aCIsIm5vcm1hbGl6ZSIsInBhdGhzIiwiY3dkIiwiYWJzb2x1dGUiLCJzdGRvdXQiLCJ3cml0ZSIsInN0cmluZ2lmeSIsImV4aXQiXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxNQUFNLEdBQUdDLE9BQU8sQ0FBQ0MsSUFBUixDQUFhQyxLQUFiLENBQW1CLENBQW5CLENBQWY7O0FBRUEsQ0FBQyxZQUFZO0FBRVQsUUFBTUMsVUFBVSxHQUFHSixNQUFNLENBQUMsQ0FBRCxDQUFOLEdBQWEsSUFBR0ssSUFBSSxDQUFDQyxLQUFMLENBQVdOLE1BQU0sQ0FBQyxDQUFELENBQWpCLEVBQXNCTyxJQUF0QixDQUEyQixHQUEzQixDQUFnQyxHQUFoRCxHQUFxRCxHQUF4RTs7QUFFQSxRQUFNQyxJQUFJLEdBQUdDLGNBQUtDLFNBQUwsQ0FBZUQsY0FBS0YsSUFBTCxDQUFVUCxNQUFNLENBQUMsQ0FBRCxDQUFoQixFQUFxQixHQUFFQSxNQUFNLENBQUMsQ0FBRCxDQUFJLElBQUdJLFVBQVcsRUFBL0MsQ0FBZixDQUFiOztBQUVBLFFBQU1PLEtBQUssR0FBRyxNQUFNLHVCQUFHLENBQUNILElBQUQsQ0FBSCxFQUFXO0FBQzNCSSxJQUFBQSxHQUFHLEVBQUVaLE1BQU0sQ0FBQyxDQUFELENBRGdCO0FBRTNCYSxJQUFBQSxRQUFRLEVBQUU7QUFGaUIsR0FBWCxDQUFwQjtBQUtBWixFQUFBQSxPQUFPLENBQUNhLE1BQVIsQ0FBZUMsS0FBZixDQUFxQlYsSUFBSSxDQUFDVyxTQUFMLENBQWVMLEtBQWYsQ0FBckIsRUFBNEMsTUFBTTtBQUM5Q1YsSUFBQUEsT0FBTyxDQUFDZ0IsSUFBUjtBQUNILEdBRkQ7QUFJSCxDQWZEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZnIGZyb20gJ2Zhc3QtZ2xvYic7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuY29uc3QgcGFyYW1zID0gcHJvY2Vzcy5hcmd2LnNsaWNlKDIpO1xuXG4oYXN5bmMgKCkgPT4ge1xuXG4gICAgY29uc3QgZXh0ZW5zaW9ucyA9IHBhcmFtc1syXSA/IGB7JHtKU09OLnBhcnNlKHBhcmFtc1syXSkuam9pbignLCcpfX1gIDogJyonO1xuXG4gICAgY29uc3QgZ2xvYiA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihwYXJhbXNbMF0sYCR7cGFyYW1zWzFdfS4ke2V4dGVuc2lvbnN9YCkpO1xuXG4gICAgY29uc3QgcGF0aHMgPSBhd2FpdCBmZyhbZ2xvYl0sIHtcbiAgICAgICAgY3dkOiBwYXJhbXNbMF0sXG4gICAgICAgIGFic29sdXRlOiB0cnVlXG4gICAgfSk7XG5cbiAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShKU09OLnN0cmluZ2lmeShwYXRocyksICgpID0+IHtcbiAgICAgICAgcHJvY2Vzcy5leGl0KCk7XG4gICAgfSk7XG5cbn0pKCk7XG4iXX0=