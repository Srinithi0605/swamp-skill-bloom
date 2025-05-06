import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/AuthContext';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
  };

  const getInitials = () => {
    if (!user || !user.name) return 'U';
    const names = user.name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-swamp text-xl font-bold">SkillSwap</span>
              <div className="ml-2 text-primary text-xl animate-wave">🤝</div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="text-swamp hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/matches" className="text-swamp hover:text-primary transition-colors">
                  Matches
                </Link>
                <Link to="/waitlist" className="text-swamp hover:text-primary transition-colors">
                  Waiting List
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/signin')} className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button onClick={() => navigate('/signup')} className="bg-primary hover:bg-primary-dark transition-colors">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-swamp hover:text-primary hover:bg-neutral focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
                  Dashboard
                </Link>
                <Link to="/matches" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
                  Matches
                </Link>
                <Link to="/waitlist" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
                  Waiting List
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
                  Sign In
                </Link>
                <Link to="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary bg-primary text-white hover:bg-primary-dark">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
