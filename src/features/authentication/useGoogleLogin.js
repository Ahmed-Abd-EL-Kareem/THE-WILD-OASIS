import { useMutation, useQueryClient } from "@tanstack/react-query";
import { googleSignin } from "../../services/apiAuth";

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const { mutate: loginGoogle, isPending } = useMutation({
    mutationFn: async () => await googleSignin(),
    onSuccess: (user) => {
      queryClient.setQueryData(["user"], user.user);
    },
  });

  return { loginGoogle, isPending };
}
