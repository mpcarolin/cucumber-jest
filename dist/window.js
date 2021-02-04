"use strict";

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.WINDOW_HEIGHT = 1070;
window.WINDOW_WIDTH = 1070;
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  value: 28
});
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  value: 150
});
Object.defineProperty(document.documentElement, 'scrollHeight', {
  configurable: true,
  value: window.WINDOW_HEIGHT
});
Object.defineProperty(document.documentElement, 'scrollWidth', {
  configurable: true,
  value: window.WINDOW_WIDTH
});
Object.defineProperty(window.document.documentElement, 'clientWidth', {
  configurable: true,
  value: window.WINDOW_WIDTH
});
Object.defineProperty(window.document.documentElement, 'clientHeight', {
  configurable: true,
  value: window.WINDOW_HEIGHT
});
Object.defineProperty(window.document.body, 'clientWidth', {
  configurable: true,
  value: window.WINDOW_WIDTH
});
Object.defineProperty(window.document.body, 'clientHeight', {
  configurable: true,
  value: window.WINDOW_HEIGHT
});
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  value: window.WINDOW_WIDTH
});
Object.defineProperty(window, 'innerHeight', {
  writable: true,
  value: window.WINDOW_HEIGHT
});
Object.defineProperty(window, 'outerWidth', {
  writable: true,
  value: window.WINDOW_WIDTH
});
Object.defineProperty(window, 'outerHeight', {
  writable: true,
  value: window.WINDOW_HEIGHT + 79
});
document.body.style.height = `${window.WINDOW_HEIGHT}px`;
document.body.style.width = `${window.WINDOW_WIDTH}px`;

if (!document.hasOwnProperty('createRange')) {
  document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    //@ts-ignore
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document
    }
  });
}

Object.defineProperty(window.Element.prototype, 'innerText', {
  set(value) {
    this.textContent = value;
  },

  configurable: true
});

window.navigator.msSaveBlob = (blob, fileName) => {
  _fs.default.writeFileSync(`${_path.default.resolve(process.cwd(), './tmp')}/${fileName}`, blob);

  return true;
};

window.navigator.msSaveOrOpenBlob = (blob, fileName) => {
  _fs.default.writeFileSync(_path.default.normalize(_path.default.join(`${_path.default.resolve(process.cwd(), './tmp')}`, fileName)), blob);

  return true;
};

