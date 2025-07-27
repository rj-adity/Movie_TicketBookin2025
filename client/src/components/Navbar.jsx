import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { MenuIcon, SearchIcon, TicketPlus, XIcon, Heart } from 'lucide-react'; // Added Heart icon for a nice touch
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { useAppContext } from '../context/AppContext';

const Navbar = () => {
  // Get the state and user from the context and Clerk
  const { favoriteMovies } = useAppContext();
  const { user } = useUser();
  const { openSignIn } = useClerk();
  
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Helper function to close the menu and scroll to the top
  const handleLinkClick = () => {
    setIsOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className='fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-black/50 backdrop-blur-sm'>
      <Link to='/' onClick={handleLinkClick} className='max-md:flex-1'>
        <img src={assets.logo} alt="Logo" className='w-36 h-auto' />
      </Link>

      {/* Main Navigation Links */}
      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 md:px-8 py-3 max-md:h-screen md:rounded-full bg-black/80 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-transform duration-300 ease-in-out ${isOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}>
        <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer' onClick={() => setIsOpen(false)} />

        <Link onClick={handleLinkClick} to='/'>Home</Link>
        <Link onClick={handleLinkClick} to='/movies'>Movies</Link>
        <Link onClick={handleLinkClick} to='/theaters'>Theaters</Link>
        <Link onClick={handleLinkClick} to='/releases'>Releases</Link>
        
        {/* --- FAVORITES LINK LOGIC --- */}
        {/* This will only render if the user is logged in and has favorite movies. [1, 5] */}
        {user && favoriteMovies.length > 0 && (
          <Link 
            onClick={handleLinkClick} 
            to='/favorites' // Changed to /favorites for consistency
            className="flex items-center gap-2"
          >
            <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
            Favorites
          </Link>
        )}
        {/* --- END OF FAVORITES LINK LOGIC --- */}
      </div>

      {/* Right side icons and login button */}
      <div className='flex items-center gap-8'>
        <SearchIcon className='max-md:hidden w-6 h-6 cursor-pointer' />
        {
          !user ? (
            <button
              onClick={() => openSignIn()}
              className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
              Login
            </button>
          ) : (
            <UserButton afterSignOutUrl='/'>
              <UserButton.MenuItems>
                <UserButton.Action 
                  label="My Bookings" 
                  labelIcon={<TicketPlus width={15}/>} 
                  onClick={() => {
                    handleLinkClick();
                    navigate('/my-bookings');
                  }} 
                />
              </UserButton.MenuItems>
            </UserButton>
          )
        }
        <MenuIcon
          className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer'
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
    </div>
  );
};

export default Navbar;