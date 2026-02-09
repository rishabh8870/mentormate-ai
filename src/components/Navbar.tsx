import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GraduationCap, Menu } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SAC
            </span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/ai-assistant" className="text-sm font-medium hover:text-primary transition-colors">
              AI Assistant
            </Link>
            <Link to="/career-planning" className="text-sm font-medium hover:text-primary transition-colors">
              Career Planning
            </Link>
            <Link to="/collaboration" className="text-sm font-medium hover:text-primary transition-colors">
              Collaboration Hub
            </Link>
            <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
              <Button size="sm" className="bg-gradient-accent">
                Get Started
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <Link to="/ai-assistant" className="text-sm font-medium hover:text-primary transition-colors">
                AI Assistant
              </Link>
              <Link to="/career-planning" className="text-sm font-medium hover:text-primary transition-colors">
                Career Planning
              </Link>
              <Link to="/collaboration" className="text-sm font-medium hover:text-primary transition-colors">
                Collaboration Hub
              </Link>
              <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
                About
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
                <Button size="sm" className="bg-gradient-accent">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
