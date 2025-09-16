import { useQuery } from "@tanstack/react-query";
import { getAuthUsers } from "../../services/apiUsers";

export function useAuthUsers() {
  const {
    data: users,
    isPending,
    error,
  } = useQuery({ queryKey: ["auth-users"], queryFn: getAuthUsers });

  return { users, isPending, error };
}

