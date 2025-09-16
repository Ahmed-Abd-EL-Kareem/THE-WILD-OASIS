import { createContext, useContext, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HiEllipsisVertical } from "react-icons/hi2";
import styled from "styled-components";
import { useOutSideClick } from "../hooks/useOutSideClick";

const Menu = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const StyledToggle = styled.button`
  background: none;
  border: none;
  padding: 0.4rem;
  border-radius: var(--border-radius-sm);
  transform: translateX(0.8rem);
  transition: all 0.2s;

  &:hover {
    background-color: var(--color-grey-100);
  }

  & svg {
    width: 2.4rem;
    height: 2.4rem;
    color: var(--color-grey-700);
  }
`;

const StyledList = styled.ul`
  position: fixed;

  background-color: var(--color-grey-0);
  box-shadow: var(--shadow-md);
  border-radius: var(--border-radius-md);

  right: ${(props) => props.position.x}px;
  top: ${(props) => props.position.y}px;
`;

const StyledButton = styled.button`
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 1.2rem 2.4rem;
  font-size: 1.4rem;
  transition: all 0.2s;

  display: flex;
  align-items: center;
  gap: 1.6rem;

  &:hover {
    background-color: var(--color-grey-50);
  }

  & svg {
    width: 1.6rem;
    height: 1.6rem;
    color: var(--color-grey-400);
    transition: all 0.3s;
  }
`;

const MenusContext = createContext();

function Menus({ children }) {
  const [openId, setOpenId] = useState("");
  const [position, setPosition] = useState(null);
  const toggleRef = useRef(null); // ✅ store here

  const close = () => setOpenId("");
  const open = (id) => setOpenId(id); // proper function
  return (
    <MenusContext.Provider
      value={{ openId, close, open, position, setPosition, toggleRef }}
    >
      {children}
    </MenusContext.Provider>
  );
}

function Toggle({ id }) {
  const { openId, close, open, setPosition } = useContext(MenusContext);
  function handleClick(e) {
    e.stopPropagation(); // prevent click on parent
    const rect = e.target.closest("button").getBoundingClientRect();
    setPosition({
      x: window.innerWidth - rect.width - rect.x,
      y: rect.y + rect.height + 8,
    });
    openId === "" || openId !== id ? open(id) : close();
  }
  return (
    <StyledToggle onClick={handleClick}>
      <HiEllipsisVertical />
    </StyledToggle>
  );
}
// function Toggle({ id }) {
//   const { openId, close, open, setPosition, toggleRef } =
//     useContext(MenusContext);

//   function handleClick(e) {
//     const rect = e.currentTarget.getBoundingClientRect(); // safer than e.target.closest

//     setPosition({
//       x: window.innerWidth - rect.right, // simpler than width + x math
//       y: rect.bottom + 8,
//     });

//     if (openId === id) {
//       close();
//     } else {
//       open(id);
//     }
//   }

//   return (
//     <StyledToggle ref={toggleRef} onClick={handleClick}>
//       <HiEllipsisVertical />
//     </StyledToggle>
//   );
// }
function List({ id, children }) {
  const { openId, position, close } = useContext(MenusContext);
  const ref = useOutSideClick(close, false);
  if (openId !== id || !position) return null;
  return createPortal(
    <StyledList position={position} ref={ref}>
      {children}
    </StyledList>,
    document.body
  );
}
function Button({ children, icon, onClick }) {
  const { close } = useContext(MenusContext);
  function handleClick() {
    onClick?.();
    close();
  }
  return (
    <li>
      <StyledButton onClick={handleClick}>
        {icon}
        <span>{children}</span>
      </StyledButton>
    </li>
  );
}

Menus.Menu = Menu;
Menus.Toggle = Toggle;
Menus.List = List;
Menus.Button = Button;

