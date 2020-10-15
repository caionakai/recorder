const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const child_process = require("child_process");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("a user connected");

  const ffmpeg = child_process.spawn("ffmpeg", [
    "-i",
    "-",
    "-vcodec",
    "copy",
    "-f",
    "flv",
    "rtmpUrl.webm",
  ]);

  ffmpeg.on("close", (code, signal) => {
    console.log(
      "FFmpeg child process closed, code " + code + ", signal " + signal
    );
  });

  ffmpeg.stdin.on("error", (e) => {
    console.log("FFmpeg STDIN Error", e);
  });

  ffmpeg.stderr.on("data", (data) => {
    console.log("FFmpeg STDERR:", data.toString());
  });

  socket.on("message", (msg) => {
    console.log("Writing blob! ");
    ffmpeg.stdin.write(msg);
  });

  socket.on("stop", () => {
    console.log("Stop recording..");
    ffmpeg.kill("SIGINT");
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
