import type { H3Event } from "h3";

export async function getAuth(event: H3Event) {
  //  return getCookie(event, 'authorization')
  return (await _useSession(event)).data.email;
}

export async function setAuth(event: H3Event, email: string) {
  const token = await createJWT(email);
  // return setCookie(event, 'authorization', token)
  return await _useSession(event, token);
}

export async function clearAuth(event: H3Event) {
  // return deleteCookie(event, 'authorization')
  return (await _useSession(event)).clear();
}

export async function requireAuth(event: H3Event) {
  const token = await getAuth(event);

  if (!token) {
    throw createError({
      statusCode: 401,
      statusText: "Unauthorized! token invalid.",
    });
  }

  const decoded = await verifyJWT(token);

  // Fetch the full user data from the database using the email from the decoded token
  const user = await UserSchema.findOne({ email: decoded.email });

  if (!user) {
    throw createError({
      statusCode: 404,
      statusText: "User not found.",
    });
  }

  // Return the full user information, including _id
  return {
    _id: user._id,
    email: user.email,
    iss: decoded.iss,
    iat: decoded.iat,
    exp: decoded.exp,
  };
}

// export async function requireAuth(event: H3Event) {
//   const token = await getAuth(event)

//   if (!token)
//     throw createError({
//       statusCode: 401,
//       statusText: 'Unauthorized! token invalid.'
//     })

//   const payload = await verifyJWT(token)

//   return payload
// }
