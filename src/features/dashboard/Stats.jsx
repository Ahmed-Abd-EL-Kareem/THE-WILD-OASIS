import React from "react";
import Stat from "./Stat";
import {
  HiOutlineBanknotes,
  HiOutlineBriefcase,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
} from "react-icons/hi2";
import { formatCurrency } from "../../utils/helpers";

function Stats({ bookings, confirmedStays, numDays, cabinCount }) {
  const safeBookings = bookings ?? [];
  const safeConfirmedStays = confirmedStays ?? [];
  const safeCabinCount = cabinCount ?? 0;
  const safeNumDays = numDays ?? 0;
  // 1.
  const numBookings = safeBookings.length;
  // 2.
  const sales = safeBookings.reduce((acc, cur) => acc + cur.totalPrice, 0);
  // 3.
  const checkIns = safeConfirmedStays.length;
  // 4.
  const occupancyDenominator = safeNumDays * safeCabinCount;
  const occupation =
    occupancyDenominator > 0
      ? safeConfirmedStays.reduce((acc, cur) => acc + cur.numNights, 0) /
        occupancyDenominator
      : 0;
  return (
    <>
      <Stat
        title="Bookings"
        color="blue"
        icon={<HiOutlineBriefcase />}
        value={numBookings}
      />

      <Stat
        title="Sales"
        color="green"
        icon={<HiOutlineBanknotes />}
        value={formatCurrency(sales)}
      />
      <Stat
        title="Check ins"
        color="indigo"
        icon={<HiOutlineCalendarDays />}
        value={checkIns}
      />
      <Stat
        title="Occupancy rate"
        color="yellow"
        icon={<HiOutlineChartBar />}
        value={Math.round(occupation * 100) + "%"}
      />
    </>
  );
}

export default Stats;
