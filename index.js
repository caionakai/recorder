const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const child_process = require("child_process");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

let fileStream;

let buffer = [];
let ok = true;
io.on("connection", (socket) => {
  console.log("a user connected");
  // fileStream = fs.createWriteStream("./video.webm", { flags: "a" });

  const ffmpeg = child_process.spawn("ffmpeg", [
    "-i",
    "-",
    "-vcodec",
    "copy",
    "-f",
    "mp4",
    "webcam.mp4",
  ]);

  const ffmpeg2 = child_process.spawn("ffmpeg", [
    "-i",
    "-",
    "-vcodec",
    "copy",
    "-f",
    "h264",
    "screen.mp4",
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

  ffmpeg2.on("close", (code, signal) => {
    console.log(
      "FFmpeg child process closed, code " + code + ", signal " + signal
    );
  });

  ffmpeg2.stdin.on("error", (e) => {
    console.log("FFmpeg STDIN Error", e);
  });

  ffmpeg2.stderr.on("data", (data) => {
    console.log("FFmpeg STDERR:", data.toString());
  });

  socket.on("message", (msg) => {
    console.log("Writing blob! ");
    if (!ok) return;
    ffmpeg.stdin.write(msg);
  });

  socket.on("screen_stream", (msg) => {
    console.log("Writing screen blob! ");
    // if (!ok) return;
    ffmpeg2.stdin.write(msg);
  });

  socket.on("stop_screen", () => {
    console.log("Stop recording..");
    ok = false;
    ffmpeg2.kill("SIGINT");
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
