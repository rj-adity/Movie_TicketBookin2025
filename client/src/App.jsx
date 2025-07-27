import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import { useAppContext } from './context/AppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'




const App = () => {
  
  const isAdminRoute= useLocation().pathname.startsWith('/admin')

  const {user, isAdmin, isAdminLoading} = useAppContext()
  return (
    <>
    <Toaster />
   {!isAdminRoute && <Navbar/>}
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/movies' element={<Movies/>} />
      <Route path='/movies/:id' element={<MovieDetails/>} />
      <Route path='/movies/:id/:date' element={<SeatLayout/>} />
      <Route path='/my-bookings' element={<MyBookings/>} />
      <Route path='/loading/:next_url' element={<Loading/>} />
      <Route path='/favorites' element={<Favorite/>} />
      <Route path='/admin/*' element={user && isAdmin ? <Layout/>: (
        <div className='min-h-screen flex items-center justify-center'>
          {!user ? (
            <SignIn fallbackRedirectUrl={'/admin'} />
          ) : (
            <div className='text-center'>
              <h2 className='text-2xl font-bold text-red-600 mb-4'>Access Denied</h2>
              <p className='text-gray-600 mb-4'>You don't have admin privileges to access this page.</p>
              <button
                onClick={() => window.location.href = '/'}
                className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600'
              >
                Go to Home
              </button>
            </div>
          )}
        </div>
      )} >
        <Route  index element={<Dashboard/>}/>
        <Route  path='add-shows' element={<AddShows/>}/>
        <Route  path='list-shows' element={<ListShows/>}/>
        <Route  path='list-bookings' element={<ListBookings/>}/>
        
      </Route>
    </Routes>
    {!isAdminRoute && <Footer/>}
    
    </>
  )
}

export default App