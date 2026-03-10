const express = require("express");
const router = express.Router();
const supabse = require("../lib/db");
require("dotenv").config();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage});

router.post("/signup", async(req, res)=>{
    try{
        const {name, email, password, role, adminSecret} = req.body;
        if(role === 'admin'){
            if(adminSecret !=process.env.ADMIN_SIGNUP_SECRET){
                return res.status(401).json({ error: "Unauthorized: Invalid Admin Secret" });
            }
        }
        const {data, error:authError} = await supabse.auth.signUp({
            email,
            password, 
            options:{
                data:{
                    full_name:name,
                    role:role
                }
            }
        })
        if(authError) return res.status(400).json
        ({error:authError.message})

        const {error:tableError} = await supabse.from("myriad_users").insert({
        id:data.user.id,
        name,
        email,
        role:role
        });

        if(tableError) return res.status(400).json
        ({error:tableError.message});

        res.status(201).json({message:"Account created successfully, please check your email for confirmation!"});
    }
    catch(error){
        return res.status(500).json({
            error:error.message
        });
    }
});



router.post("/login", async(req, res)=>{
    try{
        const {email, password} = req.body;
        const {data:authData, error} = await supabse.auth.signInWithPassword({
            email, 
            password
        })

        if(error){
            if(error.message == "Email not confirmed"){
                res.status(400).json({error:"Chech your email for Confirmation"})
                return;
            }
            return res.status(400).json({error:error.message});
        }

        const {data:tableData} = await supabse.from("myriad_users").select("*")
        .eq("id", authData.user.id)
        .single()

        res.json({
            message:"Login Successful",
            user:{
                id:tableData.id,
                email:tableData.email,
                name:tableData.name,
                role:tableData.role
            },
            session:authData.session
        })
    }
    catch(error){
        return res.status(500).json({
            error:error.message
        })
    }
})



router.put("/update_profile", async (req, res) => {
  try {
    const { email, name, phone, dateOfBirth, stateOfOrigin, address } = req.body;

    const { error } = await supabse
      .from("myriad_users")
      .update({
        name,
        phone,
        dateOfBirth,
        stateOfOrigin,
        address,
        updated_at: new Date()
      })
      .eq("email", email);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.put("/update_password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    
    const { data: authData, error: signInError } = await supabse.auth.signInWithPassword({
      email,
      password: currentPassword
    });

    if (signInError) return res.status(400).json({ error: "Current password is incorrect" });

   
    const { data, error: updateError } = await supabse.auth.updateUser({
      password: newPassword
    });

    if (updateError) return res.status(400).json({ error: updateError.message });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.post("/upload_profile_image", upload.single("image"), async (req, res) => {
  try {
    const { email } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const fileName = `${Date.now()}-${file.originalname}`;

    const { data, error } = await supabse.storage
      .from("profile-images")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype
      });

    if (error) return res.status(400).json({ error: error.message });

    const { data: publicUrl } = supabse
      .storage
      .from("profile-images")
      .getPublicUrl(fileName);

    const imageUrl = publicUrl.publicUrl;

    await supabse
      .from("myriad_users")
      .update({ avatar: imageUrl })
      .eq("email", email);

    res.json({
      success: true,
      imageUrl
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;