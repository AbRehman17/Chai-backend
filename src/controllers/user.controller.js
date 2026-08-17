import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.model.js' // To check unique user
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'
const registerUser = asyncHandler(async (req, res) => {
  // Get user details from frontend - req.body
  const { fullName, email, username, password } = req.body
  console.log(`Email: ${email}`)
  console.log('Full body:', req.body) // Debug: see what's coming in

  // Validation - check for undefined, null, or empty string
  if (
    [fullName, email, username, password].some((field) => {
      return !field || field.trim() === ''
    })
  ) {
    throw new apiError(400, 'All fields are required')
  }
  // Already exists or not
  const existed = await User.findOne({ $or: [{ username }, { email }] })
  if (existed) {
    throw new apiError(409, 'User with email or name already exists')
  }
  // Check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path // get files using multer
  // const coverImageLocalPath = req.files?.coverImage[0].path
  let coverImageLocalPath

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path
  }
  if (!avatarLocalPath) throw new apiError(400, 'Avatar file is required')
  // Upload to cloudinary ,avatar uploaded or not
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!avatar) throw new apiError(400, 'Avatar field is required')
  // Create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  })
  // Send response with removed password and refresh token
  const userCreated = await User.findById(user._id).select(
    '-password -refreshToken',
  )
  // Check for user creation
  if (!userCreated) {
    throw new apiError(500, 'Something went wrong while registering user')
  }
  // Return res
  res.status(201).json(new apiResponse(200, 'User registered successfully'))
  // res.status(200).json({
  //   message: 'ok',
  // })
})
export { registerUser }
