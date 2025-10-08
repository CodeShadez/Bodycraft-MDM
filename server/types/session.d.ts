import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
    role: string;
    locationId: number | null;
  }
}
