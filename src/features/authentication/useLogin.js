import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login as loginApi, logout as logoutApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate: login, isPending } = useMutation({
    mutationFn: ({ email, password }) => loginApi({ email, password }),
    // onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
    onSuccess: (authData) => {
      const role = authData?.user?.role?.toUpperCase?.();
      if (role !== "ADMIN") {
        logoutApi();
        queryClient.setQueryData(["user"], null);
        toast.error("Only admin users can access the dashboard");
        return;
      }

      queryClient.setQueryData(["user"], authData.user);
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => {
      console.log(err);
      toast.error("Provided email or password is incorrect");
    },
  });

  return { login, isPending };
}
