import * as net from "net";

const PORT = 3000;
const IP = "127.0.0.1";
/**
 * The backlog is a queue that the operating system manages for us with all the clients we
 * still have to process. When creating a listing socket we define how many clients there can
 * be on this queue before the system refused to connect with more clients.
 */
const BACKLOG = 100;

// listen will keep sending the socket the accept command and read everything it gets back.
net
  .createServer()
  .listen(PORT, IP, BACKLOG)
  .on("connection", (socket) => {
    // Every time a client connects the callback will be called with the client socket of that connection as a parameter.
    console.log(
      `new connection from ${socket.remoteAddress}:${socket.remotePort}`
    );

    socket.on("data", (buffer) => {
      // Convert the buffer of the data the client has sent.
      const request = buffer.toString();

      console.log(`Received Request ${request}`);

      // Write data to the socket to send data back to client.
      socket.write("hello world");

      /**
       * A last very important task is to close (end) the connection when we are done.
       * Otherwise we could end up with an overflow of open connections if the clients aren’t closing them.
       */
      socket.end();
    });
  });
