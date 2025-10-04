import { useQuery } from "@tanstack/react-query";

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  locationId: number | null;
  status: string;
  employeeId: number | null;
}

export function useUser() {
  return useQuery<{ user: User }>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
