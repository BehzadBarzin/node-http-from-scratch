import * as net from "net";

// ---------------------------------------------------------------------------

/**
 * HTTP is a standard for communicating via TCP sockets. It describes how the messages are formatted
 * and how the server should manage connections.
 *
 * An HTTP request is simply a TCP request with a predefined format for the payload.
 */

// ---------------------------------------------------------------------------

// Define an interface for an HTTP Request
export interface Request {
  protocol: string;
  method: string;
  url: string;
  headers: Map<string, string>;
  body: string;
}

/**
 * A helper string function.
 * HTTP requests are formatted as:
 * GET /path HTTP/1.1
 * header1: value
 * header2: value
 * ...
 *             <--- Empty Line
 *
 * Body
 *
 *
 * @param s - HTTP payload string to parse
 * @returns - parsed HTTP Request
 */
function parseRequest(s: string): Request {
  // Split the string on the first line
  const [firstLine, rest] = divideStringOn(s, "\r\n");
  // Split the first line into 3 parts (split on ' '): method, URL, and protocol would be returned
  const [method, url, protocol] = firstLine.split(" ", 3);

  // Split the rest of the string on an empty line (not just return): these are the headers and the rest is body
  const [headers, body] = divideStringOn(rest, "\r\n\r\n");
  // Parse the headers. Split on ":", and return them as a new map
  const parsedHeaders = headers.split("\r\n").reduce((map, header) => {
    const [key, value] = divideStringOn(header, ": ");
    return map.set(key, value);
  }, new Map());

  // Return the fully constructed Request object
  return { protocol, method, url, headers: parsedHeaders, body };
}

/**
 * Helper string function that splits a string on a search string.
 * e.g. "This is a new message." and "is" will return ["This is", " a new message."].
 */
function divideStringOn(s: string, search: string) {
  // The position of the first occurrence of 'search' in 's'.
  const index = s.indexOf(search);
  // Return the 'search' part of 's' and the rest of 's'
  const first = s.slice(0, index);
  const rest = s.slice(index + search.length);
  return [first, rest];
}

// ---------------------------------------------------------------------------

/**
 * Response is just like request.
 * It's just a TCP payload with a predefined format.
 * Example Response:
 *
 * HTTP/1.1 200 OK
 * Content-Type: application/text
 *               <--- Empty Line
 * <html>
 *   <body>
 *     <h1>Greetings!</h1>
 *   </body>
 * </html>
 */

// Define an interface for an HTTP Response
export interface Response {
  status: string;
  statusCode: number;
  protocol: string;
  headers: Map<string, string>;
  body: string;
}

function compileResponse(r: Response): string {
  const headersString = Array.from(r.headers)
    .map((kv) => `${kv[0]}: ${kv[1]}`)
    .join("\r\n");
  // Construct the response string (notice the empty line before body and other spacing)
  return `${r.protocol} ${r.statusCode} ${r.status};

${r.body}`;
}

// ---------------------------------------------------------------------------
// TCP/HTTP Server:

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
    console.clear();
    // Every time a client connects the callback will be called with the client socket of that connection as a parameter.
    console.log(
      `new connection from ${socket.remoteAddress}:${socket.remotePort}`
    );

    // When data arrives from client
    socket.on("data", (buffer) => {
      // Convert the buffer of the data the client has sent.
      const request = buffer.toString();

      console.log(`Received Request ${request}`);

      // ⭐ First construct the response payload (string)
      // Here instead of a simple string we'll send back an HTTP formatted string.
      const dataString = JSON.stringify({ name: "john", age: 28 });
      const headersMap = new Map();
      headersMap.set("Content-Type", "application/json");
      headersMap.set("Content-Length", dataString.length);

      const responseString = compileResponse({
        protocol: "HTTP/1.1",
        headers: headersMap,
        status: "OK",
        statusCode: 200,
        body: dataString,
      });

      // ⭐ Write data to the socket to send data back to client.
      socket.write(responseString);

      /**
       * A last very important task is to close (end) the connection when we are done.
       * Otherwise we could end up with an overflow of open connections if the clients aren’t closing them.
       */
      socket.end();
    });
  });
