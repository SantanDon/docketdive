'use client';

import { useChat } from "@/app/context/ChatContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StudentModeSelector() {
    const { mode, eliLevel, setEliLevel, toggleStudentMode } = useChat();

    if (mode !== "student") {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={toggleStudentMode}
                className="h-9 gap-2 border-dashed"
            >
                <GraduationCap className="h-4 w-4" />
                Student Mode
            </Button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-9 gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800">
                        <GraduationCap className="h-4 w-4" />
                        <span className="font-medium">{eliLevel}</span>
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setEliLevel("ELI5")}>
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">ELI5 (5-year-old)</span>
                            <span className="text-xs text-muted-foreground">Simple words, easy examples</span>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEliLevel("ELI15")}>
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">ELI15 (Teenager)</span>
                            <span className="text-xs text-muted-foreground">Clear explanations, relatable</span>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEliLevel("ELI25")}>
                        <div className="flex flex-col gap-1">
                            <span className="font-medium">ELI25 (Young Adult)</span>
                            <span className="text-xs text-muted-foreground">Detailed, proper terminology</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Button
                variant="ghost"
                size="icon"
                onClick={toggleStudentMode}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                title="Exit Student Mode"
            >
                <span className="sr-only">Exit</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            </Button>
        </div>
    );
}
