import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const Loading = () => {

  const {next_url} = useParams()
  const navigate =  useNavigate()
  
  useEffect(() => {
    if(next_url){
      setTimeout(() => {
        navigate('/'+ next_url)
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
