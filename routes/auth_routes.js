const express = require("express");
const router = express.Router();
const supabse = require("../lib/db");

router.post("/signup", async(req, res)=>{
    try{
        const {name, email, password} = req.body;
        const {data, error:authError} = await supabse.auth.signUp({
            email,
            password
        })
        if(authError) return res.status(400).json
        ({error:authError.message})

        const {error:tableError} = await supabse.from("myriad_users").insert({
        id:data.user.id,
        name,
        email
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


module.exports = router;