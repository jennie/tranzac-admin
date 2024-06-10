import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export default defineEventHandler(async (event) => {
  // TODO: use validation
  const body = await readBody(event);

  if (!body) {
    throw createError({
      statusMessage: "Invalid request body",
    });
  }
  const { email, password } = body;
  console.log("email", email, "password", password);
  if (!email || !password) {
    throw createError({
      statusMessage: "Please fill out all fields.",
    });
  }

  const user = await mongoose.connection.db
    .collection("users")
    .findOne({ email });

  if (!user) {
    throw createError({
      statusMessage: "That user does not exist.",
    });
  }

  const matches = bcrypt.compareSync(password, user.password);

  if (!matches) {
    throw createError({
      statusMessage: "Wrong password. Try again!",
    });
  }

  await setAuth(event, user.email);

  return {
    loggedIn: true,
    user: user.email as string,
  };
});
