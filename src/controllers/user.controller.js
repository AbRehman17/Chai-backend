import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.model.js' // To check unique user
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'
const generateAccessAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { refreshToken, accessToken }
  } catch (error) {
    throw new apiError(
      500,
      'Something went wrong while generating refresh and access token',
    )
  }
}
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
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body
  if (!(email || username)) {
    throw new apiError(400, 'Email or Username required')
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  })
  if (!user) {
    throw new apiError(400, 'User not found try registering first')
  }
  const isPasswordValid = user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new apiError(401, 'Invalid credentials')
  }
  // Send tokens as cookies to user
  // Hum ny purana uuser ni liya q ky usky pass updated refreshToken ni tha
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  )
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken',
  )
  const options = {
    // Only modifiable by server
    httpOnly: true,
    secure: true,
  }
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged in successfully',
      ),
    )
})
const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true },
  )
  const options = {
    // Only modifiable by server
    httpOnly: true,
    secure: true,
  }
  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new apiResponse(200, {}, 'User logged out successfully'))
})
const refreshAccessToken = asyncHandler(async (req, res) => {
  // frontend (cookies) sy user purana refresh token bhejy ga kisi endpoint jo ky match hoga db waly refresh token sy ... agr match hoa tu aik nya access token grant kr dya jyega
  incomingRefreshToken = req.cookies.refreshToken || req.body
  if (!incomingRefreshToken) throw new apiError(401, 'unauthorized request')
  // decoded token needed
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN,
      process.env.REFRESH_TOKEN_EXPIRY,
    )
    user = await User.findByID(decodedToken?._id)
    if (!user) throw new apiError(401, 'Invalid refresh token')
    if (incomingRefreshToken !== user?.refreshToken)
      throw new apiError(401, 'Refresh token is expired or used')
    const options = {
      httpOnly: true,
      secure: true,
    }
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id)
    res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new apiResponse(
          200,
          { accessToken, newRefreshToken },
          'Access token refreshed',
        ),
      )
  } catch (error) {
    throw new apiError(401, error?.message || 'Invalid refresh token')
  }
})
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body
  if (newPassword != confirmNewPassword)
    throw new apiError(400, 'Passwords does not matches')
  const user = User.findById(req.user?._id)
  if (!user) throw new apiError(400, 'User not found')
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) throw new apiError(400, 'Invalid password')
  user.password = confirmNewPassword
  await user.save({ validateBeforeSave: false })
  return res
    .status(200)
    .json(new apiResponse(200, {}, 'Password changed successfully'))
})
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, 'Current user fetched successfully')
})
const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body
  if (!(email || fullName)) {
    throw new apiError(400, 'All fields are required')
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true },
  ).select('-password')
  return res
    .status(200)
    .json(new apiResponse(200, user, 'Account details updated successfully'))
})
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) throw new apiError(400, 'Avatar file is missing')
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar.url)
    throw new apiError(400, 'Error while uploading on cloudinary')
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    { new: true },
  ).select('-password')
  return res
    .status(200)
    .json(new apiResponse(200, user, 'Avatar updated successfully'))
})
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath)
    throw new apiError(400, 'Cover image file is missing')
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage.url)
    throw new apiError(400, 'Error while uploading cover image on cloudinary')
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage?.url,
      },
    },
    { new: true },
  ).select('-password')
  return res
    .status(200)
    .json(new apiResponse(200, user, 'Cover image updated successfully'))
})
const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params // Koi bhi channel url sy open hota
  if (!username?.trim()) throw new apiError(400, 'Username is missing')
  // Aggregation return array of objects
  // Aggregation pipeline ka jitna code hy wo directly mongodb sy interact krta no mongoose
  const channel = await User.aggregate([
    {
      // First pipeline
      $match: {
        username: username,
      },
    },
    {
      // Second Pipeline : user jis channel ko view kr rha us channel ky kon kon subscribers hain unky documents jma kr do
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      // Third Pipeline : User ny kin kin ko subscribe kia hy unky documents jma kr do
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      // Fourth pipeline : User model ky view mei add krdo mazeed
      $addFields: {
        subscribersCount: {
          $size: '$subscribers',
        },
        userSubscribedToCount: {
          $size: '$subscribedTo',
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, 'subscribers.subscriber'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // Fifth pipeline: Mene user view model mei kon kon si field project krni
      $project: {
        username,
        email,
        fullName,
        subscribersCount,
        userSubscribedToCount,
        isSubscribed,
        avatar,
        coverImage,
      },
    },
  ])
  console.log(`Channel Info:${channel}`)
  if (!channel?.length) throw new apiError(404, 'Channel does not exist')
  return (
    res.status(200),
    json(new apiResponse(200, channel[0], ' Channel fetched successfully'))
  )
})
const getUserWatchHistory = asyncHandle(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectID(req.user?._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $match: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: 'owner',
              },
            },
          },
        ],
      },
    },
  ])
  return (
    res.status(200),
    json(
      new apiResponse(
        200,
        user[0].watchHistory,
        ' Watch history fetched successfully',
      ),
    )
  )
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
}
