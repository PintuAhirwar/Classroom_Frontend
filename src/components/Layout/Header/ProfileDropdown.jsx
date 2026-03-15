"use client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfileDropdown({ user, onLogout }) {
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2">
        <Avatar>
          {user?.profile_pic ? (
            <AvatarImage src={user.profile_pic} alt={user.name} />
          ) : (
            <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
          )}
        </Avatar>
        <span className="font-medium">Hi, {user?.name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/my-orders">My Orders</Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onLogout}
          className="text-red-500 cursor-pointer"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
