import React from "react";
import { useChat } from "@/app/context/ChatContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Cpu, Zap } from "lucide-react";

export function ModelSelector() {
    const { provider, setProvider } = useChat();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 hidden md:flex border-legal-blue-200 dark:border-legal-blue-800"
                >
                    {provider === "ollama" ? (
                        <>
                            <Cpu className="h-4 w-4 text-legal-blue-600 dark:text-legal-blue-400" />
                            <span className="text-xs font-medium">Local (Ollama)</span>
                        </>
                    ) : (
                        <>
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="text-xs font-medium">Cloud (Groq)</span>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setProvider("ollama")}>
                    <Cpu className="mr-2 h-4 w-4 text-legal-blue-600" />
                    <span>Local (Ollama)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProvider("groq")}>
                    <Zap className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Cloud (Groq)</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
