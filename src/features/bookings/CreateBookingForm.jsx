import { useForm } from "react-hook-form";
import { useEffect, useMemo, useRef, useState } from "react";
import Input from "../../ui/Input";
import Form from "../../ui/Form";
import Button from "../../ui/Button";
import Textarea from "../../ui/Textarea";
import FormRow from "../../ui/FormRow";
import Select from "../../ui/Select";
import { useCreateBooking } from "./useCreateBooking";
import { useEditBooking } from "./useEditBooking";
import { useCabins } from "../cabins/useCabins";
import { useGuests } from "../guests/useGuests";
import { useAuthUsers } from "../guests/useAuthUsers";
import Spinner from "../../ui/Spinner";
import { useQuery } from "@tanstack/react-query";
import { getBooking } from "../../services/apiBookings";
import { useSettings } from "../settings/useSettings";

function CreateBookingForm({ bookingToEdit = {}, onCloseModal }) {
  const { id: editId, ...editValues } = bookingToEdit;
  const isEditSession = Boolean(editId);

  const [selectedCabin, setSelectedCabin] = useState(null);
  // Dates managed by react-hook-form only
  const [numGuests, setNumGuests] = useState(1);

  const { register, handleSubmit, reset, watch, setValue, formState } = useForm(
    {
      defaultValues: isEditSession ? editValues : { numGuests: 1 },
    }
  );
  const { errors } = formState;

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const { isCreating, createBooking } = useCreateBooking();
  const { isEditing, editBooking } = useEditBooking();
  const { cabins, isPending: isLoadingCabins } = useCabins();
  const { guests, isPending: isLoadingGuests } = useGuests();
  const { users: authUsers } = useAuthUsers();
  const { settings } = useSettings();

  // If editing, fetch latest booking data
  const { data: fetchedBooking } = useQuery({
    enabled: isEditSession,
    queryKey: ["booking", editId, "edit"],
    queryFn: () => getBooking(editId),
  });
  // Disable fields only during mutate; selects disabled while their lists load
  const isWorking = isCreating || isEditing;
  // Seed form once per edit session to avoid re-render loops
  const seededRef = useRef(false);
  useEffect(() => {
    if (!isEditSession) return;
    if (!fetchedBooking || !cabins || !guests) return;
    if (seededRef.current) return;

    const seededCabinId =
      fetchedBooking.cabinId ?? fetchedBooking.cabins?.id ?? null;
    const seededGuestId =
      fetchedBooking.guestId ?? fetchedBooking.guests?.id ?? null;

    setValue("cabinId", seededCabinId || "");
    setValue("guestId", seededGuestId || "");
    setValue("status", fetchedBooking.status);
    setValue("hasBreakfast", Boolean(fetchedBooking.hasBreakfast));
    setValue("isPaid", Boolean(fetchedBooking.isPaid));
    setValue("observations", fetchedBooking.observations || "");
    setValue("startDate", fetchedBooking.startDate?.slice(0, 10) || "");
    setValue("endDate", fetchedBooking.endDate?.slice(0, 10) || "");
    setNumGuests(fetchedBooking.numGuests || 1);
    setValue("numGuests", fetchedBooking.numGuests || 1);
    const cabin = cabins.find((c) => c.id === seededCabinId);
    if (cabin) setSelectedCabin(cabin);

    seededRef.current = true;
  }, [isEditSession, fetchedBooking, cabins, guests, setValue]);

  // Reset seeding flag when target changes (e.g., open a different booking)
  useEffect(() => {
    seededRef.current = false;
  }, [editId]);

  // Cabin options
  const cabinOptions = useMemo(() => {
    return (
      cabins?.map((cabin) => ({
        value: cabin.id,
        label: `${cabin.name} (${cabin.maxCapacity} guests)`,
      })) || []
    );
  }, [cabins]);

  // Guest options
  const guestOptions = useMemo(() => {
    const optionsFromGuests =
      guests?.map((guest) => ({
        value: guest.id,
        label: `${guest.fullName} (${guest.email})`,
      })) || [];

    const optionsFromAuth =
      authUsers?.map((u) => ({
        value: u.id,
        label: `${u.fullName} (${u.email})`,
      })) || [];

    // Prefer guests if both exist; otherwise merge unique by email
    const byEmail = new Map();
    [...optionsFromAuth, ...optionsFromGuests].forEach((opt) => {
      const email = opt.label.match(/\((.*)\)/)?.[1] || opt.label;
      if (!byEmail.has(email)) byEmail.set(email, opt);
    });

    return Array.from(byEmail.values());
  }, [guests, authUsers]);

  // Nights: editable by user, but auto-updated when dates change
  const calcNightsFromDates = (s, e) => {
    if (!s || !e) return 0;
    const start = new Date(s);
    const end = new Date(e);
    return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  };

  const [numNights, setNumNights] = useState(0);

  useEffect(() => {
    setNumNights(calcNightsFromDates(startDate, endDate));
  }, [startDate, endDate]);

  // Calculate price based on cabin, breakfast, guests, nights
  const hasBreakfast = watch("hasBreakfast");
  const watchedGuests = watch("numGuests") || 1;
  const watchedCabinId = parseInt(watch("cabinId") || 0);
  const effectiveCabin =
    selectedCabin || cabins?.find((c) => c.id === watchedCabinId) || null;
  useEffect(() => {
    setNumGuests(watchedGuests);
  }, [watchedGuests]);
  const calculatedPrice = useMemo(() => {
    if (!effectiveCabin) return 0;
    const cabinPricePerNight =
      (effectiveCabin.regularPrice || 0) - (effectiveCabin.discount || 0);
    const base = cabinPricePerNight * (numNights || 0);
    const breakfastUnit =
      settings?.breakfastPrice || settings?.braekfastPrice || 0;
    const effectiveGuests = Math.min(
      watchedGuests || 1,
      effectiveCabin.maxCapacity || 1
    );
    const breakfastTotal = hasBreakfast
      ? breakfastUnit * (numNights || 0) * effectiveGuests
      : 0;
    return base + breakfastTotal;
  }, [effectiveCabin, numNights, hasBreakfast, watchedGuests, settings]);

  // numNights is state now

  // Update selected cabin when changing selection
  const handleCabinChange = (cabinId) => {
    const cabin = cabins?.find((c) => c.id === parseInt(cabinId));
    setSelectedCabin(cabin);
    if (cabin) {
      const current = parseInt(watchedGuests || 1);
      const clamped = Math.min(Math.max(1, current), cabin.maxCapacity || 1);
      if (clamped !== current)
        setValue("numGuests", clamped, { shouldValidate: true });
      setNumGuests(clamped);
    }
  };

  // Validate dates
  const validateDates = () => {
    if (!startDate || !endDate) return true;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return start >= today && end > start;
  };

  function onSubmit(data) {
    if (!validateDates()) {
      alert("Please choose valid dates");
      return;
    }

    // Derive values safely from form data to avoid stale state
    const chosenCabin =
      selectedCabin || cabins?.find((c) => c.id === parseInt(data.cabinId));
    const formStart = data.startDate || startDate;
    const formEnd = data.endDate || endDate;
    const nights = calcNightsFromDates(formStart, formEnd);
    const maxCap = chosenCabin?.maxCapacity || 10;
    const guestsClamped = Math.min(
      Math.max(1, parseInt(data.numGuests || 1)),
      maxCap
    );
    const pricePerNight =
      (chosenCabin?.regularPrice || 0) - (chosenCabin?.discount || 0);
    const breakfastUnit =
      settings?.breakfastPrice || settings?.braekfastPrice || 0;
    const breakfastCost = data.hasBreakfast
      ? breakfastUnit * nights * guestsClamped
      : 0;
    const total = pricePerNight * nights + breakfastCost;

    const bookingData = {
      ...data,
      cabinId: parseInt(data.cabinId),
      guestId: parseInt(data.guestId),
      startDate: formStart,
      endDate: formEnd,
      numNights: nights,
      numGuests: guestsClamped,
      totalPrice: total,
      status: data.status || "unconfirmed",
      hasBreakfast: Boolean(data.hasBreakfast),
      isPaid: Boolean(data.isPaid),
    };

    if (isEditSession) {
      editBooking(
        { newBooking: bookingData, id: editId },
        {
          onSuccess: () => {
            reset();
            onCloseModal?.();
          },
        }
      );
    } else {
      createBooking(bookingData, {
        onSuccess: () => {
          reset();
          setSelectedCabin(null);
          setNumGuests(1);
        },
      });
    }
  }

  // Don't block UI with a full-screen spinner; fields will be disabled while loading

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      type={onCloseModal ? "modal" : "regular"}
    >
      <FormRow label="Cabin" error={errors?.cabinId?.message}>
        <Select
          options={cabinOptions}
          value={watch("cabinId") || ""}
          onChange={(e) => {
            setValue("cabinId", e.target.value);
            handleCabinChange(e.target.value);
          }}
          disabled={isWorking || isLoadingCabins}
          {...register("cabinId", {
            required: "Cabin is required",
          })}
        />
      </FormRow>

      <FormRow label="Guest" error={errors?.guestId?.message}>
        <Select
          options={guestOptions}
          value={watch("guestId") || ""}
          onChange={(e) => setValue("guestId", e.target.value)}
          disabled={isWorking || isLoadingGuests}
          {...register("guestId", {
            required: "Guest is required",
          })}
        />
      </FormRow>

      <FormRow label="Start date" error={errors?.startDate?.message}>
        <Input
          type="date"
          id="startDate"
          min="1900-01-01"
          disabled={isWorking}
          {...register("startDate", {
            required: "Start date is required",
          })}
        />
      </FormRow>

      <FormRow label="End date" error={errors?.endDate?.message}>
        <Input
          type="date"
          id="endDate"
          min={startDate || undefined}
          disabled={isWorking}
          {...register("endDate", {
            required: "End date is required",
          })}
        />
      </FormRow>

      <FormRow label="Guests" error={errors?.numGuests?.message}>
        <Input
          type="number"
          id="numGuests"
          min="1"
          max={effectiveCabin?.maxCapacity || 10}
          value={numGuests}
          onChange={(e) => {
            const value = parseInt(e.target.value || 0);
            setNumGuests(value);
            setValue("numGuests", value, { shouldValidate: true });
          }}
          disabled={isWorking}
          {...register("numGuests", {
            required: "Number of guests is required",
            min: {
              value: 1,
              message: "Guests must be at least 1",
            },
            validate: (value) => {
              const maxCap = effectiveCabin?.maxCapacity || 10;
              return (
                Number(value) <= maxCap || `Guests cannot exceed ${maxCap}`
              );
            },
          })}
        />
      </FormRow>

      <FormRow label="Nights">
        <Input
          disabled
          type="number"
          value={numNights}
          onChange={(e) =>
            setNumNights(Math.max(0, parseInt(e.target.value || 0)))
          }
          style={{ backgroundColor: "var(--color-grey-100)" }}
        />
      </FormRow>

      <FormRow label="Total price">
        <Input
          type="number"
          value={calculatedPrice}
          disabled
          style={{ backgroundColor: "var(--color-grey-100)" }}
        />
      </FormRow>

      <FormRow label="Status">
        <Select
          options={[
            { value: "unconfirmed", label: "Unconfirmed" },
            { value: "checked-in", label: "Checked in" },
            { value: "checked-out", label: "Checked out" },
          ]}
          value={watch("status") || "unconfirmed"}
          onChange={(e) => setValue("status", e.target.value)}
          disabled={isWorking}
          {...register("status")}
        />
      </FormRow>

      <FormRow label="Breakfast included?">
        <input
          type="checkbox"
          id="hasBreakfast"
          {...register("hasBreakfast")}
          disabled={isWorking}
        />
      </FormRow>

      <FormRow label="Paid?">
        <input
          type="checkbox"
          id="isPaid"
          {...register("isPaid")}
          disabled={isWorking}
        />
      </FormRow>

      <FormRow label="Observations">
        <Textarea
          id="observations"
          disabled={isWorking}
          {...register("observations")}
        />
      </FormRow>

      <FormRow>
        <Button
          variation="secondary"
          type="button"
          onClick={() => onCloseModal?.()}
        >
          Cancel
        </Button>
        <Button disabled={isWorking}>
          {isEditSession ? "Update booking" : "Create booking"}
        </Button>
      </FormRow>
    </Form>
  );
}

export default CreateBookingForm;
