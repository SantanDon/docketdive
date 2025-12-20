import { Button } from "@/components/ui/button";
import {
  Menu,
  User,
  Scale,
  Settings,
  LogOut
} from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { useChat } from "@/app/context/ChatContext";
import { StudentModeSelector } from "@/components/StudentModeSelector";
import { ModelSelector } from "@/components/ModelSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
}

export default function Header({ sidebarOpen, setSidebarOpen, isMobile }: HeaderProps) {
  const {
    setShowLogin
  } = useChat();

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-10 h-16 flex items-center justify-between px-4 transition-all duration-200">
      <div className="flex items-center">
        {isMobile && !sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="font-bold text-lg flex items-center tracking-tight">
          <div className="bg-gradient-to-br from-legal-blue-600 to-cyan-600 text-white p-1.5 rounded-lg mr-2 shadow-sm">
            <Scale className="h-4 w-4" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-legal-blue-700 to-cyan-600 dark:from-legal-blue-400 dark:to-cyan-400">
            DocketDive
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ModelSelector />
        <StudentModeSelector />

        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        <ModeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowLogin(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}