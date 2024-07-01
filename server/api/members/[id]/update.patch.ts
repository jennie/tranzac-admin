export default defineEventHandler(async (event) => {
  const userId = event.context.params.id;
  const body = await readBody(event);
  try {
    const user = await MemberSchema.findByIdAndUpdate(userId, body, {
      new: true,
    });
    // await setAuth(event, email);

    if (!user) {
      return createError({ statusCode: 404, statusMessage: "User not found" });
    }

    return user;
  } catch (error) {
    return createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
