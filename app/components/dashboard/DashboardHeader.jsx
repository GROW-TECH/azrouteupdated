// components/dashboard/DashboardHeader.jsx
"use client";

import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { Bell, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";

export function DashboardHeader({ userType }) {
 const { user, isAuthenticated, isLoading } = useKindeAuth();

 return (
   <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
     <div className="flex h-16 items-center px-4 lg:px-8">
       <Link href="/" className="flex items-center text-2xl font-bold">
         ConnectEd
       </Link>
       
       <div className="flex items-center space-x-4 lg:space-x-6 ml-8">
         <div className="hidden md:flex items-center space-x-4">
           <Input
             type="search"
             placeholder="Search..."
             className="w-64 lg:w-96"
           />
         </div>
       </div>

       <div className="ml-auto flex items-center space-x-4">
         <Button variant="ghost" size="icon" className="relative">
           <Bell className="h-5 w-5" />
           <span className="absolute top-0 right-0 h-2 w-2 bg-red-600 rounded-full" />
         </Button>

         <DropdownMenu>
           <DropdownMenuTrigger asChild>
             <Button variant="ghost" className="relative h-10 w-10 rounded-full">
               <Avatar>
                 <AvatarImage src={"/avatars/01.png"} alt={user?.given_name || 'Profile'} />
                 <AvatarFallback>
                   {userType === 'teacher' ? 'T' : 'S'}
                 </AvatarFallback>
               </Avatar>
             </Button>
           </DropdownMenuTrigger>
           <DropdownMenuContent align="end" className="w-56">
             <DropdownMenuLabel>My Account</DropdownMenuLabel>
             <DropdownMenuSeparator />
             <DropdownMenuItem>
               <Link href="/dashboard/student/profile" className="w-full">Profile</Link>
             </DropdownMenuItem>
             <DropdownMenuItem>
               <Link href="/dashboard/student/settings" className="w-full">Settings</Link>
             </DropdownMenuItem>
             <DropdownMenuSeparator />
             <DropdownMenuItem 
               className="text-red-600 focus:text-red-600"
             >
               <LogOut className="mr-2 h-4 w-4" />
               <Link href="/api/auth/logout">Log out</Link>
             </DropdownMenuItem>
           </DropdownMenuContent>
         </DropdownMenu>
       </div>
     </div>
   </header>
 );
}