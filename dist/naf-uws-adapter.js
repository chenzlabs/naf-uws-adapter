/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * uWebSockets Adapter
 * For use with uws-server.js
 * networked-scene: serverURL needs to be ws://localhost:8080 when running locally
 */
var UwsAdapter = function () {
  function UwsAdapter() {
    _classCallCheck(this, UwsAdapter);

    var location = window.location;

    this.app = "default";
    this.room = "default";
    this.connectedClients = [];
    this.roomOccupantListener = null;

    this.serverTimeRequests = 0;
    this.timeOffsets = [];
    this.avgTimeOffset = 0;
  }

  _createClass(UwsAdapter, [{
    key: "setServerUrl",
    value: function setServerUrl(wsUrl) {
      this.wsUrl = wsUrl;
    }
  }, {
    key: "setApp",
    value: function setApp(appName) {
      this.app = appName;
    }
  }, {
    key: "setRoom",
    value: function setRoom(roomName) {
      this.room = roomName;
    }
  }, {
    key: "setWebRtcOptions",
    value: function setWebRtcOptions(options) {
      // No webrtc support
    }
  }, {
    key: "setServerConnectListeners",
    value: function setServerConnectListeners(successListener, failureListener) {
      this.connectSuccess = successListener;
      this.connectFailure = failureListener;
    }
  }, {
    key: "setRoomOccupantListener",
    value: function setRoomOccupantListener(occupantListener) {
      this.roomOccupantListener = occupantListener;
    }
  }, {
    key: "setDataChannelListeners",
    value: function setDataChannelListeners(openListener, closedListener, messageListener) {
      this.openListener = openListener;
      this.closedListener = closedListener;
      this.messageListener = messageListener;
    }
  }, {
    key: "updateTimeOffset",
    value: function updateTimeOffset() {
      var _this = this;

      var clientSentTime = Date.now() + this.avgTimeOffset;

      return fetch(document.location.href, { method: "HEAD", cache: "no-cache" }).then(function (res) {
        var precision = 1000;
        var serverReceivedTime = new Date(res.headers.get("Date")).getTime() + precision / 2;
        var clientReceivedTime = Date.now();
        var serverTime = serverReceivedTime + (clientReceivedTime - clientSentTime) / 2;
        var timeOffset = serverTime - clientReceivedTime;

        _this.serverTimeRequests++;

        if (_this.serverTimeRequests <= 10) {
          _this.timeOffsets.push(timeOffset);
        } else {
          _this.timeOffsets[_this.serverTimeRequests % 10] = timeOffset;
        }

        _this.avgTimeOffset = _this.timeOffsets.reduce(function (acc, offset) {
          return acc += offset;
        }, 0) / _this.timeOffsets.length;

        if (_this.serverTimeRequests > 10) {
          setTimeout(function () {
            return _this.updateTimeOffset();
          }, 5 * 60 * 1000); // Sync clock every 5 minutes.
        } else {
          _this.updateTimeOffset();
        }
      });
    }
  }, {
    key: "connect",
    value: function connect() {
      if (!this.wsUrl || this.wsUrl === "/") {
        if (location.protocol === "https:") {
          this.wsUrl = "wss://" + location.host;
        } else {
          this.wsUrl = "ws://" + location.host;
        }
      }

      this.updateTimeOffset();

      var socket = new WebSocket(this.wsUrl);
      var self = this;

      // WebSocket connection opened
      socket.addEventListener("open", function (event) {
        self.sendJoinRoom();
      });

      // WebSocket connection error
      socket.addEventListener("error", function (event) {
        self.connectFailure();
      });

      // Listen for messages
      socket.addEventListener("message", function (event) {
        // console.log('Message from server', event.data);

        var message = JSON.parse(event.data);

        if (message.type === "roomOccupantsChange") {
          self.receivedOccupants(message.data.occupants);
        } else if (message.type === "connectSuccess") {
          var data = message.data;
          var clientId = data.id;
          self.connectSuccess(clientId);
        } else if (message.type == "send" || message.type == "broadcast") {
          var from = message.from;
          var msgData = message.data;

          var dataType = msgData.type;
          var data = msgData.data;
          self.messageListener(from, dataType, data);
        }
      });

      this.socket = socket;
    }
  }, {
    key: "sendJoinRoom",
    value: function sendJoinRoom() {
      this._send("joinRoom", { room: this.room });
    }
  }, {
    key: "receivedOccupants",
    value: function receivedOccupants(occupants) {
      var occupantMap = {};
      for (var i = 0; i < occupants.length; i++) {
        if (occupants[i] != NAF.clientId) {
          occupantMap[occupants[i]] = true;
        }
      }
      this.roomOccupantListener(occupantMap);
    }
  }, {
    key: "shouldStartConnectionTo",
    value: function shouldStartConnectionTo(clientId) {
      return true;
    }
  }, {
    key: "startStreamConnection",
    value: function startStreamConnection(clientId) {
      this.connectedClients.push(clientId);
      this.openListener(clientId);
    }
  }, {
    key: "closeStreamConnection",
    value: function closeStreamConnection(clientId) {
      var index = this.connectedClients.indexOf(clientId);
      if (index > -1) {
        this.connectedClients.splice(index, 1);
      }
      this.closedListener(clientId);
    }
  }, {
    key: "getConnectStatus",
    value: function getConnectStatus(clientId) {
      var connected = this.connectedClients.indexOf(clientId) != -1;

      if (connected) {
        return NAF.adapters.IS_CONNECTED;
      } else {
        return NAF.adapters.NOT_CONNECTED;
      }
    }
  }, {
    key: "sendData",
    value: function sendData(clientId, dataType, data) {
      // console.log('sending data', dataType, data);
      var sendPacket = {
        target: clientId,
        type: dataType,
        data: data
      };
      this._send("send", sendPacket);
    }
  }, {
    key: "sendDataGuaranteed",
    value: function sendDataGuaranteed(clientId, dataType, data) {
      this.sendData(clientId, dataType, data);
    }
  }, {
    key: "broadcastData",
    value: function broadcastData(dataType, data) {
      var broadcastPacket = {
        type: dataType,
        data: data
      };
      this._send("broadcast", broadcastPacket);
    }
  }, {
    key: "broadcastDataGuaranteed",
    value: function broadcastDataGuaranteed(dataType, data) {
      this.broadcastData(dataType, data);
    }
  }, {
    key: "getServerTime",
    value: function getServerTime() {
      return Date.now() + this.avgTimeOffset;
    }
  }, {
    key: "disconnect",
    value: function disconnect() {
      this.socket.close();
    }
  }, {
    key: "_send",
    value: function _send(dataType, data) {
      var packet = {
        from: NAF.clientId,
        type: dataType,
        data: data
      };
      var packetStr = JSON.stringify(packet);
      this.socket.send(packetStr);
    }
  }]);

  return UwsAdapter;
}();

