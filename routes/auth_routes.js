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

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (role === "admin") {
      if (adminSecret !== process.env.ADMIN_SIGNUP_SECRET) {
        return res
          .status(401)
          .json({ error: "Unauthorized: Invalid Admin Secret" });
      }
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!data?.user) {
      return res.status(400).json({ error: "User creation failed" });
    }

    const { error: tableError } = await supabase
      .from("myriad_users")
      .insert({
        id: data.user.id,
        name,
        email,
        role
      });

    if (tableError) {
      return res.status(400).json({ error: tableError.message });
    }

    res.status(201).json({
      message:
        "Account created successfully, please check your email for confirmation!"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   LOGIN
========================= */
const { data: tableData, error: tableError, count } = await supabase
  .from("myriad_users")
  .select("*", { count: "exact" })
  .eq("id", authData.user.id);

if (tableError) return res.status(400).json({ error: tableError.message });
if (!tableData || tableData.length === 0)
  return res.status(404).json({ error: "User not found in table" });
if (tableData.length > 1)
  return res.status(500).json({ error: "Duplicate users found in table" });

const userRecord = tableData[0];

res.json({
  message: "Login Successful",
  user: {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.role,
    avatar: userRecord.avatar
  },
  session: authData.session
});

/* =========================
   UPDATE PROFILE
========================= */

router.put("/update_profile", async (req, res) => {
  try {
    const {
      id,
      name,
      phone,
      dateOfBirth,
      stateOfOrigin,
      address,
      avatar
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { error } = await supabase
      .from("myriad_users")
      .update({
        name,
        phone,
        dateOfBirth,
        stateOfOrigin,
        address,
        avatar,
        updated_at: new Date()
      })
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   UPDATE PASSWORD
========================= */

router.put("/update_password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing password fields" });
    }

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password: currentPassword
      });

    if (signInError) {
      return res
        .status(400)
        .json({ error: "Current password is incorrect" });
    }

    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newPassword
      });

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   UPLOAD PROFILE IMAGE
========================= */

router.post(
  "/upload_profile_image",
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.body;
      const file = req.file;

      if (!file || !id) {
        return res
          .status(400)
          .json({ error: "Image file and user ID are required" });
      }

      const fileName = `${id}-${Date.now()}-${file.originalname}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype
        });

      if (uploadError) {
        return res.status(400).json({ error: uploadError.message });
      }

      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("myriad_users")
        .update({ avatar: imageUrl })
        .eq("id", id);

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      res.json({
        success: true,
        imageUrl
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;