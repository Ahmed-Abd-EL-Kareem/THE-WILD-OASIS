import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editBooking } from "../../services/apiBookings";
import toast from "react-hot-toast";

export function useEditBooking() {
  const queryClient = useQueryClient();

  const { mutate: editBookingMutation, isPending: isEditing } = useMutation({
    mutationFn: ({ newBooking, id }) => editBooking(id, newBooking),
    onSuccess: () => {
      toast.success("Booking updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["bookings"],
      });
    },
    onError: (err) => toast.error(err.message),
  });
  return { isEditing, editBooking: editBookingMutation };
}

