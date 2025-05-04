import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext({});

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);

  const router = useNavigate();

  const handleRegister = async (name, username, password) => {
    try {
      let request = await client.post("/register", {
        name: name,
        username: username,
        password: password,
      });

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      let request = await client.post("/login", {
        username: username,
        password: password,
      });
      console.log(username, password);
      console.log(request.data);
      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        router("/home");
      }
    } catch (error) {
      throw error;
    }
  };

  const getUserHistory = async () => {
    try {
      let request = await client.get("/get_user_history", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      return request.data;
    } catch (error) {
      throw error;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      let request = await client.post("/add_to_history", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request.data;
    } catch (error) {
      console.error(
        "Error adding to history:",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  const data = {
    userData,
    setUserData,
    handleRegister,
    handleLogin,
    getUserHistory,
    addToUserHistory,
  };
  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
