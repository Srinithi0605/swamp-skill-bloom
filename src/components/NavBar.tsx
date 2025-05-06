
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Toggle for demo purposes
  const toggleLogin = () => {
    const newState = !isLoggedIn;
    setIsLoggedIn(newState);
    
    if (newState) {
      toast({
        title: "Signed in successfully",
        description: "Welcome back to SkillSwamp!",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/');
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-swamp text-xl font-bold">SkillSwamp</span>
              <div className="ml-2 text-primary text-xl animate-wave">🌿</div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link to="/dashboard" className="text-swamp hover:text-primary transition-colors">
              Dashboard
            </Link>
            <Link to="/matches" className="text-swamp hover:text-primary transition-colors">
              Matches
            </Link>
            <Link to="/waitlist" className="text-swamp hover:text-primary transition-colors">
              Waiting List
            </Link>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">US</AvatarFallback>
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
                  <DropdownMenuItem onClick={toggleLogin}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={toggleLogin} className="bg-primary hover:bg-primary-dark transition-colors">
                Sign In
              </Button>
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
            <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
              Dashboard
            </Link>
            <Link to="/matches" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
              Matches
            </Link>
            <Link to="/waitlist" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
              Waiting List
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary">
                  Profile
                </Link>
                <button
                  onClick={toggleLogin}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-swamp hover:bg-neutral hover:text-primary"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={toggleLogin}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-primary text-white hover:bg-primary-dark"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
