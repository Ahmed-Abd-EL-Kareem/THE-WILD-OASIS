import { useMutation, useQueryClient } from "@tanstack/react-query";
import { googleSignin } from "../../services/apiAuth";

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const { mutate: loginGoogle, isPending } = useMutation({
    mutationFn: async (token) => await googleSignin(token),
    onSuccess: (authData) => {
      queryClient.setQueryData(["user"], authData.user);
    },
  });

  return { loginGoogle, isPending };
}
