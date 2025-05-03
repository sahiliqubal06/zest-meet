import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import HomeIcon from "@mui/icons-material/Home";
import { IconButton } from "@mui/material";

export default function History() {
  const { getUserHistory } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getUserHistory();
        setMeetings(history);
      } catch (error) {
        console.log(error);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#121212",
        padding: "1rem",
        color: "white",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <IconButton
        onClick={() => routeTo("/home")}
        style={{ marginBottom: "1rem" }}
      >
        <HomeIcon style={{ color: "#FF9839" }} />
      </IconButton>

      <div style={{ width: "100%", maxWidth: "600px" }}>
        {meetings.length !== 0 ? (
          meetings.map((e, i) => (
            <Card
              key={i}
              variant="outlined"
              style={{
                marginBottom: "1rem",
                backgroundColor: "#1e1e1e",
                borderColor: "#FF9839",
                color: "white",
              }}
            >
              <CardContent>
                <Typography
                  sx={{ fontSize: 14 }}
                  style={{ color: "#ccc" }}
                  gutterBottom
                >
                  Code: {e.meetingCode}
                </Typography>
                <Typography sx={{ mb: 1.5 }} style={{ color: "#aaa" }}>
                  Date: {formatDate(e.date)}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography style={{ color: "#ccc", textAlign: "center" }}>
            No meeting history available.
          </Typography>
        )}
      </div>
    </div>
  );
}
