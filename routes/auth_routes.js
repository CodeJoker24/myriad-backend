const express = require("express");
const router = express.Router();
const supabase = require("../lib/db");
require("dotenv").config();




router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role, adminSecret } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Missing required fields" });

    if (role === "admin" && adminSecret !== process.env.ADMIN_SIGNUP_SECRET)
      return res.status(401).json({ error: "Unauthorized: Invalid Admin Secret" });

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } }
    });

    if (authError) return res.status(400).json({ error: authError.message });
    if (!authData?.user) return res.status(400).json({ error: "User creation failed" });

    const { error: tableError } = await supabase.from("myriad_users").insert({
      id: authData.user.id,
      name,
      email,
      role
    });

    if (tableError) return res.status(400).json({ error: tableError.message });

    res.status(201).json({ message: "Account created. Check email for confirmation!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return res.status(400).json({ error: signInError.message });

    const { data: userRecord, error: tableError } = await supabase
      .from("myriad_users")
      .select("*")
      .eq("id", authData.user.id)
      .single(); 

    if (tableError) return res.status(400).json({ error: tableError.message });

    res.json({
      message: "Login Successful",
      user: userRecord,
      session: authData.session
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/update-profile/:id", async (req, res) => {
 console.log("DEBUG - Body Received:", req.body);
  try {
    const { id } = req.params;
    
    // 1. MAKE SURE profile_image is in this list!
    const { 
      name, 
      phone, 
      dateOfBirth, 
      stateOfOrigin, 
      address, 
      profile_image 
    } = req.body;

    // 2. MAKE SURE profile_image is inside this .update() object!
    const { data, error } = await supabase
      .from("myriad_users")
      .update({ 
        name, 
        phone, 
        dateOfBirth, 
        stateOfOrigin, 
        address, 
        profile_image // <--- THIS IS THE KEY
      })
      .eq("id", id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      message: "Profile updated successfully",
      user: data[0] 
    });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});



module.exports = router;