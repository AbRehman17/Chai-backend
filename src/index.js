//require("dotenv").config({ path: "./.env" });
import "dotenv/config";
import connectDB from "./db/dbConnection.js";
connectDB();

//import mongoose from "mongoose";
//import { DB_NAME } from "./constants.js";
/*
import express from "express";
const app = express();
async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
    app.on("error", (err) => {
      console.log("Error connecting to MongoDB:", err);
      throw err;
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
    throw err;
  }
};
*/