export default Menus;
// import { createContext, useContext, useRef, useState } from "react";
// import { createPortal } from "react-dom";
// import { HiEllipsisVertical } from "react-icons/hi2";
// import styled from "styled-components";
// import { useOutSideClick } from "../hooks/useOutSideClick";

// const Menu = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: flex-end;
// `;

// const StyledToggle = styled.button`
//   background: none;
//   border: none;
//   padding: 0.4rem;
//   border-radius: var(--border-radius-sm);
//   transform: translateX(0.8rem);
//   transition: all 0.2s;

//   &:hover {
//     background-color: var(--color-grey-100);
//   }

//   & svg {
//     width: 2.4rem;
//     height: 2.4rem;
//     color: var(--color-grey-700);
//   }
// `;

// const StyledList = styled.ul`
//   position: fixed;

//   background-color: var(--color-grey-0);
//   box-shadow: var(--shadow-md);
//   border-radius: var(--border-radius-md);

//   right: ${(props) => props.position.x}px;
//   top: ${(props) => props.position.y}px;
// `;

// const StyledButton = styled.button`
//   width: 100%;
//   text-align: left;
//   background: none;
//   border: none;
//   padding: 1.2rem 2.4rem;
//   font-size: 1.4rem;
//   transition: all 0.2s;

//   display: flex;
//   align-items: center;
//   gap: 1.6rem;

//   &:hover {
//     background-color: var(--color-grey-50);
//   }

//   & svg {
//     width: 1.6rem;
//     height: 1.6rem;
//     color: var(--color-grey-400);
//     transition: all 0.3s;
//   }
// `;

// const MenusContext = createContext();

// function Menus({ children }) {
//   const [openId, setOpenId] = useState("");
//   const [position, setPosition] = useState(null);

//   // This ref will hold the DOM element of the toggle that opened the menu
//   const toggleRef = useRef(null);

//   const close = () => {
//     setOpenId("");
//     toggleRef.current = null;
//   };

//   // `open` accepts the id *and* the toggle element that triggered the open
//   const open = (id, toggleElement = null) => {
//     toggleRef.current = toggleElement;
//     setOpenId(id);
//   };

//   return (
//     <MenusContext.Provider
//       value={{ openId, close, open, position, setPosition, toggleRef }}
//     >
//       {children}
//     </MenusContext.Provider>
//   );
// }

// function Toggle({ id }) {
//   const { openId, close, open, setPosition } = useContext(MenusContext);

//   function handleClick(e) {
//     const rect = e.currentTarget.getBoundingClientRect();

//     setPosition({
//       x: window.innerWidth - rect.right,
//       y: rect.bottom + 8,
//     });

//     if (openId === id) {
//       close();
//     } else {
//       // pass the actual DOM node that was clicked to `open`
//       open(id, e.currentTarget);
//     }
//   }

//   // IMPORTANT: do NOT attach the shared `toggleRef` as the `ref` prop here.
//   // We capture the DOM node via the click event and store it in the provider.
//   return (
//     <StyledToggle onClick={handleClick}>
//       <HiEllipsisVertical />
//     </StyledToggle>
//   );
// }

// function List({ id, children }) {
//   const { openId, position, close, toggleRef } = useContext(MenusContext);

//   // pass the provider's toggleRef into the hook so clicks on that button are ignored
//   const ref = useOutSideClick(close, toggleRef);

//   if (openId !== id || !position) return null;

//   return createPortal(
//     <StyledList position={position} ref={ref}>
//       {children}
//     </StyledList>,
//     document.body
//   );
// }

// function Button({ children, icon, onClick }) {
//   const { close } = useContext(MenusContext);

//   function handleClick() {
//     onClick?.();
//     close();
//   }

//   return (
//     <li>
//       <StyledButton onClick={handleClick}>
//         {icon}
//         <span>{children}</span>
//       </StyledButton>
//     </li>
//   );
// }

// Menus.Menu = Menu;
// Menus.Toggle = Toggle;
// Menus.List = List;
// Menus.Button = Button;

// export default Menus;
