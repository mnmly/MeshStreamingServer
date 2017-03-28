var receivedData

// 1.モジュールオブジェクトの初期化
var fs = require("fs");
var port = process.env.PORT || 8888
var server = require("http").createServer(function(req, res) {
     res.writeHead(200, {"Content-Type":"text/html"});
     var output = fs.readFileSync("./index.html", "utf-8");
     res.end(output);
}).listen( port, function( err ) {
  if ( err ) console.log( err.message )
  console.log( "Running at port: " + port )
} );

var io = require("socket.io").listen(server);

// ユーザ管理ハッシュ
var userHash = {};

io.sockets.on("connection", function (socket) {

  if ( receivedData ) {
    if ( receivedData.mesh instanceof Buffer ) {
      socket.emit("unity",{"mesh":receivedData.mesh.toString("base64")});
    } else {
      socket.emit("json",receivedData);
    }
  }

  socket.on("connected", function (name) {
    var msg = name + " is connected.";
    userHash[socket.id] = name;
    io.sockets.emit("publish", {value: msg});

  });

  // メッセージ送信カスタムイベント
  socket.on("publish", function (data) {
    console.log("published");
    io.sockets.emit("publish", {value:data.value});
  });

  // 接続終了組み込みイベント(接続元ユーザを削除し、他ユーザへ通知)
  socket.on("disconnect", function () {
    if (userHash[socket.id]) {
      var msg = userHash[socket.id] + " is disconnected.";
      delete userHash[socket.id];
      io.sockets.emit("publish", {value: msg});
      console.log(msg);

      //io.sockets.emit("unity",receivedData);
    }
  });

  socket.on("gh", function (data) {
    receivedData = data;
    if ( data.mesh instanceof Buffer ) {
      io.sockets.emit("unity",{"mesh":data.mesh.toString("base64")});
    } else {
      io.sockets.emit("json",data);
    }
  });
});
