import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const Loading = () => {

  const {next_url} = useParams()
  const navigate =  useNavigate()
  
  useEffect(() => {
    if(next_url){
      setTimeout(() => {
        // Preserve URL parameters when redirecting
        const urlParams = new URLSearchParams(window.location.search);
        const paymentCompleted = urlParams.get('payment_completed');
        const redirectUrl = paymentCompleted ? `/${next_url}?payment_completed=true` : `/${next_url}`;
        navigate(redirectUrl);
      }, 8000)
    }
  }, [next_url, navigate])

  return (
    <div className='flex justify-center items-center h-[80vh]' >
        <div className='animate-spin rounded-full h-14 w-14 border-2 border-t-primary' ></div>
    </div>
  )
}

export default Loading
