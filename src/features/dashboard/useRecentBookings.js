import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { getBookingsAfterDate } from "../../services/apiBookings";

export function useRecentBookings() {
  const [searshParams] = useSearchParams();
  const numDays = !searshParams.get("last")
    ? 7
    : Number(searshParams.get("last"));
  const queryDate = subDays(new Date(), numDays).toISOString();
  const { isPending, data: bookings } = useQuery({
    queryFn: () => getBookingsAfterDate(queryDate),
    queryKey: ["bookings", `last-${numDays}`],
  });

  return { isPending, bookings };
}
