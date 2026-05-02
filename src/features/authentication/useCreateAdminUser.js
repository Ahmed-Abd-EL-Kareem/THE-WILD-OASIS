import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createAdminUser as createAdminUserApi } from "../../services/apiAuth";

export function useCreateAdminUser() {
  const { mutate: createAdminUser, isPending } = useMutation({
    mutationFn: createAdminUserApi,
    onSuccess: () => {
      toast.success("Admin user created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { createAdminUser, isPending };
}
