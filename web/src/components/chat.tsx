import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { useForm } from "react-hook-form";
import { AiOutlineArrowUp } from "react-icons/ai"; // Import the arrow icon

// Chat Component
interface ChatFormData {
  message: string;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  );
  const { register, handleSubmit, reset } = useForm<ChatFormData>();

  // Reference for the last message to scroll to
  const lastMessageRef = useRef<HTMLDivElement | null>(null);


  const onSubmit = async (data: { message: string }) => {
    // Add the user's message and reset the form
    setMessages([...messages, { text: data.message, sender: "user" }]);
    reset();

    // Simulate the assistant's response
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "This is a response from the assistant.", sender: "assistant" },
      ]);
    }, 1000);
  };

  // Scroll to the last message whenever messages change
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // This runs every time the `messages` array is updated

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <h2 className="text-xl font-bold">Chat</h2>
      </CardHeader>

      {/* Message Display */}
      <div className="flex overflow-auto p-8 space-y-4 justify-right flex-auto items-center flex-col">
        {messages.map((msg, index) => (
          <div
            key={index}
            ref={index === messages.length - 1 ? lastMessageRef : null} // Only set the ref for the last message
            className={`p-3 rounded-lg   ${
              msg.sender === "user"
                ? "bg-gray-200 text-black self-end" 
                : "bg-gray-400 text-black self-start"
            } max-w-[80%]`}
          >
            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <CardFooter className="w-full flex items-center space-y-2 text-white">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex space-x-2 items-center"
        >
          {/* Input area with fixed size of 50px*/}
          <div className="relative w-full overflow-auto bg-gray-200 rounded-lg">
            <Textarea
              {...register("message")}
              placeholder="Type your message..."
              className="w-full min-h-[10vh] max-h-[15vh] border-2 border-gray-300 rounded-lg focus:outline-none p-4 resize-none text-black placeholder-black"
            />
            {/* Send button in the bottom-right corner */}
            <Button
              type="submit"
              className="absolute right-3 bottom-4 bg-gray-500 p-5 disabled:opacity-50 rounded-full"
              disabled={!register("message")}
            >
              <AiOutlineArrowUp size={25} />
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
};
