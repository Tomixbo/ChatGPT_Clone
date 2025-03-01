import { Form, redirect, useNavigation } from "react-router";
import React, { useState, useRef } from "react";
import { CustomChatInit } from "../components/CustomChatInit";

const models = [
  "llama-3.3-70b-versatile",
  "qwen-2.5-coder-32b",
  "deepseek-r1-distill-qwen-32b",
];

export default function Home() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-[#212121] text-dark dark:text-white">
      {/* Header (full width, sticky at the top) */}
      <div className="sticky top-0 w-full p-3 mb-1.5 flex items-center justify-between z-10 h-14 font-semibold">
        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          <button
            type="button"
            aria-label="Sélecteur de modèle"
            onClick={() => setDropdownOpen(!isDropdownOpen)}
            className={`group flex cursor-pointer items-center gap-1 rounded-lg py-1.5 px-3 text-lg ${
              isDropdownOpen ? "bg-[#303030]" : ""
            } hover:bg-[#303030] dark:hover:bg-[#303030] font-semibold text-[#b4b4b4]`}
          >
            <span>{selectedModel}</span>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="icon-md text-token-text-tertiary transition-transform duration-200"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.29289 9.29289C5.68342 8.90237 6.31658 8.90237 6.70711 9.29289L12 14.5858L17.2929 9.29289C17.6834 8.90237 18.3166 8.90237 18.7071 9.29289C19.0976 9.68342 19.0976 10.3166 18.7071 10.7071L12.7071 16.7071C12.5196 16.8946 12.2652 17 12 17C11.7348 17 11.4804 16.8946 11.2929 16.7071L5.29289 10.7071C4.90237 10.3166 4.90237 9.68342 5.29289 9.29289Z"
                fill="currentColor"
              />
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute top-12 mt-3 w-72 p-3 bg-white dark:bg-[#303030] border border-gray-300 dark:border-[#505050] rounded-lg shadow-md z-50">
              <p className="text-sm text-[#b4b4b4] px-2 py-1">Modèle</p>
              {models.map((model) => (
                <button
                  key={model}
                  onClick={() => {
                    setSelectedModel(model);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-2 rounded-lg hover:bg-[#505050] dark:hover:bg-[#505050] ${
                    model === selectedModel ? "font-bold" : "font-light"
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Ouvrir le menu de profil"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:bg-gray-200 dark:focus-visible:bg-gray-700 focus-visible:outline-0"
          >
            <div className="overflow-hidden rounded-full">
              <img
                src="https://s.gravatar.com/avatar/d598aeaf6ffb18782975dae32738df3b?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fwx.png"
                alt="User"
                width="32"
                height="32"
                className="rounded-sm"
                referrerPolicy="no-referrer"
              />
            </div>
          </button>
        </div>
      </div>
      <div className="w-full h-full flex flex-col justify-center items-center">
        {/* Title */}
        <div className="mx-auto justify-center text-center text-3xl font-semibold leading-9 mb-8 w-full max-w-md">
          <h1>Comment puis-je vous aider&nbsp;?</h1>
        </div>
        {/* Section d'envoi du message */}
        <div className="md:pt-0 dark:border-white/20 md:border-transparent md:dark:border-transparent w-full">
          <div>
            <div className="m-auto text-base px-3 md:px-5 w-full lg:px-4 xl:px-5">
              <div className="mx-auto flex flex-1 gap-4 text-base md:gap-5 lg:gap-6 md:max-w-3xl lg:max-w-[40rem] xl:max-w-[48rem]">
                {/* CustomChatForm for message submission */}
                <CustomChatInit selectedModel={selectedModel} />
              </div>
            </div>
            <div className="relative w-full px-2 py-2 text-center text-xs text-[#e8e8e8] empty:hidden md:px-[60px]">
              <div className="min-h-4">
                <div>
                  L'IA peut faire des erreurs. Pensez à vérifier les
                  informations importantes.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
