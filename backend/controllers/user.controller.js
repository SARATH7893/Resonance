import User from "../models/user.model.js"
import Profile from "../models/profile.model.js"
import bcrypt from 'bcrypt'
import crypto from 'crypto'

export const register=async (req,res)=>{
    try{
        const {name,email,password,username}=req.body;
        
        if(!name||!email||!password||!username){
            return res.status(400).json({message:"Please fill in all fields"})
        }
        
        const user=await User.findOne({
            email
        })

        if(user){
            return res.status(400).json({message:"user already exists"})
        }

        const hashedPassword=await bcrypt.hash(password,10);

        const newUser=new User({
            name,
            email,
            password:hashedPassword,
            username
        })  
        await newUser.save();
        
        const profile=new Profile({
            userId:newUser._id
        })

        await profile.save();
        return res.json({message:"user created successfully"})

    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

export const login=async (req,res)=>{
    try{
        const {email,password}=req.body;
    if(!email ||!password) return res.status(400).json({message:"all fields are required"})
        const user= await User.findOne({
            email
        })

        if(!user) return res.status(404).json({message:"user not registered"})

        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch) return res.status(400).json({message:"invalid password"})
        
        const token =crypto.randomBytes(32).toString("hex")
        await User.updateOne({_id:user._id},{token})
        return res.json({message:"logged in successfully",token})

    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

export const uploadProfilePicture=async (req,res)=>{
    try{
        const {token}=req.body;
        const user=await User.findOne({
            token:token
        })

        if(!user) return res.status(404).json({message:"user not found"})
            console.log(req.file.filename)
        user.profilePicture=req.file.filename
        await user.save()
        return res.json({message:"profile picture uploaded successfully"})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

export const updateUserProfile=async (req,res)=>{

    try{
        const {token,...newUserdata}=req.body;
        const user=await User.findOne({
            token:token
        })
        if(!user) return res.status(404).json({message:"user not found"})
        const {username,email}=newUserdata;
        const existingUser=await User.findOne({$or:[{username},{email}]});
        if(existingUser){
            if(existingUser || String(existingUser._id)!==String(user._id)){
                return res.status(400).json({message:"user already exists"})
            }
        }

        Object.assign(user,newUserdata);
        await user.save();
        return res.json({message:"user updated"})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
}


export const getUserAndProfile= async(req,res)=>{
    try{
        const {token}=req.body;

        const user=await User.findOne({token:token})
        if(!user) return res.status(404).json({message:"user not found"})
        
        const userProfile=await Profile.findOne({userId:user._id}).populate('userId','name email username profilePicture')
        return res.json(userProfile)
        

    }catch(err){
        return res.status(500).json({message:err.message})
    }
}

export  const updateProfileData=async (req,res)=>{
    try{
            const {token,...newProfileData}=req.body;
            const userProfile=await User.findOne({token:token})

            if(!userProfile){
                return res.status(404).json({message:"user not found"})
            }

            const profile_to_update=await Profile.findOne({userId:userProfile._id})
            Object.assign(profile_to_update,newProfileData)
            await profile_to_update.save()
            return res.json({message:"profile updated"})

    }catch(err){
        return res.status(500).json({message:err.message})
    }
}