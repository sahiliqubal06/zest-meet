import React, { useContext, useState } from "react"; 
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { Button, IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="landingPageContainer">
      <nav>
        <h2>ZestMeet</h2>
        <div className="navlist">
          <IconButton onClick={() => navigate("/history")}>
            <RestoreIcon style={{ color: "var(--text-secondary)" }} />
          </IconButton>
          <p onClick={() => navigate("/history")}>History</p>
          <div role="button" onClick={() => {
            localStorage.removeItem("token");
            navigate("/auth");
          }}>
            <p>Logout</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            Connect, Share, <span>Collaborate</span> — The ZestMeet Way
          </h1>
          <p>
            Experience seamless video communication tailored for teamwork and real-time collaboration.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <TextField
              onChange={(e) => setMeetingCode(e.target.value)}
              id="outlined-basic"
              label="Meeting Code"
              variant="outlined"
              sx={{
                input: { color: 'white' },
                label: { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#FF9839',
                  },
                  '&:hover fieldset': {
                    borderColor: '#ff8a1a',
                  }
                }
              }}
            />
            <Button onClick={handleJoinVideoCall} variant="contained" style={{ backgroundColor: "#FF9839" }}>
              Join
            </Button>
          </div>
        </div>
        <div>
          <img srcSet="/call2.avif" alt="Video Call" />
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
