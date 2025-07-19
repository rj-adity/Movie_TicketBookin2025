import React, { useState } from 'react';
import { dummyTrailers } from '../assets/assets';
import BlurCircle from './BlurCircle';
import { PlayCircle } from 'lucide-react';

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[3]);

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
      <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>Trailers</p>

      <div className='relative mt-6'>
        <BlurCircle top='-100px' right='-100px' />

       
        <div className="flex justify-center">
          <iframe
            width="960"
            height="540"
            src={currentTrailer.videoUrl.replace("watch?v=", "embed/")}
            title="YouTube trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="rounded-xl"
          ></iframe>
        </div>
      </div>
      <div className='group grid grid-cols-4 gap-4 md:gap-8 mt-8 max-w-3xl mx-auto'>
        {dummyTrailers.map((trailer)=>(
            <div key={trailer.image} className='relative group-hover:not-hover:opacity
            -50 hover:-translate-y-1 duration-300 transition max-md:h-60 
            md:max-h-60 cursor-pointer' onClick={()=> setCurrentTrailer(trailer)}>
                
                <img src={trailer.image} alt="trailer" className='rounded-lg w-full h-full object-cover brightness-75' />
                <PlayCircle strokeWidth={1.6} className="absolute top-1/2 left-1/2 w-5 md:w-8 h-5 md:h-12 transform -translate-x-1/2
                -translate-y-1/2" />
            </div>
        ))}

      </div>
    </div>
  );
};

export default TrailerSection;
