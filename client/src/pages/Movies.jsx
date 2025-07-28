import React from 'react'
import MovieCard from '../components/MovieCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'

const Movies = () => {
  const { shows } = useAppContext()
  
  return shows?.length > 0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className='text-lg font-medium my-4'>Now Showing</h1>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {shows.map((movie) => (
          <MovieCard movie={movie} key={movie._id || movie.id} />
        ))}
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-screen'>
      <div className='text-center max-w-md'>
        <h1 className='text-3xl font-bold mb-4'>No Movies Currently Showing</h1>
        <p className='text-gray-400 mb-6'>
          No movies have been scheduled for showing yet. Please check back later or contact the admin to add movie shows.
        </p>
        <div className='text-sm text-gray-500'>
          <p>• Movies will appear here once shows are added by admin</p>
          <p>• You can only book movies that have scheduled shows</p>
          <p>• Check back regularly for new releases</p>
        </div>
      </div>
    </div>
  )
}

export default Movies
