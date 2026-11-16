import jwt from "jsonwebtoken";

function secret() {
  const value = process.env.JWT_SECRET?.trim();
  if (!value) {
    throw new Error("JWT_SECRET is missing. Add it to your .env file.");
  }
  return value;
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: "7d" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Login required." });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), secret());
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      res.status(401).json({ message: "Session expired. Please log in again." });
      return;
    }
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}
