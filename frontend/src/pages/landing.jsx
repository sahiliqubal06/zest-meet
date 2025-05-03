import React from "react";
import "../App.css";
import { Link, useNavigate } from "react-router-dom";
import { Box, Container, Typography, IconButton } from "@mui/material";
import { Twitter, Instagram, LinkedIn } from "@mui/icons-material";

export default function landing() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>ZestMeet</h2>
        </div>
        <div className="navlist">
          <p
            onClick={() => {
              router("/a45csx");
            }}
          >
            Join as Guest
          </p>
          <p
            onClick={() => {
              router("/auth");
            }}
          >
            Register
          </p>
          <div
            onClick={() => {
              router("/auth");
            }}
            role="button"
          >
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            Bringing You Closer,{" "}
            <span style={{ color: "#FF9839" }}>Virtually</span>
          </h1>
          <p>
            {" "}
            Join seamless video calls and real-time chat with friends, family,
            or your team — all in one platform.
          </p>
          <div role="button">
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/call.png" alt="" />
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
