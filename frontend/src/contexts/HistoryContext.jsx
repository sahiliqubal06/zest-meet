import React, { createContext } from "react";
import axios from "axios";

export const HistoryContext = createContext({});

const client = axios.create({
  baseURL: "http://localhost:8000/api/v1/users",
});

export const HistoryProvider = ({ children }) => {
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
      throw error;
    }
  };

  const data = {
    getUserHistory,
    addToUserHistory,
  };

  return (
    <HistoryContext.Provider value={data}>{children}</HistoryContext.Provider>
  );
};
