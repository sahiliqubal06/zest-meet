import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import {
  Button,
  IconButton,
  TextField,
  Box,
  Container,
  Typography,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";
import { Twitter, Instagram, LinkedIn } from "@mui/icons-material";

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
          <div
            role="button"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
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
            Experience seamless video communication tailored for teamwork and
            real-time collaboration.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            <TextField
              onChange={(e) => setMeetingCode(e.target.value)}
              id="outlined-basic"
              label="Meeting Code"
              variant="outlined"
              sx={{
                input: { color: "white" },
                label: { color: "white" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#FF9839",
                  },
                  "&:hover fieldset": {
                    borderColor: "#ff8a1a",
                  },
                },
              }}
            />
            <Button
              onClick={handleJoinVideoCall}
              variant="contained"
              style={{ backgroundColor: "#FF9839" }}
            >
              Join
            </Button>
          </div>
        </div>
        <div>
          <img srcSet="/call2.avif" alt="Video Call" />
        </div>
      </div>
      <Box
        component="footer"
        sx={{
          background: "var(--glass-effect)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          color: "white",
          py: 2,
          mt: "auto",
          textAlign: "center",
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2">
            © {new Date().getFullYear()} ZestMeet. All rights reserved.
            <br />
            Developed and designed by Sahil Iqubal
          </Typography>
          <Box sx={{}}>
            <IconButton
              href="https://x.com/itsiqubal"
              target="_blank"
              sx={{ color: "#1DA1F2" }}
            >
              <Twitter />
            </IconButton>
            <IconButton
              href="https://www.instagram.com/sahiliqubal06"
              target="_blank"
              sx={{ color: "#E1306C" }}
            >
              <Instagram />
            </IconButton>
            <IconButton
              href="https://www.linkedin.com/in/sahil-iqubal-2492871b5"
              target="_blank"
              sx={{ color: "#0077B5" }}
            >
              <LinkedIn />
            </IconButton>
          </Box>
        </Container>
      </Box>
    </div>
  );
}

export default withAuth(HomeComponent);
