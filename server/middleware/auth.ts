import { Request } from "express";

// Helper function to filter data by location for location_user role
export const filterByUserLocation = (data: any[], req: Request) => {
  // super_admin and admin can see all data
  if (getUserRole(req) === "super_admin" || getUserRole(req) === "admin") {
    return data;
  }

  // location_user can only see data from their location
  if (getUserRole(req) === "location_user" && req.session.locationId) {
    return data.filter(
      (item: any) => item.locationId === req.session.locationId,
    );
  }

  // Default: return all data (for other roles)
  return data;
};

// Helper to check if location_user can access a specific location
export const canAccessLocation = (req: Request, locationId: number | null) => {
  // super_admin and admin can access all locations
  if (getUserRole(req) === "super_admin" || getUserRole(req) === "admin") {
    return true;
  }

  // location_user can only access their own location
  if (getUserRole(req) === "location_user") {
    return locationId === req["session"].locationId;
  }

  return true; // Default allow for other roles
};

// Helper to get the user's role from the request
export const getUserRole = (req: Request): string | undefined => {
  return req["session"].role;
};
