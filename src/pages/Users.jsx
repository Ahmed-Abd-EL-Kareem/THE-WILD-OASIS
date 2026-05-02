import SignupForm from "../features/authentication/SignupForm";
import Heading from "../ui/Heading";
import Row from "../ui/Row";

function NewUsers() {
  return (
    <Row>
      <div>
        <Heading as="h1">Create a new user</Heading>
        <SignupForm mode="customer" />
      </div>

      <div>
        <Heading as="h1">Create a new admin user</Heading>
        <SignupForm mode="admin" />
      </div>
    </Row>
  );
}

export default NewUsers;
