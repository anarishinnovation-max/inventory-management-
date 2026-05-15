import { SignJWT, jwtVerify } from "jose";

if (!process.env.JWT_SECRET) {
  const errorMsg = "FATAL: JWT_SECRET environment variable is not set. Authentication cannot function without a secure secret key.";
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const key = new TextEncoder().encode(process.env.JWT_SECRET);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}