HTMLElement.prototype.getBoundingClientRect = () => {
  return {
    x: 0,
    y: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: window.WINDOW_WIDTH / 4,
    height: window.WINDOW_HEIGHT / 4,

    toJSON() {
      return '';
    }

  };
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy93aW5kb3cudHMiXSwibmFtZXMiOlsid2luZG93IiwiV0lORE9XX0hFSUdIVCIsIldJTkRPV19XSURUSCIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiSFRNTEVsZW1lbnQiLCJwcm90b3R5cGUiLCJjb25maWd1cmFibGUiLCJ2YWx1ZSIsImRvY3VtZW50IiwiZG9jdW1lbnRFbGVtZW50IiwiYm9keSIsIndyaXRhYmxlIiwic3R5bGUiLCJoZWlnaHQiLCJ3aWR0aCIsImhhc093blByb3BlcnR5IiwiY3JlYXRlUmFuZ2UiLCJzZXRTdGFydCIsInNldEVuZCIsImNvbW1vbkFuY2VzdG9yQ29udGFpbmVyIiwibm9kZU5hbWUiLCJvd25lckRvY3VtZW50IiwiRWxlbWVudCIsInNldCIsInRleHRDb250ZW50IiwibmF2aWdhdG9yIiwibXNTYXZlQmxvYiIsImJsb2IiLCJmaWxlTmFtZSIsImZzIiwid3JpdGVGaWxlU3luYyIsInBhdGgiLCJyZXNvbHZlIiwicHJvY2VzcyIsImN3ZCIsIm1zU2F2ZU9yT3BlbkJsb2IiLCJub3JtYWxpemUiLCJqb2luIiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwieCIsInkiLCJ0b3AiLCJyaWdodCIsImJvdHRvbSIsImxlZnQiLCJ0b0pTT04iXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7Ozs7QUFTQUEsTUFBTSxDQUFDQyxhQUFQLEdBQXVCLElBQXZCO0FBQ0FELE1BQU0sQ0FBQ0UsWUFBUCxHQUFzQixJQUF0QjtBQUVBQyxNQUFNLENBQUNDLGNBQVAsQ0FBc0JDLFdBQVcsQ0FBQ0MsU0FBbEMsRUFBNkMsY0FBN0MsRUFBNkQ7QUFDekRDLEVBQUFBLFlBQVksRUFBRSxJQUQyQztBQUV6REMsRUFBQUEsS0FBSyxFQUFFO0FBRmtELENBQTdEO0FBS0FMLE1BQU0sQ0FBQ0MsY0FBUCxDQUFzQkMsV0FBVyxDQUFDQyxTQUFsQyxFQUE2QyxhQUE3QyxFQUE0RDtBQUN4REMsRUFBQUEsWUFBWSxFQUFFLElBRDBDO0FB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QUEsS0FBSyxFQUFFLENBSko7QUFLSEMsSUFBQUEsTUFBTSxFQUFFLENBTEw7QUFNSEMsSUFBQUEsSUFBSSxFQUFFLENBTkg7QUFPSDlCLElBQUFBLEtBQUssRUFBRWYsTUFBTSxDQUFDRSxZQUFQLEdBQXNCLENBUDFCO0FBUUhZLElBQUFBLE1BQU0sRUFBRWQsTUFBTSxDQUFDQyxhQUFQLEdBQXVCLENBUjVCOztBQVNINkMsSUFBQUEsTUFBTSxHQUFRO0FBQ1YsYUFBTyxFQUFQO0FBQ0g7O0FBWEUsR0FBUDtBQWFILENBZEQiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmRlY2xhcmUgZ2xvYmFsIHtcbiAgICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICAgICAgV0lORE9XX0hFSUdIVDogbnVtYmVyO1xuICAgICAgICBXSU5ET1dfV0lEVEg6IG51bWJlcjtcbiAgICB9XG59XG5cbndpbmRvdy5XSU5ET1dfSEVJR0hUID0gMTA3MDtcbndpbmRvdy5XSU5ET1dfV0lEVEggPSAxMDcwO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoSFRNTEVsZW1lbnQucHJvdG90eXBlLCAnb2Zmc2V0SGVpZ2h0Jywge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogMjhcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoSFRNTEVsZW1lbnQucHJvdG90eXBlLCAnb2Zmc2V0V2lkdGgnLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiAxNTBcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnc2Nyb2xsSGVpZ2h0Jywge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogd2luZG93LldJTkRPV19IRUlHSFRcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnc2Nyb2xsV2lkdGgnLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiB3aW5kb3cuV0lORE9XX1dJRFRIXG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHdpbmRvdy5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICdjbGllbnRXaWR0aCcsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6IHdpbmRvdy5XSU5ET1dfV0lEVEhcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkod2luZG93LmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ2NsaWVudEhlaWdodCcsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6IHdpbmRvdy5XSU5ET1dfSEVJR0hUXG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHdpbmRvdy5kb2N1bWVudC5ib2R5LCAnY2xpZW50V2lkdGgnLCB7XG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIHZhbHVlOiB3aW5kb3cuV0lORE9XX1dJRFRIXG59KTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KHdpbmRvdy5kb2N1bWVudC5ib2R5LCAnY2xpZW50SGVpZ2h0Jywge1xuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogd2luZG93LldJTkRPV19IRUlHSFRcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkod2luZG93LCAnaW5uZXJXaWR0aCcsIHtcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogd2luZG93LldJTkRPV19XSURUSFxufSk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3csICdpbm5lckhlaWdodCcsIHtcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogd2luZG93LldJTkRPV19IRUlHSFRcbn0pO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkod2luZG93LCAnb3V0ZXJXaWR0aCcsIHtcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogd2luZG93LldJTkRPV19XSURUSFxufSk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3csICdvdXRlckhlaWdodCcsIHtcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICB2YWx1ZTogd2luZG93LldJTkRPV19IRUlHSFQgKyA3OVxufSk7XG5cbmRvY3VtZW50LmJvZHkuc3R5bGUuaGVpZ2h0ID0gYCR7d2luZG93LldJTkRPV19IRUlHSFR9cHhgO1xuZG9jdW1lbnQuYm9keS5zdHlsZS53aWR0aCA9IGAke3dpbmRvdy5XSU5ET1dfV0lEVEh9cHhgO1xuXG5pZiAoIWRvY3VtZW50Lmhhc093blByb3BlcnR5KCdjcmVhdGVSYW5nZScpKSB7XG4gICAgZG9jdW1lbnQuY3JlYXRlUmFuZ2UgPSAoKSA9PiAoe1xuICAgICAgICBzZXRTdGFydDogKCkgPT4ge1xuICAgICAgICB9LFxuICAgICAgICBzZXRFbmQ6ICgpID0+IHtcbiAgICAgICAgfSxcbiAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgIGNvbW1vbkFuY2VzdG9yQ29udGFpbmVyOiB7XG4gICAgICAgICAgICBub2RlTmFtZTogJ0JPRFknLFxuICAgICAgICAgICAgb3duZXJEb2N1bWVudDogZG9jdW1lbnRcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkod2luZG93LkVsZW1lbnQucHJvdG90eXBlLCAnaW5uZXJUZXh0Jywge1xuICAgIHNldCh2YWx1ZSkge1xuICAgICAgICB0aGlzLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgfSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbn0pO1xuXG53aW5kb3cubmF2aWdhdG9yLm1zU2F2ZUJsb2IgPSAoYmxvYjogYW55LCBmaWxlTmFtZTogc3RyaW5nKSA9PiB7XG5cbiAgICBmcy53cml0ZUZpbGVTeW5jKFxuICAgICAgICBgJHtwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy4vdG1wJyl9LyR7ZmlsZU5hbWV9YCxcbiAgICAgICAgYmxvYlxuICAgICk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbndpbmRvdy5uYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYiA9IChibG9iOiBhbnksIGZpbGVOYW1lOiBzdHJpbmcpID0+IHtcblxuICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICAgIHBhdGgubm9ybWFsaXplKHBhdGguam9pbihgJHtwYXRoLnJlc29sdmUocHJvY2Vzcy5jd2QoKSwgJy4vdG1wJyl9YCxmaWxlTmFtZSkpLFxuICAgICAgICBibG9iXG4gICAgKTtcblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuSFRNTEVsZW1lbnQucHJvdG90eXBlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiAwLFxuICAgICAgICB5OiAwLFxuICAgICAgICB0b3A6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHdpZHRoOiB3aW5kb3cuV0lORE9XX1dJRFRIIC8gNCxcbiAgICAgICAgaGVpZ2h0OiB3aW5kb3cuV0lORE9XX0hFSUdIVCAvIDQsXG4gICAgICAgIHRvSlNPTigpOiBhbnkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfTtcbn07XG4iXX0=