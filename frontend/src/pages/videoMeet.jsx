import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/videoComponent.module.css";
import { Badge, Button, IconButton, TextField } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

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
  const [screen, setScreen] = useState();
  const [showModal, setShowModal] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState(""); // Fixed: Now correctly stores the chat message
  const [newMessage, setNewMessage] = useState(3);

  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState(""); // Fixed: Now correctly stores the username
  const [videos, setVideos] = useState([]);

  //  Added more robust logging to help debug connection issues
  const logConnection = (message, data) => {
    console.log(`[Connection] ${message}`, data || "");
  };

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
        //  More robust stream handling with logging
        logConnection(`Adding stream to peer: ${id}`);

        // Try modern addTrack first
        try {
          stream.getTracks().forEach((track) => {
            connectionsRef.current[id].addTrack(track, stream);
          });
        } catch (trackError) {
          logConnection(
            `Error with addTrack, falling back to addStream: ${trackError.message}`
          );
          connectionsRef.current[id].addStream(stream);
        }

        connectionsRef.current[id].createOffer().then((description) => {
          connectionsRef.current[id]
            .setLocalDescription(description)
            .then(() => {
              logConnection(`Sending offer to: ${id}`);
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

  //  Enhanced message handling with more debugging
  const gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);
    logConnection(`Got signal from ${fromId}`, signal);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connectionsRef.current[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            logConnection(`Set remote description for: ${fromId}`);
            if (signal.sdp.type === "offer") {
              logConnection(`Creating answer for: ${fromId}`);
              connectionsRef.current[fromId]
                .createAnswer()
                .then((description) => {
                  connectionsRef.current[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      logConnection(`Sending answer to: ${fromId}`);
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
        logConnection(`Adding ICE candidate from: ${fromId}`, signal.ice);
        connectionsRef.current[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((error) => console.log("ICE error:", error));
      }
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessage((prevMessages) => prevMessages + 1);
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, {
      secure: false,
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      logConnection("Connected with ID:", socketIdRef.current);

      socketRef.current.emit("join-call", window.location.href);

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        logConnection("User left:", id);

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
        logConnection("User joined:", id);
        logConnection("All clients:", clients);

        clients.forEach((socketListId) => {
          // Skip if this is our own socket ID to avoid duplication
          if (socketListId === socketIdRef.current) {
            logConnection("Skipping own socket ID:", socketListId);
            return;
          }

          // Skip if we already have a connection to this client
          if (connectionsRef.current[socketListId]) {
            logConnection("Connection already exists:", socketListId);
            return;
          }

          logConnection("Creating new connection:", socketListId);
          connectionsRef.current[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );

          connectionsRef.current[socketListId].onicecandidate = (event) => {
            if (event.candidate !== null) {
              logConnection(
                `Sending ICE candidate to: ${socketListId}`,
                event.candidate
              );
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          //  Enhanced ontrack handling to ensure we see remote videos
          connectionsRef.current[socketListId].ontrack = (event) => {
            const stream = event.streams[0];
            logConnection(`Received track from: ${socketListId}`, {
              kind: event.track.kind,
              streamId: stream.id,
            });

            // Check if we already have this video in our list
            setVideos((prevVideos) => {
              // Check if the video already exists
              const videoExists = prevVideos.some(
                (v) => v.socketId === socketListId
              );

              if (videoExists) {
                logConnection(`Video already exists for: ${socketListId}`);
                // Update the stream if it's different
                return prevVideos.map((v) =>
                  v.socketId === socketListId ? { ...v, stream } : v
                );
              } else {
                logConnection(`Adding new video for: ${socketListId}`);
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
            logConnection(
              `Received stream from (onaddstream): ${socketListId}`
            );
            const stream = event.stream;

            // Check if we already have this video in our list
            setVideos((prevVideos) => {
              const videoExists = prevVideos.some(
                (v) => v.socketId === socketListId
              );

              if (videoExists) {
                logConnection(
                  `Video already exists (onaddstream): ${socketListId}`
                );
                return prevVideos.map((v) =>
                  v.socketId === socketListId ? { ...v, stream } : v
                );
              } else {
                logConnection(
                  `Adding new video (onaddstream): ${socketListId}`
                );
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
              logConnection(`Adding local tracks to peer: ${socketListId}`);
              // First try modern addTrack method
              window.localStream.getTracks().forEach((track) => {
                connectionsRef.current[socketListId].addTrack(
                  track,
                  window.localStream
                );
              });
            } catch (error) {
              logConnection(
                `Error with addTrack, falling back to addStream: ${error.message}`
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
            logConnection("No local stream to add");
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
          logConnection("I'm the joiner, creating offers");
          for (let id2 in connectionsRef.current) {
            if (id2 === socketIdRef.current) continue;

            try {
              connectionsRef.current[id2].createOffer().then((description) => {
                connectionsRef.current[id2]
                  .setLocalDescription(description)
                  .then(() => {
                    logConnection(`Sending initial offer to: ${id2}`);
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

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let handleScreen = () => {
    setScreen(!screen);
  };

  // Fixed getDisplayMedia to properly share screen with other participants
  let getDisplayMedia = () => {
    if (navigator.mediaDevices.getDisplayMedia) {
      logConnection("Requesting screen sharing");
      navigator.mediaDevices
        .getDisplayMedia({ video: true, audio: true })
        .then(getDisplayMediaSuccess)
        .catch((error) => {
          logConnection("Error getting display media:", error.message);
          // Reset screen state if user cancels
          setScreen(false);
        });
    }
  };

  //  Improved useEffect for screen state
  useEffect(() => {
    if (screen) {
      logConnection("Screen sharing turned on, getting display media");
      getDisplayMedia();
    }
  }, [screen]);

  //  Completely revised getDisplayMediaSuccess for proper screen sharing
  let getDisplayMediaSuccess = (stream) => {
    logConnection("Got display media stream", {
      tracks: stream.getTracks().length,
      types: stream.getTracks().map((t) => t.kind),
    });

    try {
      if (window.localStream) {
        logConnection("Stopping existing tracks");
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      console.log("Error stopping tracks:", error);
    }

    window.localStream = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Notify all peers about the new stream
    for (let id in connectionsRef.current) {
      if (id === socketIdRef.current) continue;

      logConnection(`Updating connection ${id} with screen share stream`);

      try {
        // First try to remove existing tracks
        const senders = connectionsRef.current[id].getSenders();
        senders.forEach((sender) => {
          logConnection(`Removing track from peer: ${id}`, sender.track?.kind);
          if (sender.track) {
            try {
              connectionsRef.current[id].removeTrack(sender);
            } catch (e) {
              logConnection(`Error removing track: ${e.message}`);
            }
          }
        });

        // Then add the new tracks
        stream.getTracks().forEach((track) => {
          logConnection(`Adding screen track to peer: ${id}`, track.kind);
          try {
            connectionsRef.current[id].addTrack(track, stream);
          } catch (e) {
            logConnection(`Error adding track: ${e.message}`);
          }
        });
      } catch (trackError) {
        logConnection(`Error with track management: ${trackError.message}`);

        // Fallback to the older addStream method
        try {
          // For some browsers we might need to first remove the existing stream
          try {
            const streams = connectionsRef.current[id].getLocalStreams();
            streams.forEach((s) => {
              connectionsRef.current[id].removeStream(s);
            });
          } catch (e) {
            // Ignore errors, not all browsers support removeStream
          }

          connectionsRef.current[id].addStream(stream);
          logConnection(`Used fallback addStream for: ${id}`);
        } catch (streamError) {
          logConnection(`All stream methods failed: ${streamError.message}`);
        }
      }

      // Always create a new offer after changing the stream
      try {
        connectionsRef.current[id]
          .createOffer()
          .then((description) => {
            connectionsRef.current[id]
              .setLocalDescription(description)
              .then(() => {
                logConnection(`Sending updated offer to: ${id}`);
                socketRef.current.emit(
                  "signal",
                  id,
                  JSON.stringify({
                    sdp: connectionsRef.current[id].localDescription,
                  })
                );
              })
              .catch((error) =>
                logConnection(
                  `Error setting local description: ${error.message}`
                )
              );
          })
          .catch((error) =>
            logConnection(`Error creating offer: ${error.message}`)
          );
      } catch (offerError) {
        logConnection(`Failed to create offer: ${offerError.message}`);
      }
    }

    // Set up event handlers for when screen sharing ends
    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          logConnection("Screen sharing track ended");
          setScreen(false);

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

          // Resume camera after screen sharing ends
          getUserMedia();
        })
    );
  };

  //  Chat message sending functionality
  let sendMessage = () => {
    if (message.trim() !== "") {
      socketRef.current.emit("chat-message", message, username);
      setMessage("");
      // Add the message locally as well to show immediately
      addMessage(message, username, socketIdRef.current);
    }
  };

  //  Handle pressing Enter key in chat input
  const handleMessageKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  let routeTo = useNavigate();

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (error) {}
    routeTo("/home");
  };

  return (
    <div>
      {askForUsername === true ? (
        <div className={styles.loginContainer}>
          <h2>Enter into Lobby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username} //  Using the correct state variable
            onChange={(e) => setUsername(e.target.value)} // FIXED: Setting the username
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            onClick={connect}
            disabled={!username.trim()} // Disable button if username is empty
            className={styles.connectButton}
          >
            Connect
          </Button>
          <div className={styles.previewVideo}>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal ? (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1 className={styles.chatHeader}>Chat</h1>

                {/*  Improved chat display area */}
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => {
                      const isMyMessage = item.sender === username;
                      return (
                        <div
                          key={index}
                          className={`${styles.messageItem} ${
                            isMyMessage ? styles.myMessage : styles.otherMessage
                          }`}
                        >
                          <p className={styles.messageSender}>{item.sender}</p>
                          <p className={styles.messageContent}>{item.data}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className={styles.noMessages}>No messages yet</p>
                  )}
                </div>

                {/*  Improved chat input area */}
                <div className={styles.chattingArea}>
                  <TextField
                    id="outlined-basic"
                    label="Message"
                    variant="outlined"
                    value={message} //  Using the correct state variable
                    onChange={(e) => setMessage(e.target.value)} // Setting the message
                    onKeyPress={handleMessageKeyPress} //  Added Enter key handling
                    fullWidth
                  />
                  <Button
                    variant="contained"
                    onClick={sendMessage}
                    disabled={!message.trim()} // Disable send button if message is empty
                    className={styles.sendButton}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}
          <div className={styles.butttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? (
                  <ScreenShareIcon />
                ) : (
                  <StopScreenShareIcon />
                )}
              </IconButton>
            ) : (
              <></>
            )}

            <Badge badgeContent={newMessage} max={999} color="secondary">
              <IconButton
                onClick={() => {
                  setShowModal(!showModal);
                  setNewMessage(0); // Reset new message counter when opening chat
                }}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <video
            className={styles.meetUserVideo}
            ref={localVideoRef}
            autoPlay
            muted
          ></video>

          {/* Enhanced video container for better remote video display */}
          <div className={styles.conferenceView}>
            {videos.map((video, index) => (
              <div
                key={`${video.socketId}-${index}`}
                className={styles.remoteVideo}
              >
                <video
                  className={styles.userVideo}
                  data-socket={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) {
                      // Only set srcObject if it's a different stream
                      if (ref.srcObject !== video.stream) {
                        ref.srcObject = video.stream;
                        logConnection(
                          `Set remote video stream for: ${video.socketId}`
                        );
                      }
                    }
                  }}
                  autoPlay
                  playsInline
                ></video>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
