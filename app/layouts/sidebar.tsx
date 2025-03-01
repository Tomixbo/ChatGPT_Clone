import { Form, Link, Outlet, useNavigation } from "react-router";
import { NavLink } from "react-router";
import type { Route } from "./+types/sidebar";

/**
 * Définition du type SessionChat
 */
interface SessionChat {
  id: string;
  title: string;
  createdAt: string;
}

/**
 * Loader: récupère la liste des sessions de chat depuis l'API backend
 */
export async function loader({ request }: Route.LoaderArgs) {
  try {
    const response = await fetch("http://localhost:3000/api/session-chats");
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des sessions de chat.");
    }
    const sessionChats: SessionChat[] = await response.json();
    return { sessionChats };
  } catch (error) {
    console.error("Erreur dans le loader SidebarLayout :", error);
    return { sessionChats: [] }; // Retourne une liste vide en cas d'échec
  }
}

/**
 * Layout principal, qui affiche la liste des sessions de chat dans la sidebar.
 */
export default function SidebarLayout({ loaderData }: Route.ComponentProps) {
  const { sessionChats } = loaderData;
  const navigation = useNavigation();

  return (
    <div className="flex h-full w-full bg-[#171717] font-medium">
      {/* Sidebar */}
      <aside className="flex w-[260px] flex-col">
        {/* En-tête de la sidebar */}
        <header className="flex justify-between h-[60px] items-center md:h-[60px] px-3">
          <span className="flex">
            <button
              aria-label="Fermer la barre latérale"
              className="h-10 rounded-lg px-2 text-[#b4b4b4] focus-visible:bg-[#b8b8b8] focus-visible:outline-0 enabled:hover:bg-[#303030] disabled:text-[#303030] no-draggable cursor-pointer"
              type="button"
            >
              {/* Icône version desktop */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="icon-xl-heavy max-md:hidden"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.85719 3H15.1428C16.2266 2.99999 17.1007 2.99998 17.8086 3.05782C18.5375 3.11737 19.1777 3.24318 19.77 3.54497C20.7108 4.02433 21.4757 4.78924 21.955 5.73005C22.2568 6.32234 22.3826 6.96253 22.4422 7.69138C22.5 8.39925 22.5 9.27339 22.5 10.3572V13.6428C22.5 14.7266 22.5 15.6008 22.4422 16.3086C22.3826 17.0375 22.2568 17.6777 21.955 18.27C21.4757 19.2108 20.7108 19.9757 19.77 20.455C19.1777 20.7568 18.5375 20.8826 17.8086 20.9422C17.1008 21 16.2266 21 15.1428 21H8.85717C7.77339 21 6.89925 21 6.19138 20.9422C5.46253 20.8826 4.82234 20.7568 4.23005 20.455C3.28924 19.9757 2.52433 19.2108 2.04497 18.27C1.74318 17.6777 1.61737 17.0375 1.55782 16.3086C1.49998 15.6007 1.49999 14.7266 1.5 13.6428V10.3572C1.49999 9.27341 1.49998 8.39926 1.55782 7.69138C1.61737 6.96253 1.74318 6.32234 2.04497 5.73005C2.52433 4.78924 3.28924 4.02433 4.23005 3.54497C4.82234 3.24318 5.46253 3.11737 6.19138 3.05782C6.89926 2.99998 7.77341 2.99999 8.85719 3ZM6.35424 5.05118C5.74907 5.10062 5.40138 5.19279 5.13803 5.32698C4.57354 5.6146 4.1146 6.07354 3.82698 6.63803C3.69279 6.90138 3.60062 7.24907 3.55118 7.85424C3.50078 8.47108 3.5 9.26339 3.5 10.4V13.6C3.5 14.7366 3.50078 15.5289 3.55118 16.1458C3.60062 16.7509 3.69279 17.0986 3.82698 17.362C4.1146 17.9265 4.57354 18.3854 5.13803 18.673C5.40138 18.8072 5.74907 18.8994 6.35424 18.9488C6.97108 18.9992 7.76339 19 8.9 19H9.5V5H8.9C7.76339 5 6.97108 5.00078 6.35424 5.05118ZM11.5 5V19H15.1C16.2366 19 17.0289 18.9992 17.6458 18.9488C18.2509 18.8994 18.5986 18.8072 18.862 18.673C19.4265 18.3854 19.8854 17.9265 20.173 17.362C20.3072 17.0986 20.3994 16.7509 20.4488 16.1458C20.4992 15.5289 20.5 14.7366 20.5 13.6V10.4C20.5 9.26339 20.4992 8.47108 20.4488 7.85424C20.3994 7.24907 20.3072 6.90138 20.173 6.63803C19.8854 6.07354 19.4265 5.6146 18.862 5.32698C18.5986 5.19279 18.2509 5.10062 17.6458 5.05118C17.0289 5.00078 16.2366 5 15.1 5H11.5ZM5 8.5C5 7.94772 5.44772 7.5 6 7.5H7C7.55229 7.5 8 7.94772 8 8.5C8 9.05229 7.55229 9.5 7 9.5H6C5.44772 9.5 5 9.05229 5 8.5ZM5 12C5 11.4477 5.44772 11 6 11H7C7.55229 11 8 11.4477 8 12C8 12.5523 7.55229 13 7 13H6C5.44772 13 5 12.5523 5 12Z"
                  fill="currentColor"
                ></path>
              </svg>
              {/* Icône version mobile */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="icon-xl-heavy md:hidden"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3 8C3 7.44772 3.44772 7 4 7H20C20.5523 7 21 7.44772 21 8C21 8.55228 20.5523 9 20 9H4C3.44772 9 3 8.55228 3 8ZM3 16C3 15.4477 3.44772 15 4 15H14C14.5523 15 15 15.4477 15 16C15 16.5523 14.5523 17 14 17H4C3.44772 17 3 16.5523 3 16Z"
                  fill="currentColor"
                ></path>
              </svg>
            </button>
          </span>
          <div className="flex">
            <span className="flex" data-state="closed">
              <button
                aria-label="Ctrl K"
                className="cursor-pointer h-10 rounded-lg px-2 text-[#b4b4b4] focus-visible:bg-[#b8b8b8] focus-visible:outline-0 enabled:hover:bg-[#303030] disabled:text-[#303030]"
                type="button"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="icon-xl-heavy"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.75 4.25C7.16015 4.25 4.25 7.16015 4.25 10.75C4.25 14.3399 7.16015 17.25 10.75 17.25C14.3399 17.25 17.25 14.3399 17.25 10.75C17.25 7.16015 14.3399 4.25 10.75 4.25ZM2.25 10.75C2.25 6.05558 6.05558 2.25 10.75 2.25C15.4444 2.25 19.25 6.05558 19.25 10.75C19.25 12.7369 18.5683 14.5645 17.426 16.0118L21.4571 20.0429C21.8476 20.4334 21.8476 21.0666 21.4571 21.4571C21.0666 21.8476 20.4334 21.8476 20.0429 21.4571L16.0118 17.426C14.5645 18.5683 12.7369 19.25 10.75 19.25C6.05558 19.25 2.25 15.4444 2.25 10.75Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
            </span>
            <span className="flex" data-state="closed">
              <Form method="post">
                <button
                  aria-label="Nouveau clavardage"
                  data-testid="create-new-chat-button"
                  className="cursor-pointer h-10 rounded-lg px-2 text-[#b4b4b4] focus-visible:bg-[#b8b8b8] focus-visible:outline-0 enabled:hover:bg-[#303030] disabled:text-[#303030]"
                  type="submit"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon-xl-heavy"
                  >
                    <path
                      d="M15.6729 3.91287C16.8918 2.69392 18.8682 2.69392 20.0871 3.91287C21.3061 5.13182 21.3061 7.10813 20.0871 8.32708L14.1499 14.2643C13.3849 15.0293 12.3925 15.5255 11.3215 15.6785L9.14142 15.9899C8.82983 16.0344 8.51546 15.9297 8.29289 15.7071C8.07033 15.4845 7.96554 15.1701 8.01005 14.8586L8.32149 12.6785C8.47449 11.6075 8.97072 10.615 9.7357 9.85006L15.6729 3.91287ZM18.6729 5.32708C18.235 4.88918 17.525 4.88918 17.0871 5.32708L11.1499 11.2643C10.6909 11.7233 10.3932 12.3187 10.3014 12.9613L10.1785 13.8215L11.0386 13.6986C11.6812 13.6068 12.2767 13.3091 12.7357 12.8501L18.6729 6.91287C19.1108 6.47497 19.1108 5.76499 18.6729 5.32708ZM11 3.99929C11.0004 4.55157 10.5531 4.99963 10.0008 5.00007C9.00227 5.00084 8.29769 5.00827 7.74651 5.06064C7.20685 5.11191 6.88488 5.20117 6.63803 5.32695C6.07354 5.61457 5.6146 6.07351 5.32698 6.63799C5.19279 6.90135 5.10062 7.24904 5.05118 7.8542C5.00078 8.47105 5 9.26336 5 10.4V13.6C5 14.7366 5.00078 15.5289 5.05118 16.1457C5.10062 16.7509 5.19279 17.0986 5.32698 17.3619C5.6146 17.9264 6.07354 18.3854 6.63803 18.673C6.90138 18.8072 7.24907 18.8993 7.85424 18.9488C8.47108 18.9992 9.26339 19 10.4 19H13.6C14.7366 19 15.5289 18.9992 16.1458 18.9488C16.7509 18.8993 17.0986 18.8072 17.362 18.673C17.9265 18.3854 18.3854 17.9264 18.673 17.3619C18.7988 17.1151 18.8881 16.7931 18.9393 16.2535C18.9917 15.7023 18.9991 14.9977 18.9999 13.9992C19.0003 13.4469 19.4484 12.9995 20.0007 13C20.553 13.0004 21.0003 13.4485 20.9999 14.0007C20.9991 14.9789 20.9932 15.7808 20.9304 16.4426C20.8664 17.116 20.7385 17.7136 20.455 18.2699C19.9757 19.2107 19.2108 19.9756 18.27 20.455C17.6777 20.7568 17.0375 20.8826 16.3086 20.9421C15.6008 21 14.7266 21 13.6428 21H10.3572C9.27339 21 8.39925 21 7.69138 20.9421C6.96253 20.8826 6.32234 20.7568 5.73005 20.455C4.78924 19.9756 4.02433 19.2107 3.54497 18.2699C3.24318 17.6776 3.11737 17.0374 3.05782 16.3086C2.99998 15.6007 2.99999 14.7266 3 13.6428V10.3572C2.99999 9.27337 2.99998 8.39922 3.05782 7.69134C3.11737 6.96249 3.24318 6.3223 3.54497 5.73001C4.02433 4.7892 4.78924 4.0243 5.73005 3.54493C6.28633 3.26149 6.88399 3.13358 7.55735 3.06961C8.21919 3.00673 9.02103 3.00083 9.99922 3.00007C10.5515 2.99964 10.9996 3.447 11 3.99929Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </button>
              </Form>
            </span>
          </div>
        </header>

        {/* Liste des sessions de chat */}
        <div className="flex-1 overflow-auto px-3 text-white">
          <div className="relative mt-5 first:mt-0 last:mb-5">
            <div className="sticky top-0 z-20">
              <span className="flex h-9 items-center">
                <h3 className="px-2 text-xs font-semibold text-ellipsis overflow-hidden break-all pt-3 pb-2 ">
                  Aujourd’hui
                </h3>
              </span>
            </div>
            <ol>
              {sessionChats.length ? (
                sessionChats.map((sessionChat, index) => (
                  <li key={sessionChat.id}>
                    <div className="no-draggable group rounded-lg active:opacity-90  h-9 text-sm relative hover:bg-[#303030]">
                      <NavLink
                        to={`/chatSession/${sessionChat.id}`}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-[#303030] flex items-center gap-2 p-2 rounded-lg"
                            : " flex items-center gap-2 p-2 rounded-lg"
                        }
                      >
                        <div
                          className="relative grow overflow-hidden whitespace-nowrap"
                          dir="auto"
                          title={sessionChat.title}
                        >
                          {sessionChat.title || <i>No Title</i>}
                        </div>
                      </NavLink>
                      <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2">
                        <span data-state="closed">
                          <button
                            type="button"
                            id={`radix-${index}`}
                            data-testid={`history-item-${index}-options`}
                            aria-label="Ouvrir des options de conversation"
                            aria-haspopup="menu"
                            aria-expanded="false"
                            data-state="closed"
                            className=" cursor-pointer flex items-center justify-center text-[#5e5e5e] transition hover:text-[#b4b4b4] "
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
                              ></path>
                            </svg>
                          </button>
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <p>
                  <i>Aucune session de chat disponible</i>
                </p>
              )}
            </ol>
          </div>
        </div>

        {/* Footer de la sidebar */}
        <footer className="flex flex-col py-2 empty:hidden dark:border-white/20 px-3">
          <a
            className="group flex gap-2 p-2.5 text-sm cursor-pointer focus:ring-0 radix-disabled:pointer-events-none radix-disabled:opacity-50 items-center hover:bg-[#303030] rounded-lg"
            href="#"
          >
            <span className="flex w-full flex-row justify-between space-x-2">
              <div className="flex items-center gap-2 text-[#b4b4b4]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#5a5a5a] text-[#e1e1e1]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon-sm"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.5001 3.44338C12.1907 3.26474 11.8095 3.26474 11.5001 3.44338L4.83984 7.28868C4.53044 7.46731 4.33984 7.79744 4.33984 8.1547V15.8453C4.33984 16.2026 4.53044 16.5327 4.83984 16.7113L11.5001 20.5566C11.8095 20.7353 12.1907 20.7353 12.5001 20.5566L19.1604 16.7113C19.4698 16.5327 19.6604 16.2026 19.6604 15.8453V8.1547C19.6604 7.79744 19.4698 7.46731 19.1604 7.28868L12.5001 3.44338ZM10.5001 1.71133C11.4283 1.17543 12.5719 1.17543 13.5001 1.71133L20.1604 5.55663C21.0886 6.09252 21.6604 7.0829 21.6604 8.1547V15.8453C21.6604 16.9171 21.0886 17.9075 20.1604 18.4434L13.5001 22.2887C12.5719 22.8246 11.4283 22.8246 10.5001 22.2887L3.83984 18.4434C2.91164 17.9075 2.33984 16.9171 2.33984 15.8453V8.1547C2.33984 7.0829 2.91164 6.09252 3.83984 5.55663L10.5001 1.71133Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M9.44133 11.4454L9.92944 9.98105C10.0321 9.67299 10.4679 9.67299 10.5706 9.98105L11.0587 11.4454C11.2941 12.1517 11.8483 12.7059 12.5546 12.9413L14.019 13.4294C14.327 13.5321 14.327 13.9679 14.019 14.0706L12.5546 14.5587C11.8483 14.7941 11.2941 15.3483 11.0587 16.0546L10.5706 17.519C10.4679 17.827 10.0321 17.827 9.92944 17.519L9.44133 16.0546C9.2059 15.3483 8.65167 14.7941 7.94537 14.5587L6.48105 14.0706C6.17298 13.9679 6.17298 13.5321 6.48105 13.4294L7.94537 12.9413C8.65167 12.7059 9.2059 12.1517 9.44133 11.4454Z"
                      fill="currentColor"
                    ></path>
                    <path
                      d="M14.4946 8.05961L14.7996 7.14441C14.8638 6.95187 15.1362 6.95187 15.2004 7.14441L15.5054 8.05961C15.6526 8.50104 15.999 8.84744 16.4404 8.99458L17.3556 9.29965C17.5481 9.36383 17.5481 9.63617 17.3556 9.70035L16.4404 10.0054C15.999 10.1526 15.6526 10.499 15.5054 10.9404L15.2004 11.8556C15.1362 12.0481 14.8638 12.0481 14.7996 11.8556L14.4946 10.9404C14.3474 10.499 14.001 10.1526 13.5596 10.0054L12.6444 9.70035C12.4519 9.63617 12.4519 9.36383 12.6444 9.29965L13.5596 8.99458C14.001 8.84744 14.3474 8.50104 14.4946 8.05961Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </span>
              </div>
              <div className="flex flex-col">
                <span className=" text-white">Voir les plans</span>
                <span className="line-clamp-1 text-xs text-[#9d9d9d]">
                  Accès illimité, fonctionnalités pour les équipes, et plus
                  encore
                </span>
              </div>
            </span>
          </a>
        </footer>
      </aside>

      {/* Zone de détail (Outlet) */}
      <div
        id="detail"
        className={navigation.state === "loading" ? "loading flex-1" : "flex-1"}
      >
        <Outlet />
      </div>
    </div>
  );
}
