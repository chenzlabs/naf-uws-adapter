/**
 * uWebSockets Adapter
 * For use with uws-server.js
 * networked-scene: serverURL needs to be ws://localhost:8080 when running locally
 */
class UwsAdapter {
  constructor() {
    var location = window.location;

    this.app = "default";
    this.room = "default";
    this.connectedClients = [];
    this.roomOccupantListener = null;

    this.serverTimeRequests = 0;
    this.timeOffsets = [];
    this.avgTimeOffset = 0;
  }

  setServerUrl(wsUrl) {
    this.wsUrl = wsUrl;
  }

  setApp(appName) {
    this.app = appName;
  }

  setRoom(roomName) {
    this.room = roomName;
  }

  setWebRtcOptions(options) {
    // No webrtc support
  }

  setServerConnectListeners(successListener, failureListener) {
    this.connectSuccess = successListener;
    this.connectFailure = failureListener;
  }

  setRoomOccupantListener(occupantListener) {
    this.roomOccupantListener = occupantListener;
  }

  setDataChannelListeners(openListener, closedListener, messageListener) {
    this.openListener = openListener;
    this.closedListener = closedListener;
    this.messageListener = messageListener;
  }

  updateTimeOffset() {
    const clientSentTime = Date.now() + this.avgTimeOffset;

    return fetch(document.location.href, { method: "HEAD", cache: "no-cache" })
      .then(res => {
        var precision = 1000;
        var serverReceivedTime = new Date(res.headers.get("Date")).getTime() + (precision / 2);
        var clientReceivedTime = Date.now();
        var serverTime = serverReceivedTime + ((clientReceivedTime - clientSentTime) / 2);
        var timeOffset = serverTime - clientReceivedTime;

        this.serverTimeRequests++;

        if (this.serverTimeRequests <= 10) {
          this.timeOffsets.push(timeOffset);
        } else {
          this.timeOffsets[this.serverTimeRequests % 10] = timeOffset;
        }

        this.avgTimeOffset = this.timeOffsets.reduce((acc, offset) => acc += offset, 0) / this.timeOffsets.length;

        if (this.serverTimeRequests > 10) {
          setTimeout(() => this.updateTimeOffset(), 5 * 60 * 1000); // Sync clock every 5 minutes.
        } else {
          this.updateTimeOffset();
        }
      });
  }

  connect() {
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
    socket.addEventListener("open", function(event) {
      self.sendJoinRoom();
    });

    // WebSocket connection error
    socket.addEventListener("error", function(event) {
      self.connectFailure();
    });

    // Listen for messages
    socket.addEventListener("message", function(event) {
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

  sendJoinRoom() {
    this._send("joinRoom", { room: this.room });
  }

  receivedOccupants(occupants) {
    var occupantMap = {};
    for (var i = 0; i < occupants.length; i++) {
      if (occupants[i] != NAF.clientId) {
        occupantMap[occupants[i]] = true;
      }
    }
    this.roomOccupantListener(occupantMap);
  }

  shouldStartConnectionTo(clientId) {
    return true;
  }

  startStreamConnection(clientId) {
    this.connectedClients.push(clientId);
    this.openListener(clientId);
  }

  closeStreamConnection(clientId) {
    var index = this.connectedClients.indexOf(clientId);
    if (index > -1) {
      this.connectedClients.splice(index, 1);
    }
    this.closedListener(clientId);
  }

  getConnectStatus(clientId) {
    var connected = this.connectedClients.indexOf(clientId) != -1;

    if (connected) {
      return NAF.adapters.IS_CONNECTED;
    } else {
      return NAF.adapters.NOT_CONNECTED;
    }
  }

  sendData(clientId, dataType, data) {
    // console.log('sending data', dataType, data);
    var sendPacket = {
      target: clientId,
      type: dataType,
      data: data
    };
    this._send("send", sendPacket);
  }

  sendDataGuaranteed(clientId, dataType, data) {
    this.sendData(clientId, dataType, data);
  }

  broadcastData(dataType, data) {
    var broadcastPacket = {
      type: dataType,
      data: data
    };
    this._send("broadcast", broadcastPacket);
  }

  broadcastDataGuaranteed(dataType, data) {
    this.broadcastData(dataType, data);
  }

  getServerTime() {
    return Date.now() + this.avgTimeOffset;
  }

  disconnect() {
    this.socket.close();
  }

  _send(dataType, data) {
    var packet = {
      from: NAF.clientId,
      type: dataType,
      data: data
    };
    var packetStr = JSON.stringify(packet);
    this.socket.send(packetStr);
  }
}

NAF.adapters.register("uws", UwsAdapter);

module.exports = UwsAdapter;
