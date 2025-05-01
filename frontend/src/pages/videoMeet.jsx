import React, { useEffect, useRef, useState } from "react";
import "../styles/videoComponent.css";
import { Button, TextField } from "@mui/material";
import io from "socket.io-client";

const server_url = "http://localhost:8000";

// Using ref for connections to maintain across renders
const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export default function VideoMeetComponent() {
  const connectionsRef = useRef({});
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(false);
  const [audio, setAudio] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState(false);

  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getPermissions();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Close all peer connections
      Object.values(connectionsRef.current).forEach((connection) => {
        if (connection) {
          connection.close();
        }
      });

      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      console.log(error);
    }

    window.localStream = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    for (let id in connectionsRef.current) {
      if (id === socketIdRef.current) continue;

      try {
        connectionsRef.current[id].addStream(window.localStream);

        connectionsRef.current[id].createOffer().then((description) => {
          connectionsRef.current[id]
            .setLocalDescription(description)
            .then(() => {
              socketRef.current.emit(
                "signal",
                id,
                JSON.stringify({
                  sdp: connectionsRef.current[id].localDescription,
                })
              );
            })
            .catch((error) => console.log(error));
        });
      } catch (error) {
        console.log("Error adding stream:", error);
      }
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (error) {
            console.log(error);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = window.localStream;
          }

          for (let id in connectionsRef.current) {
            connectionsRef.current[id].addStream(window.localStream);
            connectionsRef.current[id].createOffer().then((description) => {
              connectionsRef.current[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({
                      sdp: connectionsRef.current[id].localDescription,
                    })
                  );
                })
                .catch((error) => console.log(error));
            });
          }
        })
    );
  };

  const silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();

    let dst = oscillator.connect(ctx.createMediaStreamDestination());

    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 600, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });

    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((error) => console.log(error));
    } else {
      try {
        if (localVideoRef.current && localVideoRef.current.srcObject) {
          let tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        }
      } catch (error) {
        console.log("Error stopping tracks:", error);
      }
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  const gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connectionsRef.current[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connectionsRef.current[fromId]
                .createAnswer()
                .then((description) => {
                  connectionsRef.current[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connectionsRef.current[fromId].localDescription,
                        })
                      );
                    })
                    .catch((error) => console.log(error));
                })
                .catch((error) => console.log(error));
            }
          })
          .catch((error) => console.log(error));
      }
      if (connectionsRef.current[fromId] && signal.ice) {
        connectionsRef.current[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((error) => console.log("ICE error:", error));
      }
    }
  };

  const addMessage = () => {
    // Implement if needed
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, {
      secure: false,
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      console.log("Connected with ID:", socketIdRef.current);

      socketRef.current.emit("join-call", window.location.href);

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        console.log("User left:", id);

        // Remove the video from state
        setVideos((prevVideos) =>
          prevVideos.filter((video) => video.socketId !== id)
        );

        // Close and remove the connection
        if (connectionsRef.current[id]) {
          connectionsRef.current[id].close();
          delete connectionsRef.current[id];
        }
      });

      socketRef.current.on("user-joined", (id, clients) => {
        console.log("User joined:", id);
        console.log("All clients:", clients);

        clients.forEach((socketListId) => {
          // Skip if this is our own socket ID to avoid duplication
          if (socketListId === socketIdRef.current) {
            console.log("Skipping own socket ID:", socketListId);
            return;
          }

          // Skip if we already have a connection to this client
          if (connectionsRef.current[socketListId]) {
            console.log("Connection already exists:", socketListId);
            return;
          }

          console.log("Creating new connection:", socketListId);
          connectionsRef.current[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );

          connectionsRef.current[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          connectionsRef.current[socketListId].ontrack = (event) => {
            const stream = event.streams[0];
            console.log("Received track from:", socketListId);

            // Check if we already have this video in our list
            setVideos((prevVideos) => {
              // Check if the video already exists
              const videoExists = prevVideos.some(
                (v) => v.socketId === socketListId
              );

              if (videoExists) {
                console.log("Video already exists for:", socketListId);
                return prevVideos;
              } else {
                console.log("Adding new video for:", socketListId);
                return [
                  ...prevVideos,
                  {
                    socketId: socketListId,
                    stream,
                    autoPlay: true,
                    playsinline: true,
                  },
                ];
              }
            });
          };

          // Also listen for the older onaddstream event for compatibility
          connectionsRef.current[socketListId].onaddstream = (event) => {
            console.log("Received stream from:", socketListId);
            const stream = event.stream;

            // Check if we already have this video in our list
            setVideos((prevVideos) => {
              const videoExists = prevVideos.some(
                (v) => v.socketId === socketListId
              );

              if (videoExists) {
                console.log(
                  "Video already exists (onaddstream):",
                  socketListId
                );
                return prevVideos;
              } else {
                console.log("Adding new video (onaddstream):", socketListId);
                return [
                  ...prevVideos,
                  {
                    socketId: socketListId,
                    stream,
                    autoPlay: true,
                    playsinline: true,
                  },
                ];
              }
            });
          };

          // Add local stream to the new connection
          if (window.localStream) {
            try {
              // First try modern addTrack method
              window.localStream.getTracks().forEach((track) => {
                connectionsRef.current[socketListId].addTrack(
                  track,
                  window.localStream
                );
              });
            } catch (error) {
              console.log(
                "Error with addTrack, falling back to addStream:",
                error
              );
              // Fall back to legacy addStream method
              try {
                connectionsRef.current[socketListId].addStream(
                  window.localStream
                );
              } catch (streamError) {
                console.log("Error with addStream:", streamError);
              }
            }
          } else {
            console.log("No local stream to add");
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            try {
              connectionsRef.current[socketListId].addStream(
                window.localStream
              );
            } catch (error) {
              console.log("Error adding fallback stream:", error);
            }
          }
        });

        // If we're the joinee (not the joiner), create offers for all peers
        if (id === socketIdRef.current) {
          console.log("I'm the joiner, creating offers");
          for (let id2 in connectionsRef.current) {
            if (id2 === socketIdRef.current) continue;

            try {
              connectionsRef.current[id2].createOffer().then((description) => {
                connectionsRef.current[id2]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      id2,
                      JSON.stringify({
                        sdp: connectionsRef.current[id2].localDescription,
                      })
                    );
                  })
                  .catch((error) => console.log(error));
              });
            } catch (error) {
              console.log("Error creating offer:", error);
            }
          }
        }
      });
    });
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h2>Enter into Lobby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>
          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <>
          <video ref={localVideoRef} autoPlay muted></video>

          {videos.map((video, index) => (
            <div key={`${video.socketId}-${index}`}>
              <h2>{video.socketId}</h2>
              <video
                data-socket={video.socketId}
                ref={(ref) => {
                  if (ref && video.stream) {
                    // Only set srcObject if it's a different stream
                    if (ref.srcObject !== video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }
                }}
                autoPlay
              ></video>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
