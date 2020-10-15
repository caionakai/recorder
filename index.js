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
    // Facebook requires an audio track, so we create a silent one here.
    // Remove this line, as well as `-shortest`, if you send audio from the browser.
    // "-f",
    // "lavfi",
    // "-i",
    // "anullsrc",

    // FFmpeg will read input video from STDIN
    "-i",
    "-",

    // Because we're using a generated audio source which never ends,
    // specify that we'll stop at end of other input.  Remove this line if you
    // send audio from the browser.
    // "-shortest",

    // If we're encoding H.264 in-browser, we can set the video codec to 'copy'
    // so that we don't waste any CPU and quality with unnecessary transcoding.
    // If the browser doesn't support H.264, set the video codec to 'libx264'
    // or similar to transcode it to H.264 here on the server.
    "-vcodec",
    "copy",

    // AAC audio is required for Facebook Live.  No browser currently supports
    // encoding AAC, so we must transcode the audio to AAC here on the server.
    // "-acodec",
    // "aac",

    // FLV is the container format used in conjunction with RTMP
    "-f",
    "flv",

    // The output RTMP URL.
    // For debugging, you could set this to a filename like 'test.flv', and play
    // the resulting file with VLC.  Please also read the security considerations
    // later on in this tutorial.
    "test.flv",
  ]);

  // If FFmpeg stops for any reason, close the WebSocket connection.
  ffmpeg.on("close", (code, signal) => {
    console.log(
      "FFmpeg child process closed, code " + code + ", signal " + signal
    );
    // ws.terminate();
  });

  // Handle STDIN pipe errors by logging to the console.
  // These errors most commonly occur when FFmpeg closes and there is still
  // data to write.  If left unhandled, the server will crash.
  ffmpeg.stdin.on("error", (e) => {
    console.log("FFmpeg STDIN Error", e);
  });

  // FFmpeg outputs all of its messages to STDERR.  Let's log them to the console.
  ffmpeg.stderr.on("data", (data) => {
    console.log("FFmpeg STDERR:", data.toString());
  });

  socket.on("message", (msg) => {
    console.log("Writing blob! ");
    if (!ok) return;
    ffmpeg.stdin.write(msg);
    // fileStream.write(Buffer.from(new Uint8Array(msg)));
    // buffer.push(msg);
    // fileStream.write(Buffer.from(msg, "base64"));
    // fs.appendFile("./video.webm", msg, (err) => {
    //   if (err) throw err;
    //   console.log('The "data to append" was appended to file!');
    // });
  });

  socket.on("stop", () => {
    console.log("Stop recording..");
    // ffmpeg.stdin.write("q");
    // ffmpeg.save("testsaving.webm");
    ok = false;
    ffmpeg.kill("SIGINT");
    // buffer.forEach((element) => {
    //   fileStream.write(Buffer.from(new Uint8Array(element)));
    // });
    // fileStream.end();
    // fs.writeFile("./lel.webm", buffer, { encoding: "base64" }, () => {
    //   console.log("wrote");
    // });
    // fs.unlink("./tmp.webm");
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
