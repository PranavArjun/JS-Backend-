import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiRespose.js"

const registerUser = asyncHandler(async(req,res) =>{
    // 1.get user details from frontend 
    const {fullName , email, username , password} = req.body
    console.log("email :",email);

    // 2.validation check field not empty 
    if(
        [fullName,email,username,password].some((field)=>field?.trim() ==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    // 3.check for user already exists : username,email
    const existedUser = User.findOne({
        $or : [{ username },{ email }]
    })
    if(existedUser){
        throw new ApiError(409,"UserName Or Email allready exists")
    }

    // 4.check for cover image and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    // 5.upload them to cloudinary , avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    // 6.create user object for mongodb database  
    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // 7.remove password and refesh token from response 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // 8.check for user creation 
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    // 9.return res 
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Successfully")
    )

})

export {registerUser}