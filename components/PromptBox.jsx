import { assets } from "@/public/assets";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import Image from "next/image";
import React, { useState } from "react";
import toast from "react-hot-toast";

const handleBackground = (e) => {
  const button = e.currentTarget;
  if (
    !(
      button.classList.contains("isActive") &&
      button.querySelector("path").classList.contains("isActiveIcon")
    )
  ) {
    button.classList.add("isActive");
    button.querySelectorAll("path")[0].classList.add("isActiveIcon");
    button.querySelectorAll("path")[1].classList.add("isActiveIcon");
  } else {
    button.classList.remove("isActive");
    button.querySelectorAll("path")[0].classList.remove("isActiveIcon");
    button.querySelectorAll("path")[1].classList.remove("isActiveIcon");
  }
};

const PromptBox = ({ isLoading, setIsLoading }) => {
  const [prompt, setPrompt] = useState("");
  const { user, chats, setChats, selectedChat, setSelectedChat } =
    useAppContext();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e);
    }
  };

  const sendPrompt = async (e) => {
    const promptCopy = prompt;

    try {
      e.preventDefault();
      if (!user) return toast.error("Login to send message");
      if (isLoading)
        return toast.error("Wait for the previous prompt response");

      setIsLoading(true);
      setPrompt("");

      const userPrompt = {
        role: "user",
        content: prompt,
        timestamp: Date.now(),
      };

      // Saving user prompt in chats array
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === selectedChat._id
            ? {
                ...chat,
                messages: [...chat.messages, userPrompt],
              }
            : chat,
        ),
      );

      // Saving user prompt in selected chat
      setSelectedChat((prev) => ({
        ...prev,
        messages: [...prev.messages, userPrompt],
      }));

      const { data } = await axios.post("/api/chat/ai", {
        chatId: selectedChat._id,
        prompt,
      });

      if (data.success) {
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === selectedChat._id
              ? { ...chat, messages: [...chat.messages, data.data] }
              : chat,
          ),
        );

        const message = data.data.content;
        const messageTokens = message.split(" ");
        let assistantMessage = {
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        setSelectedChat((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
        }));

        for (let i = 0; i < messageTokens.length; i++) {
          setTimeout(() => {
            assistantMessage.content = messageTokens.slice(0, i + 1).join(" ");
            setSelectedChat((prev) => {
              const updatedMessages = [
                ...prev.messages.slice(0, -1),
                assistantMessage,
              ];

              return { ...prev, messages: updatedMessages };
            });
          }, i * 100);
        }
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      toast.error(error.message);
      setPrompt(promptCopy);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={sendPrompt}
      className={`w-full text-black ${
        selectedChat?.messages.length > 0 ? "max-w-3xl" : "max-w-2xl"
      } bg-secondary mt-4 rounded-3xl p-4 transition-all`}
    >
      <textarea
        onKeyDown={handleKeyDown}
        spellCheck="false"
        className="w-full resize-none overflow-hidden bg-transparent text-lg break-words outline-none lg:text-xl"
        rows={2}
        placeholder="Message Atlas..."
        required
        onChange={(e) => setPrompt(e.target.value)}
        value={prompt}
      />

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-full border border-[#fd5c02] px-2 py-1 text-sm"
          onClick={handleBackground}
        >
          <svg
            width="20"
            height="20"
            className="group h-5"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className=""
              d="M2.65602 17.3439C1.64002 16.3289 1.50602 14.5939 2.34302 12.4189C2.66802 11.5939 3.07302 10.8019 3.54802 10.0539L3.58202 9.99995L3.54902 9.94595C3.04902 9.14695 2.63902 8.34995 2.34302 7.58095C1.50702 5.40595 1.64002 3.67095 2.65602 2.65495C3.21602 2.09495 4.02002 1.79495 4.99102 1.79495C6.41602 1.79495 8.15902 2.43095 9.94802 3.55095L10.001 3.58495L10.054 3.55095C11.844 2.43095 13.586 1.79395 15.011 1.79395C15.983 1.79395 16.787 2.09395 17.346 2.65395C18.36 3.66895 18.494 5.40595 17.658 7.57995C17.3324 8.40497 16.9286 9.19692 16.452 9.94495L16.418 9.99895L16.452 10.0519C16.952 10.8519 17.362 11.6479 17.657 12.4169C18.494 14.5919 18.361 16.3279 17.346 17.3429C16.786 17.9029 15.982 18.2039 15.011 18.2039C13.586 18.2039 11.843 17.5669 10.054 16.4469L10 16.4149L9.94702 16.4479C8.15702 17.5679 6.41502 18.2049 4.99002 18.2049C4.01802 18.2049 3.21402 17.9049 2.65502 17.3449L2.65602 17.3439ZM16.287 12.9449C16.1 12.4569 15.858 11.9569 15.577 11.4529L15.502 11.3209L15.41 11.4409C14.2615 12.927 12.9281 14.2605 11.442 15.4089L11.322 15.5019L11.454 15.5759C12.762 16.3099 14.013 16.7379 15.01 16.7379C15.573 16.7379 16.016 16.5999 16.308 16.3079C16.608 16.0079 16.744 15.5339 16.736 14.9619C16.728 14.3869 16.577 13.6979 16.287 12.9449ZM9.94202 14.5949L10 14.6369L10.058 14.5949C11.811 13.3394 13.3481 11.8071 14.609 10.0579L14.652 9.99995L14.609 9.94195C13.9783 9.06788 13.2784 8.2459 12.516 7.48395C11.7547 6.72481 10.9326 6.02916 10.058 5.40394L10 5.36395L9.94202 5.40595C8.18877 6.66112 6.65136 8.19312 5.39002 9.94195L5.34802 9.99995L5.39002 10.0589C6.02102 10.9329 6.72202 11.7539 7.48402 12.5159C8.24534 13.2751 9.06741 13.9697 9.94202 14.5949ZM16.308 3.69295C16.015 3.39995 15.572 3.26195 15.01 3.26195C14.012 3.26195 12.762 3.69095 11.454 4.42495L11.322 4.49895L11.442 4.59095C12.9291 5.7383 14.2627 7.07187 15.41 8.55895L15.502 8.67895L15.576 8.54695C15.858 8.04294 16.1 7.54294 16.287 7.05494C16.577 6.30194 16.729 5.61295 16.737 5.03795C16.744 4.46595 16.608 3.99295 16.308 3.69295ZM3.71202 7.05494C3.91402 7.56894 4.15202 8.06795 4.42402 8.54795L4.49802 8.67795L4.59002 8.55895C5.73739 7.07188 7.07096 5.73831 8.55802 4.59095L8.67802 4.49895L8.54602 4.42495C7.23802 3.68995 5.98702 3.26195 4.99002 3.26195C4.42702 3.26195 3.98402 3.39995 3.69202 3.69195C3.39202 3.99295 3.25602 4.46595 3.26402 5.03795C3.27102 5.61295 3.42302 6.30194 3.71202 7.05494ZM3.71202 12.9449C3.42202 13.6979 3.27202 14.3869 3.26402 14.9619C3.25602 15.5339 3.39102 16.0069 3.69202 16.3069C3.98502 16.5999 4.42802 16.7379 4.99002 16.7379C5.98702 16.7379 7.23702 16.3099 8.54602 15.5759L8.67702 15.5019L8.55702 15.4089C7.07031 14.2615 5.73708 12.9279 4.59002 11.4409L4.49702 11.3209L4.42302 11.4529C4.15152 11.9329 3.91427 12.4315 3.71302 12.9449H3.71202Z"
              fill="black"
              stroke="black"
              strokeWidth="0.1"
            />
            <path
              id="iconDot"
              d="M10.706 11.7041C10.4257 11.8207 10.121 11.8663 9.81892 11.8368C9.51682 11.8073 9.22668 11.7037 8.97427 11.5351C8.72187 11.3665 8.51501 11.1381 8.37208 10.8704C8.22915 10.6026 8.15457 10.3037 8.15497 10.0001C8.15487 9.66599 8.2455 9.33809 8.4172 9.05145C8.58891 8.76481 8.83523 8.53017 9.12987 8.3726C9.42452 8.21502 9.75642 8.14041 10.0902 8.15675C10.4239 8.17308 10.7469 8.27974 11.0248 8.46534C11.3026 8.65093 11.5249 8.9085 11.6678 9.21054C11.8106 9.51258 11.8688 9.84775 11.8361 10.1803C11.8034 10.5128 11.6809 10.8302 11.4819 11.0986C11.2829 11.367 11.0147 11.5763 10.706 11.7041Z"
              strokeWidth="0.2"
              className="fill-black stroke-black"
            />
          </svg>
          DeepThink
        </button>

        <button
          className={`${
            prompt ? "bg-primary" : "bg-[#71717a]"
          } cursor-pointer rounded-full p-2`}
        >
          <Image
            className="aspect-square w-3.5"
            src={prompt ? assets.arrow_icon : assets.arrow_icon_dull}
            alt={prompt ? "arrow icon" : "arrow icon dull"}
          />
        </button>
      </div>
    </form>
  );
};

export default PromptBox;
