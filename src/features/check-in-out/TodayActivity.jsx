import styled from "styled-components";

import Heading from "../../ui/Heading";
import Row from "../../ui/Row";
import { useTodayActivity } from "./useTodayActivity";
import Spinner from "../../ui/Spinner";
import TodayItem from "./TodayItem";
import { useNavigate } from "react-router-dom";

const StyledToday = styled.div`
  /* Box */
  background-color: var(--color-grey-0);
  border: 1px solid var(--color-grey-100);
  border-radius: var(--border-radius-md);

  padding: 3.2rem;
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  grid-column: 1 / span 2;
  padding-top: 2.4rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &:focus-visible {
    outline: 2px solid var(--color-brand-600);
    outline-offset: 2px;
  }
`;

const TodayList = styled.ul`
  overflow: scroll;
  overflow-x: hidden;

  /* Removing scrollbars for webkit, firefox, and ms, respectively */
  &::-webkit-scrollbar {
    width: 0 !important;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
`;

const NoActivity = styled.p`
  text-align: center;
  font-size: 1.8rem;
  font-weight: 500;
  margin-top: 0.8rem;
`;

function TodayActivity() {
  const { isPending, activities } = useTodayActivity();
  const safeActivities = activities ?? [];
  const navigate = useNavigate();

  function handleActivate() {
    navigate("/bookings");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  }

  return (
    <StyledToday
      role={safeActivities.length === 0 ? "button" : undefined}
      tabIndex={safeActivities.length === 0 ? 0 : undefined}
      aria-label={
        safeActivities.length === 0
          ? "Open bookings page"
          : "Today's check-in and check-out activity"
      }
      onClick={safeActivities.length === 0 ? handleActivate : undefined}
      onKeyDown={safeActivities.length === 0 ? handleKeyDown : undefined}
    >
      <Row $type="horizontal">
        <Heading as="h2">Today</Heading>
      </Row>

      {!isPending ? (
        safeActivities.length > 0 ? (
          <TodayList>
            {safeActivities.length > 0 ? (
              safeActivities.map((activity) => (
                <TodayItem key={activity.id} activity={activity} />
              ))
            ) : (
              <NoActivity>No activity today</NoActivity>
            )}
          </TodayList>
        ) : (
          <NoActivity>No activity today</NoActivity>
        )
      ) : (
        <Spinner />
      )}
    </StyledToday>
  );
}

export default TodayActivity;
