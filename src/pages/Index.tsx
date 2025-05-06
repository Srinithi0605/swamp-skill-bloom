
import { Link } from 'react-router-dom';
import NavBar from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-neutral to-white py-20 flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-swamp">
                Swap Skills,<br />Grow Together.
              </h1>
              <p className="text-xl md:text-2xl text-swamp-light">
                Teach what you know.<br />Learn what you don't.
              </p>
              <div className="pt-4">
                <Link to="/dashboard">
                  <Button className="bg-primary hover:bg-primary-dark text-white px-8 py-6 text-lg rounded-lg transition-all transform hover:scale-105">
                    Join the Swamp
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary rounded-lg transform -rotate-6 animate-float"></div>
                <div className="absolute top-10 left-10 w-64 h-64 bg-secondary rounded-lg transform rotate-3 animate-float animation-delay-1000"></div>
                <div className="absolute top-5 left-5 w-64 h-64 flex items-center justify-center bg-white rounded-lg shadow-lg z-10 overflow-hidden">
                  <div className="text-6xl">🌿</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
            <path fill="#57CC99" fillOpacity="0.2" d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,218.7C672,224,768,224,864,208C960,192,1056,160,1152,165.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-swamp">How SkillSwamp Works</h2>
            <p className="mt-4 text-lg text-swamp-light">Exchange your knowledge in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-semibold text-swamp mb-2">Share Your Skills</h3>
                  <p className="text-swamp-light">List skills you can teach and ones you want to learn</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-semibold text-swamp mb-2">Find Matches</h3>
                  <p className="text-swamp-light">Get paired with people who want what you offer</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-swamp rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-semibold text-swamp mb-2">Exchange Skills</h3>
                  <p className="text-swamp-light">Meet, learn, teach, and grow together</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Skills Section */}
      <section className="py-16 bg-neutral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-swamp">Popular Skills on SkillSwamp</h2>
            <p className="mt-4 text-lg text-swamp-light">Discover the most exchanged skills in our community</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {["Coding", "Languages", "Cooking", "Photography", "Music", "Design", 
              "Writing", "Public Speaking", "Gardening", "Yoga"].map((skill) => (
              <div 
                key={skill}
                className="bg-white px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-tr from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6">Ready to share your knowledge?</h2>
          <p className="text-lg mb-8 text-white/90">Join our community of skill swappers and grow together!</p>
          <Link to="/dashboard">
            <Button className="bg-white text-primary hover:bg-neutral px-8 py-6 text-lg rounded-lg transition-all transform hover:scale-105">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-swamp text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold flex items-center">
                SkillSwamp <span className="ml-2">🌿</span>
              </h3>
              <p className="text-white/70 mt-1">Swap Skills, Grow Together.</p>
            </div>
            <div className="flex space-x-8">
              <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
              <Link to="/about" className="hover:text-secondary transition-colors">About</Link>
              <Link to="/privacy" className="hover:text-secondary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-secondary transition-colors">Terms</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/20 text-center text-white/60">
            <p>&copy; {new Date().getFullYear()} SkillSwamp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
