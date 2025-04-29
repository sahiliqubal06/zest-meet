import React from "react";
import "../App.css";
import { Link } from "react-router-dom";

export default function landing() {
  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>ZestMeet</h2>
        </div>
        <div className="navlist">
          <p>Join as Guest</p>
          <p>Register</p>
          <div role="button">
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
            <Link to={"/home"}>Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/call.png" alt="" />
        </div>
      </div>
    </div>
  );
}
