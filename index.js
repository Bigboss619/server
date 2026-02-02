import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config(); // load .env variables

const app = express();
app.use(cors()); // allow requests from frontend
app.use(bodyParser.json()); // parse JSON requests

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// --- Test endpoint ---
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// ---- CUSTOMER REGISTRATION ----
app.post("/api/customers/register", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // 1️⃣ Sign up user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    // 2️⃣ Insert user profile into user_register table
    const { error: insertError } = await supabase
      .from("user_register")
      .insert([
        {
          user_id: data.user.id,
          firstname,
          lastname,
          email,
        },
      ]);

    if (insertError) return res.status(400).json({ error: insertError.message });

    // 3️⃣ Success
    res.json({ success: true, user: data.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- CUSTOMER LOGIN ----
app.post("/api/customers/login", async (req, res) => {

    const { email, password } = req.body;

    if(!email || !password){
      return res.status(400).json({error: "Email and password are required" });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if(error){
          return res.status(401).json({ 
            success: false,
            error: "Invalid email or password"
          });
        }
        
        return res.json({
          success: true,
          user: data.user,
          session: data.session,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 
          success: false,
          error: "Internal server error"
        });
  }
});


// ---- CUSTOMER INFORMATION -----
app.get("/api/customers/profile/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error }  = await supabase
          .from("user_register")
          .select("firstname, lastname, email")
          .eq("user_id", id)
          .single();

          if(error){
            return res.status(404).json({ error: "User not found" });
          } 

          res.json({ profile: data });
    } catch (err) {
        res.status(500).json({ error: "Server error"});
    }
});

// ----AGENT REGISTRATION ---
app.post("/api/agent/register", async (req, res) => {
    const { firstname, lastname, email, password, token_code } = req.body;

    if (!firstname || !lastname || !email || !password || !token_code) {
      return res.status(400).json({ error: "All fields are required." });
    }
    // Here you can add logic to verify the token_code if needed
    try {

      // 1️⃣ Sign up user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({  
        email,
        password,
      });

      if (error) return res.status(400).json({ error: error.message });
      
      // 2️⃣ Insert user profile into agent_register table
      const { error: insertError } = await supabase
        .from("agent_register")
        .insert([
          {
            user_id: data.user.id,
            firstname,
            lastname,
            email,
            token_code,
          },
        ]);
      if (insertError) return res.status(400).json({ error: insertError.message });
      // 3️⃣ Success
      res.json({ success: true, user: data.user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    } 
});

// ---- AGENT LOGIN ----
app.post("/api/agent/login", async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password){
      return res.status(400).json({error: "Email and password are required" });
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if(error){
        return res.status(401).json({ error: "Invalid email or password"});
      }
      return res.json({
        success: true,
        user: data.user,
        session: data.session,
      }); 
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error"});
    }
  });

// ---- AGENT INFORMATION -----
app.get("/api/agent/profile/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const { data, error }  = await supabase
          .from("agent_register")
          .select("firstname, lastname, email, phone, image")
          .eq("user_id", id)
          .single();

          if(error){
            return res.status(404).json({ error: "Agent not found" });
          }
          res.json({ profile: data });
    } catch (err) {
        res.status(500).json({ error: "Server error"});
    }   
});




// --- Start the server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
