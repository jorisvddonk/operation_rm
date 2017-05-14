# System architecture

Operation RM consists of two main pieces of software:

* The backend
* The Client

# Backend

The backend of Operation RM has the following responsibilities:

* Provide a REST API for exploring a filesystem.
* Transcode and stream videos to the Client.
* Resize and serve images to the Client.
* Act as webserver for the Client files.
* Send system information (hostname, load average, available free memory) to the Client in realtime, for 'authenticity'.

The backend has a single file associated with it: `server.js`.

# Client

The Client of Operation RM is a game implemented using WebGL/Canvas and HTML/CSS, which uses the backend for (file)system access. The main entry points of the Client are `client/index.html` and `client/index.js`.