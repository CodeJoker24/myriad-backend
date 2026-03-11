const express = require("express");
const router = express.Router();
const supabase = require("../lib/db");
require("dotenv").config();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* =========================
   SIGNUP
========================= */
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

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return res.status(400).json({ error: signInError.message });

    // fetch user table record
    const { data: userRecord, error: tableError } = await supabase
      .from("myriad_users")
      .select("*")
      .eq("id", authData.user.id)
      .single(); // SINGLE is critical

    if (tableError) return res.status(400).json({ error: tableError.message });

    res.json({
      message: "Login Successful",
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        avatar: userRecord.avatar || null
      },
      session: authData.session
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   UPDATE PROFILE
========================= */
router.put("/update_profile", async (req, res) => {
  try {
    const { id, name, phone, dateOfBirth, stateOfOrigin, address, avatar } = req.body;
    if (!id) return res.status(400).json({ error: "User ID is required" });

    const { error } = await supabase.from("myriad_users").update({
      name, phone, dateOfBirth, stateOfOrigin, address, avatar, updated_at: new Date()
    }).eq("id", id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   UPDATE PASSWORD
========================= */
router.put("/update_password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) return res.status(400).json({ error: "Missing password fields" });

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) return res.status(400).json({ error: "Current password is incorrect" });

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) return res.status(400).json({ error: updateError.message });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   UPLOAD PROFILE IMAGE
========================= */
router.post("/upload_profile_image", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.body;
    const file = req.file;
    if (!file || !id) return res.status(400).json({ error: "Image file and user ID required" });

    const fileName = `${id}-${Date.now()}-${file.originalname}`;
    const { error: uploadError } = await supabase.storage.from("profile-images").upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadError) return res.status(400).json({ error: uploadError.message });

    const { data } = supabase.storage.from("profile-images").getPublicUrl(fileName);
    const imageUrl = data.publicUrl;

    const { error: updateError } = await supabase.from("myriad_users").update({ avatar: imageUrl }).eq("id", id);
    if (updateError) return res.status(400).json({ error: updateError.message });

    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;