import { nanoid } from "nanoid";
import { defineEventHandler, readBody, createError } from "h3";
import { UserSchema } from "@/server/models/user.schema"; // Ensure this is a Mongoose model, not schema
import { ensureConnection } from "@/server/utils/mongoose"; // Ensure connection to MongoDB
import bcrypt from "bcryptjs";

export default defineEventHandler(async (event) => {
  try {
    // Ensure MongoDB connection
    await ensureConnection();

    // Extract email, password, and other user details from the request body
    const { email, password, ...rest } = await readBody(event);

    // Validate required fields
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: "Email and password are required.",
      });
    }

    // Check if the user already exists
    let member = await User.findOne({ email });
    if (member) {
      // User already exists; handle duplicate registration
      throw createError({
        statusCode: 409, // Conflict
        statusMessage: "User already registered.",
      });
    }

    // Hash the password for storage
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Generate a login token (you might want to generate a JWT instead)
    const loginToken = nanoid();

    // Create and save a new user
    member = new User({
      email,
      password: hashedPassword,
      loginToken,
      loginTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Token expires in 24 hours
      ...rest, // Other user details like `name`
    });

    // Save the new user to the database
    await member.save();

    // Set authentication session (assuming `setAuth` is a function to set session cookies or tokens)
    await setAuth(event, loginToken);

    // Return success response
    return {
      registered: true,
      token: loginToken,
      user: {
        _id: member._id.toString(),
        name: member.name, // Assuming `name` is part of `rest` in `readBody`
        email: member.email,
        membership: {
          status: "pending", // Set appropriate membership status
        },
      },
    };
  } catch (error) {
    // Catch and handle errors
    console.error("Registration error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Registration failed.",
    });
  }
});
