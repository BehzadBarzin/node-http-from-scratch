import * as net from "net";

const IP = "127.0.0.1";
const PORT = 3000;

// Make a TCP request to localhost 3000
let client = new net.Socket();
client.connect(PORT, IP, () => {
  console.log("Connected");

  client.on("data", (buffer) => {
    // Convert the buffer of the data the server has sent.
    const response = buffer.toString();

    console.log(`Received Response ${response}`);
  });

  //This will send a message to the server using TCP
  client.write("Hello from Client");
  client.end();
});
