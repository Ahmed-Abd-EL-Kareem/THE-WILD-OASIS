import SortBy from "../../ui/SortBy";
import Filter from "../../ui/Filter";
import TableOperations from "../../ui/TableOperations";
import styled from "styled-components";
import { useSearchParams } from "react-router-dom";

const SearchInput = styled.input`
  font-size: 1.4rem;
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--color-grey-300);
  border-radius: var(--border-radius-sm);
  width: 22rem;
  background-color: var(--color-grey-0);
`;

function BookingTableOperations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchValue = searchParams.get("search") || "";

  function handleSearchChange(e) {
    const value = e.target.value;

    if (value.trim()) searchParams.set("search", value);
    else searchParams.delete("search");

    if (searchParams.get("page")) searchParams.set("page", 1);
    setSearchParams(searchParams);
  }

  return (
    <TableOperations>
      <Filter
        filterField="status"
        options={[
          { value: "all", label: "All" },
          { value: "checked-out", label: "Checked out" },
          { value: "checked-in", label: "Checked in" },
          { value: "unconfirmed", label: "Unconfirmed" },
        ]}
      />

      <SortBy
        options={[
          { value: "startDate-desc", label: "Sort by date (recent first)" },
          { value: "startDate-asc", label: "Sort by date (earlier first)" },
          {
            value: "totalPrice-desc",
            label: "Sort by amount (high first)",
          },
          { value: "totalPrice-asc", label: "Sort by amount (low first)" },
        ]}
      />
      <SearchInput
        type="text"
        placeholder="Search guest or email (or cabin: name)"
        value={searchValue}
        onChange={handleSearchChange}
      />
    </TableOperations>
  );
}

export default BookingTableOperations;
