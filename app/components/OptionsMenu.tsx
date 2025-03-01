// OptionsMenu.tsx
import React, { useState, useRef, useEffect } from "react";

interface OptionsMenuProps {
  onRename?: () => void;
  onDelete?: () => void;
}

const OptionsMenu: React.FC<OptionsMenuProps> = ({ onRename, onDelete }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Ouvrir des options de conversation"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="cursor-pointer flex items-center justify-center text-[#5e5e5e] transition hover:text-[#b4b4b4]"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="icon-md"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="fixed max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-fit py-2 bg-[#303030] border border-[#404040] rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <div
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              setOpen(false);
              if (onRename) onRename();
            }}
            className="flex items-center m-1.5 p-2.5 text-sm cursor-pointer focus-visible:outline-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 group relative hover:bg-[#606060] focus-visible:bg-[#606060] radix-state-open:bg-[#606060] dark:hover:bg-token-main-surface-secondary dark:focus-visible:bg-token-main-surface-secondary rounded-md my-0 px-3 mx-2 gap-2.5 py-3"
          >
            <div className="flex items-center justify-center text-[#e8e8e8] h-5 w-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.2929 4.29291C15.0641 2.52167 17.9359 2.52167 19.7071 4.2929C21.4784 6.06414 21.4784 8.93588 19.7071 10.7071L18.7073 11.7069L11.6135 18.8007C10.8766 19.5376 9.92793 20.0258 8.89999 20.1971L4.16441 20.9864C3.84585 21.0395 3.52127 20.9355 3.29291 20.7071C3.06454 20.4788 2.96053 20.1542 3.01362 19.8356L3.80288 15.1C3.9742 14.0721 4.46243 13.1234 5.19932 12.3865L13.2929 4.29291ZM13 7.41422L6.61353 13.8007C6.1714 14.2428 5.87846 14.8121 5.77567 15.4288L5.21656 18.7835L8.57119 18.2244C9.18795 18.1216 9.75719 17.8286 10.1993 17.3865L16.5858 11L13 7.41422Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            Renommer
          </div>
          <div
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              setOpen(false);
              if (onDelete) onDelete();
            }}
            className="flex text-red-500 items-center m-1.5 p-2.5 text-sm cursor-pointer focus-visible:outline-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 group relative hover:bg-[#606060] focus-visible:bg-[#606060] radix-state-open:bg-[#606060] dark:hover:bg-token-main-surface-secondary dark:focus-visible:bg-token-main-surface-secondary rounded-md my-0 px-3 mx-2 gap-2.5 py-3 text-token-text-error"
          >
            <div className="flex items-center justify-center  h-5 w-5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.5555 4C10.099 4 9.70052 4.30906 9.58693 4.75114L9.29382 5.8919H14.715L14.4219 4.75114C14.3083 4.30906 13.9098 4 13.4533 4H10.5555ZM16.7799 5.8919L16.3589 4.25342C16.0182 2.92719 14.8226 2 13.4533 2H10.5555C9.18616 2 7.99062 2.92719 7.64985 4.25342L7.22886 5.8919H4C3.44772 5.8919 3 6.33961 3 6.8919C3 7.44418 3.44772 7.8919 4 7.8919H4.10069L5.31544 19.3172C5.47763 20.8427 6.76455 22 8.29863 22H15.7014C17.2354 22 18.5224 20.8427 18.6846 19.3172L19.8993 7.8919H20C20.5523 7.8919 21 7.44418 21 6.8919C21 6.33961 20.5523 5.8919 20 5.8919H16.7799ZM17.888 7.8919H6.11196L7.30423 19.1057C7.3583 19.6142 7.78727 20 8.29863 20H15.7014C16.2127 20 16.6417 19.6142 16.6958 19.1057L17.888 7.8919ZM10 10C10.5523 10 11 10.4477 11 11V16C11 16.5523 10.5523 17 10 17C9.44772 17 9 16.5523 9 16V11C9 10.4477 9.44772 10 10 10ZM14 10C14.5523 10 15 10.4477 15 11V16C15 16.5523 14.5523 17 14 17C13.4477 17 13 16.5523 13 16V11C13 10.4477 13.4477 10 14 10Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            Supprimer
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsMenu;
