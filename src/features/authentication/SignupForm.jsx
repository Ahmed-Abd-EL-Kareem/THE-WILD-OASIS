import { useForm } from "react-hook-form";
import Button from "../../ui/Button";
import Form from "../../ui/Form";
import FormRow from "../../ui/FormRow";
import Input from "../../ui/Input";
import { useSignup } from "./useSignup";
import { useCreateAdminUser } from "./useCreateAdminUser";
import SpinnerMini from "./../../ui/SpinnerMini";

// Email regex: /\S+@\S+\.\S+/

function SignupForm({ mode = "customer" }) {
  const { signup, isPending: isSigningUp } = useSignup();
  const { createAdminUser, isPending: isCreatingAdmin } = useCreateAdminUser();
  const isPending = isSigningUp || isCreatingAdmin;
  const isAdminMode = mode === "admin";
  const { register, formState, getValues, handleSubmit, reset } = useForm();
  const { errors } = formState;

  function onSubmit({ fullName, email, password, nationalID, nationality }) {
    const action = isAdminMode ? createAdminUser : signup;
    action(
      {
        fullName,
        email,
        password,
        nationalID: isAdminMode ? "" : nationalID,
        nationality: isAdminMode ? "" : nationality,
      },
      { onSettled: () => reset() }
    );
  }
  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormRow label="Full name" error={errors?.fullName?.message}>
        <Input
          disabled={isPending}
          type="text"
          id="fullName"
          {...register("fullName", { required: "This field is required" })}
        />
      </FormRow>

      <FormRow label="Email address" error={errors?.email?.message}>
        <Input
          disabled={isPending}
          type="email"
          id="email"
          {...register("email", {
            required: "This field is required",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Please provide a valid email address",
            },
          })}
        />
      </FormRow>

      <FormRow
        label="Password (min 8 characters)"
        error={errors?.password?.message}
      >
        <Input
          disabled={isPending}
          type="password"
          id="password"
          {...register("password", {
            required: "This field is required",
            minLength: {
              value: 8,
              message: "Password needs a minimum of 8 characters",
            },
          })}
        />
      </FormRow>

      <FormRow label="Repeat password" error={errors?.passwordConfirm?.message}>
        <Input
          disabled={isPending}
          type="password"
          id="passwordConfirm"
          {...register("passwordConfirm", {
            required: "This field is required",
            validate: (value) =>
              value === getValues().password || "Passwords need to match",
          })}
        />
      </FormRow>

      {!isAdminMode && (
        <FormRow label="National ID" error={errors?.nationalID?.message}>
          <Input
            disabled={isPending}
            type="text"
            id="nationalID"
            {...register("nationalID", {
              required: "This field is required",
              minLength: {
                value: 6,
                message: "National ID must be at least 6 characters",
              },
            })}
          />
        </FormRow>
      )}

      {!isAdminMode && (
        <FormRow label="Nationality (e.g. EG)" error={errors?.nationality?.message}>
          <Input
            disabled={isPending}
            type="text"
            id="nationality"
            {...register("nationality", {
              required: "This field is required",
              minLength: {
                value: 2,
                message: "Nationality must be at least 2 characters",
              },
            })}
          />
        </FormRow>
      )}

      <FormRow>
        {/* type is an HTML attribute! */}
        <Button
          variation="secondary"
          type="reset"
          onClick={reset}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button disabled={isPending}>
          {isPending ? (
            <SpinnerMini />
          ) : isAdminMode ? (
            "Create admin user"
          ) : (
            "Create new user"
          )}
        </Button>
      </FormRow>
    </Form>
  );
}

export default SignupForm;
