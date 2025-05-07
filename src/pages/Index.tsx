import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <NavBar />
      
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
            Swap Skills, Grow Together.
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Teach what you know. Learn what you don't.
          </p>
          
          {isAuthenticated ? (
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')} 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-lg shadow-md"
            >
              Go to Dashboard
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/signup')} 
                className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-lg shadow-md"
              >
                Join the Swap
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/signin')} 
                className="border-primary text-primary hover:bg-primary/10 px-8 py-6 text-lg rounded-lg"
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3">Share Your Skills</h3>
            <p className="text-gray-600">
              Create a profile showcasing the skills you can teach others. Whether it's coding, cooking, or carpentry, there's someone eager to learn.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3">Find Your Match</h3>
            <p className="text-gray-600">
              We'll match you with others who have complementary skill sets. Teach what you know, learn what you don't - it's that simple.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-3">Grow Together</h3>
            <p className="text-gray-600">
              Connect virtually or in-person to exchange knowledge. Leave reviews, track progress, and build lasting connections.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