NAF.adapters.register("uws", UwsAdapter);

module.exports = UwsAdapter;

/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZmYwNjJjYjY2NmQwOWM5ZWU4NmUiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbIlV3c0FkYXB0ZXIiLCJsb2NhdGlvbiIsIndpbmRvdyIsImFwcCIsInJvb20iLCJjb25uZWN0ZWRDbGllbnRzIiwicm9vbU9jY3VwYW50TGlzdGVuZXIiLCJzZXJ2ZXJUaW1lUmVxdWVzdHMiLCJ0aW1lT2Zmc2V0cyIsImF2Z1RpbWVPZmZzZXQiLCJ3c1VybCIsImFwcE5hbWUiLCJyb29tTmFtZSIsIm9wdGlvbnMiLCJzdWNjZXNzTGlzdGVuZXIiLCJmYWlsdXJlTGlzdGVuZXIiLCJjb25uZWN0U3VjY2VzcyIsImNvbm5lY3RGYWlsdXJlIiwib2NjdXBhbnRMaXN0ZW5lciIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwiY2xpZW50U2VudFRpbWUiLCJEYXRlIiwibm93IiwiZmV0Y2giLCJkb2N1bWVudCIsImhyZWYiLCJtZXRob2QiLCJjYWNoZSIsInRoZW4iLCJwcmVjaXNpb24iLCJzZXJ2ZXJSZWNlaXZlZFRpbWUiLCJyZXMiLCJoZWFkZXJzIiwiZ2V0IiwiZ2V0VGltZSIsImNsaWVudFJlY2VpdmVkVGltZSIsInNlcnZlclRpbWUiLCJ0aW1lT2Zmc2V0IiwicHVzaCIsInJlZHVjZSIsImFjYyIsIm9mZnNldCIsImxlbmd0aCIsInNldFRpbWVvdXQiLCJ1cGRhdGVUaW1lT2Zmc2V0IiwicHJvdG9jb2wiLCJob3N0Iiwic29ja2V0IiwiV2ViU29ja2V0Iiwic2VsZiIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsInNlbmRKb2luUm9vbSIsIm1lc3NhZ2UiLCJKU09OIiwicGFyc2UiLCJkYXRhIiwidHlwZSIsInJlY2VpdmVkT2NjdXBhbnRzIiwib2NjdXBhbnRzIiwiY2xpZW50SWQiLCJpZCIsImZyb20iLCJtc2dEYXRhIiwiZGF0YVR5cGUiLCJfc2VuZCIsIm9jY3VwYW50TWFwIiwiaSIsIk5BRiIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsImNvbm5lY3RlZCIsImFkYXB0ZXJzIiwiSVNfQ09OTkVDVEVEIiwiTk9UX0NPTk5FQ1RFRCIsInNlbmRQYWNrZXQiLCJ0YXJnZXQiLCJzZW5kRGF0YSIsImJyb2FkY2FzdFBhY2tldCIsImJyb2FkY2FzdERhdGEiLCJjbG9zZSIsInBhY2tldCIsInBhY2tldFN0ciIsInN0cmluZ2lmeSIsInNlbmQiLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsbUNBQTJCLDBCQUEwQixFQUFFO0FBQ3ZELHlDQUFpQyxlQUFlO0FBQ2hEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLDhEQUFzRCwrREFBK0Q7O0FBRXJIO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUM3REE7Ozs7O0lBS01BLFU7QUFDSix3QkFBYztBQUFBOztBQUNaLFFBQUlDLFdBQVdDLE9BQU9ELFFBQXRCOztBQUVBLFNBQUtFLEdBQUwsR0FBVyxTQUFYO0FBQ0EsU0FBS0MsSUFBTCxHQUFZLFNBQVo7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixFQUF4QjtBQUNBLFNBQUtDLG9CQUFMLEdBQTRCLElBQTVCOztBQUVBLFNBQUtDLGtCQUFMLEdBQTBCLENBQTFCO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQixFQUFuQjtBQUNBLFNBQUtDLGFBQUwsR0FBcUIsQ0FBckI7QUFDRDs7OztpQ0FFWUMsSyxFQUFPO0FBQ2xCLFdBQUtBLEtBQUwsR0FBYUEs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TCxDQUFjbEIsUUFBZCxFQUF3QkksUUFBeEIsRUFBa0NSLElBQWxDO0FBQ0Q7OztrQ0FFYVEsUSxFQUFVUixJLEVBQU07QUFDNUIsVUFBSXVCLGtCQUFrQjtBQUNwQnRCLGNBQU1PLFFBRGM7QUFFcEJSLGNBQU1BO0FBRmMsT0FBdEI7QUFJQSxXQUFLUyxLQUFMLENBQVcsV0FBWCxFQUF3QmMsZUFBeEI7QUFDRDs7OzRDQUV1QmYsUSxFQUFVUixJLEVBQU07QUFDdEMsV0FBS3dCLGFBQUwsQ0FBbUJoQixRQUFuQixFQUE2QlIsSUFBN0I7QUFDRDs7O29DQUVlO0FBQ2QsYUFBT25DLEtBQUtDLEdBQUwsS0FBYSxLQUFLZixhQUF6QjtBQUNEOzs7aUNBRVk7QUFDWCxXQUFLd0MsTUFBTCxDQUFZa0MsS0FBWjtBQUNEOzs7MEJBRUtqQixRLEVBQVVSLEksRUFBTTtBQUNwQixVQUFJMEIsU0FBUztBQUNYcEIsY0FBTU0sSUFBSVIsUUFEQztBQUVYSCxjQUFNTyxRQUZLO0FBR1hSLGNBQU1BO0FBSEssT0FBYjtBQUtBLFVBQUkyQixZQUFZN0IsS0FBSzhCLFNBQUwsQ0FBZUYsTUFBZixDQUFoQjtBQUNBLFdBQUtuQyxNQUFMLENBQVlzQyxJQUFaLENBQWlCRixTQUFqQjtBQUNEOzs7Ozs7QUFHSGYsSUFBSUssUUFBSixDQUFhYSxRQUFiLENBQXNCLEtBQXRCLEVBQTZCeEYsVUFBN0I7O0FBRUF5RixPQUFPQyxPQUFQLEdBQWlCMUYsVUFBakIsQyIsImZpbGUiOiJuYWYtdXdzLWFkYXB0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCBmZjA2MmNiNjY2ZDA5YzllZTg2ZSIsIi8qKlxyXG4gKiB1V2ViU29ja2V0cyBBZGFwdGVyXHJcbiAqIEZvciB1c2Ugd2l0aCB1d3Mtc2VydmVyLmpzXHJcbiAqIG5ldHdvcmtlZC1zY2VuZTogc2VydmVyVVJMIG5lZWRzIHRvIGJlIHdzOi8vbG9jYWxob3N0OjgwODAgd2hlbiBydW5uaW5nIGxvY2FsbHlcclxuICovXHJcbmNsYXNzIFV3c0FkYXB0ZXIge1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdmFyIGxvY2F0aW9uID0gd2luZG93LmxvY2F0aW9uO1xyXG5cclxuICAgIHRoaXMuYXBwID0gXCJkZWZhdWx0XCI7XHJcbiAgICB0aGlzLnJvb20gPSBcImRlZmF1bHRcIjtcclxuICAgIHRoaXMuY29ubmVjdGVkQ2xpZW50cyA9IFtdO1xyXG4gICAgdGhpcy5yb29tT2NjdXBhbnRMaXN0ZW5lciA9IG51bGw7XHJcblxyXG4gICAgdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPSAwO1xyXG4gICAgdGhpcy50aW1lT2Zmc2V0cyA9IFtdO1xyXG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gMDtcclxuICB9XHJcblxyXG4gIHNldFNlcnZlclVybCh3c1VybCkge1xyXG4gICAgdGhpcy53c1VybCA9IHdzVXJsO1xyXG4gIH1cclxuXHJcbiAgc2V0QXBwKGFwcE5hbWUpIHtcclxuICAgIHRoaXMuYXBwID0gYXBwTmFtZTtcclxuICB9XHJcblxyXG4gIHNldFJvb20ocm9vbU5hbWUpIHtcclxuICAgIHRoaXMucm9vbSA9IHJvb21OYW1lO1xyXG4gIH1cclxuXHJcbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7XHJcbiAgICAvLyBObyB3ZWJydGMgc3VwcG9ydFxyXG4gIH1cclxuXHJcbiAgc2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyhzdWNjZXNzTGlzdGVuZXIsIGZhaWx1cmVMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5jb25uZWN0U3VjY2VzcyA9IHN1Y2Nlc3NMaXN0ZW5lcjtcclxuICAgIHRoaXMuY29ubmVjdEZhaWx1cmUgPSBmYWlsdXJlTGlzdGVuZXI7XHJcbiAgfVxyXG5cclxuICBzZXRSb29tT2NjdXBhbnRMaXN0ZW5lcihvY2N1cGFudExpc3RlbmVyKSB7XHJcbiAgICB0aGlzLnJvb21PY2N1cGFudExpc3RlbmVyID0gb2NjdXBhbnRMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xyXG4gICAgdGhpcy5vcGVuTGlzdGVuZXIgPSBvcGVuTGlzdGVuZXI7XHJcbiAgICB0aGlzLmNsb3NlZExpc3RlbmVyID0gY2xvc2VkTGlzdGVuZXI7XHJcbiAgICB0aGlzLm1lc3NhZ2VMaXN0ZW5lciA9IG1lc3NhZ2VMaXN0ZW5lcjtcclxuICB9XHJcblxyXG4gIHVwZGF0ZVRpbWVPZmZzZXQoKSB7XHJcbiAgICBjb25zdCBjbGllbnRTZW50VGltZSA9IERhdGUubm93KCkgKyB0aGlzLmF2Z1RpbWVPZmZzZXQ7XHJcblxyXG4gICAgcmV0dXJuIGZldGNoKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsIHsgbWV0aG9kOiBcIkhFQURcIiwgY2FjaGU6IFwibm8tY2FjaGVcIiB9KVxyXG4gICAgICAudGhlbihyZXMgPT4ge1xyXG4gICAgICAgIHZhciBwcmVjaXNpb24gPSAxMDAwO1xyXG4gICAgICAgIHZhciBzZXJ2ZXJSZWNlaXZlZFRpbWUgPSBuZXcgRGF0ZShyZXMuaGVhZGVycy5nZXQoXCJEYXRlXCIpKS5nZXRUaW1lKCkgKyAocHJlY2lzaW9uIC8gMik7XHJcbiAgICAgICAgdmFyIGNsaWVudFJlY2VpdmVkVGltZSA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdmFyIHNlcnZlclRpbWUgPSBzZXJ2ZXJSZWNlaXZlZFRpbWUgKyAoKGNsaWVudFJlY2VpdmVkVGltZSAtIGNsaWVudFNlbnRUaW1lKSAvIDIpO1xyXG4gICAgICAgIHZhciB0aW1lT2Zmc2V0ID0gc2VydmVyVGltZSAtIGNsaWVudFJlY2VpdmVkVGltZTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMrKztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2VydmVyVGltZVJlcXVlc3RzIDw9IDEwKSB7XHJcbiAgICAgICAgICB0aGlzLnRpbWVPZmZzZXRzLnB1c2godGltZU9mZnNldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMudGltZU9mZnNldHNbdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgJSAxMF0gPSB0aW1lT2Zmc2V0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gdGhpcy50aW1lT2Zmc2V0cy5yZWR1Y2UoKGFjYywgb2Zmc2V0KSA9PiBhY2MgKz0gb2Zmc2V0LCAwKSAvIHRoaXMudGltZU9mZnNldHMubGVuZ3RoO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPiAxMCkge1xyXG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKSwgNSAqIDYwICogMTAwMCk7IC8vIFN5bmMgY2xvY2sgZXZlcnkgNSBtaW51dGVzLlxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgY29ubmVjdCgpIHtcclxuICAgIGlmICghdGhpcy53c1VybCB8fCB0aGlzLndzVXJsID09PSBcIi9cIikge1xyXG4gICAgICBpZiAobG9jYXRpb24ucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIpIHtcclxuICAgICAgICB0aGlzLndzVXJsID0gXCJ3c3M6Ly9cIiArIGxvY2F0aW9uLmhvc3Q7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy53c1VybCA9IFwid3M6Ly9cIiArIGxvY2F0aW9uLmhvc3Q7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKTtcclxuXHJcbiAgICB2YXIgc29ja2V0ID0gbmV3IFdlYlNvY2tldCh0aGlzLndzVXJsKTtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAvLyBXZWJTb2NrZXQgY29ubmVjdGlvbiBvcGVuZWRcclxuICAgIHNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwib3BlblwiLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBzZWxmLnNlbmRKb2luUm9vbSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gV2ViU29ja2V0IGNvbm5lY3Rpb24gZXJyb3JcclxuICAgIHNvY2tldC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgc2VsZi5jb25uZWN0RmFpbHVyZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTGlzdGVuIGZvciBtZXNzYWdlc1xyXG4gICAgc29ja2V0LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKCdNZXNzYWdlIGZyb20gc2VydmVyJywgZXZlbnQuZGF0YSk7XHJcblxyXG4gICAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XHJcblxyXG4gICAgICBpZiAobWVzc2FnZS50eXBlID09PSBcInJvb21PY2N1cGFudHNDaGFuZ2VcIikge1xyXG4gICAgICAgIHNlbGYucmVjZWl2ZWRPY2N1cGFudHMobWVzc2FnZS5kYXRhLm9jY3VwYW50cyk7XHJcbiAgICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSBcImNvbm5lY3RTdWNjZXNzXCIpIHtcclxuICAgICAgICB2YXIgZGF0YSA9IG1lc3NhZ2UuZGF0YTtcclxuICAgICAgICB2YXIgY2xpZW50SWQgPSBkYXRhLmlkO1xyXG4gICAgICAgIHNlbGYuY29ubmVjdFN1Y2Nlc3MoY2xpZW50SWQpO1xyXG4gICAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PSBcInNlbmRcIiB8fCBtZXNzYWdlLnR5cGUgPT0gXCJicm9hZGNhc3RcIikge1xyXG4gICAgICAgIHZhciBmcm9tID0gbWVzc2FnZS5mcm9tO1xyXG4gICAgICAgIHZhciBtc2dEYXRhID0gbWVzc2FnZS5kYXRhO1xyXG5cclxuICAgICAgICB2YXIgZGF0YVR5cGUgPSBtc2dEYXRhLnR5cGU7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBtc2dEYXRhLmRhdGE7XHJcbiAgICAgICAgc2VsZi5tZXNzYWdlTGlzdGVuZXIoZnJvbSwgZGF0YVR5cGUsIGRhdGEpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLnNvY2tldCA9IHNvY2tldDtcclxuICB9XHJcblxyXG4gIHNlbmRKb2luUm9vbSgpIHtcclxuICAgIHRoaXMuX3NlbmQoXCJqb2luUm9vbVwiLCB7IHJvb206IHRoaXMucm9vbSB9KTtcclxuICB9XHJcblxyXG4gIHJlY2VpdmVkT2NjdXBhbnRzKG9jY3VwYW50cykge1xyXG4gICAgdmFyIG9jY3VwYW50TWFwID0ge307XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9jY3VwYW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAob2NjdXBhbnRzW2ldICE9IE5BRi5jbGllbnRJZCkge1xyXG4gICAgICAgIG9jY3VwYW50TWFwW29jY3VwYW50c1tpXV0gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TWFwKTtcclxuICB9XHJcblxyXG4gIHNob3VsZFN0YXJ0Q29ubmVjdGlvblRvKGNsaWVudElkKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHN0YXJ0U3RyZWFtQ29ubmVjdGlvbihjbGllbnRJZCkge1xyXG4gICAgdGhpcy5jb25uZWN0ZWRDbGllbnRzLnB1c2goY2xpZW50SWQpO1xyXG4gICAgdGhpcy5vcGVuTGlzdGVuZXIoY2xpZW50SWQpO1xyXG4gIH1cclxuXHJcbiAgY2xvc2VTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7XHJcbiAgICB2YXIgaW5kZXggPSB0aGlzLmNvbm5lY3RlZENsaWVudHMuaW5kZXhPZihjbGllbnRJZCk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICB0aGlzLmNvbm5lY3RlZENsaWVudHMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICAgIHRoaXMuY2xvc2VkTGlzdGVuZXIoY2xpZW50SWQpO1xyXG4gIH1cclxuXHJcbiAgZ2V0Q29ubmVjdFN0YXR1cyhjbGllbnRJZCkge1xyXG4gICAgdmFyIGNvbm5lY3RlZCA9IHRoaXMuY29ubmVjdGVkQ2xpZW50cy5pbmRleE9mKGNsaWVudElkKSAhPSAtMTtcclxuXHJcbiAgICBpZiAoY29ubmVjdGVkKSB7XHJcbiAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuSVNfQ09OTkVDVEVEO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgc2VuZERhdGEoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICAvLyBjb25zb2xlLmxvZygnc2VuZGluZyBkYXRhJywgZGF0YVR5cGUsIGRhdGEpO1xyXG4gICAgdmFyIHNlbmRQYWNrZXQgPSB7XHJcbiAgICAgIHRhcmdldDogY2xpZW50SWQsXHJcbiAgICAgIHR5cGU6IGRhdGFUeXBlLFxyXG4gICAgICBkYXRhOiBkYXRhXHJcbiAgICB9O1xyXG4gICAgdGhpcy5fc2VuZChcInNlbmRcIiwgc2VuZFBhY2tldCk7XHJcbiAgfVxyXG5cclxuICBzZW5kRGF0YUd1YXJhbnRlZWQoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLnNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSk7XHJcbiAgfVxyXG5cclxuICBicm9hZGNhc3REYXRhKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB2YXIgYnJvYWRjYXN0UGFja2V0ID0ge1xyXG4gICAgICB0eXBlOiBkYXRhVHlwZSxcclxuICAgICAgZGF0YTogZGF0YVxyXG4gICAgfTtcclxuICAgIHRoaXMuX3NlbmQoXCJicm9hZGNhc3RcIiwgYnJvYWRjYXN0UGFja2V0KTtcclxuICB9XHJcblxyXG4gIGJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKGRhdGFUeXBlLCBkYXRhKSB7XHJcbiAgICB0aGlzLmJyb2FkY2FzdERhdGEoZGF0YVR5cGUsIGRhdGEpO1xyXG4gIH1cclxuXHJcbiAgZ2V0U2VydmVyVGltZSgpIHtcclxuICAgIHJldHVybiBEYXRlLm5vdygpICsgdGhpcy5hdmdUaW1lT2Zmc2V0O1xyXG4gIH1cclxuXHJcbiAgZGlzY29ubmVjdCgpIHtcclxuICAgIHRoaXMuc29ja2V0LmNsb3NlKCk7XHJcbiAgfVxyXG5cclxuICBfc2VuZChkYXRhVHlwZSwgZGF0YSkge1xyXG4gICAgdmFyIHBhY2tldCA9IHtcclxuICAgICAgZnJvbTogTkFGLmNsaWVudElkLFxyXG4gICAgICB0eXBlOiBkYXRhVHlwZSxcclxuICAgICAgZGF0YTogZGF0YVxyXG4gICAgfTtcclxuICAgIHZhciBwYWNrZXRTdHIgPSBKU09OLnN0cmluZ2lmeShwYWNrZXQpO1xyXG4gICAgdGhpcy5zb2NrZXQuc2VuZChwYWNrZXRTdHIpO1xyXG4gIH1cclxufVxyXG5cclxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwidXdzXCIsIFV3c0FkYXB0ZXIpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBVd3NBZGFwdGVyO1xyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvaW5kZXguanMiXSwic291cmNlUm9vdCI6IiJ9