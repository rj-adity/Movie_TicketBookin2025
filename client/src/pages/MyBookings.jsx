import React, { useEffect, useState } from 'react'
// import { dummyBookingData } from '../assets/assets'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import { dateFormat } from '../lib/dateFormat'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MyBookings = () => {

  const {
      axios,
      getToken,
      user,
      image_base_url
    } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY

  const [bookings, setBookings] = useState([])
  const[isLoading, setIsLoading] = useState(true)
  const [regeneratingPayment, setRegeneratingPayment] = useState({})

  const getMyBookings = async () => {
    try {
      const {data} = await axios.get('/api/user/bookings', {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      })
      console.log("API Response Data:", data);
        if(data.success) {
          setBookings(data.bookings)
        }
    } catch (error) {
      console.log(error)
    }
    setIsLoading(false)
  }

  // Check if user just completed payment (URL parameter)
  const checkPaymentCompletion = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentCompleted = urlParams.get('payment_completed');
    if (paymentCompleted === 'true') {
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Show success message
      toast.success('Payment completed successfully! Your booking is now confirmed.');
    }
  }

  // Check if payment link is expired
  const isPaymentExpired = (booking) => {
    if (!booking.paymentExpiresAt) return false;
    const now = new Date();
    const expiryDate = new Date(booking.paymentExpiresAt);
    return now > expiryDate;
  }

  // Regenerate payment link
  const regeneratePayment = async (bookingId) => {
    try {
      setRegeneratingPayment(prev => ({ ...prev, [bookingId]: true }));
      
      const { data } = await axios.post(`/api/booking/regenerate-payment/${bookingId}`, {}, {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });

      if (data.success) {
        toast.success('New payment link generated!');
        // Refresh bookings to get updated payment link
        await getMyBookings();
      } else {
        toast.error(data.message || 'Failed to regenerate payment link');
      }
    } catch (error) {
      console.error('Error regenerating payment:', error);
      toast.error('Failed to regenerate payment link');
    } finally {
      setRegeneratingPayment(prev => ({ ...prev, [bookingId]: false }));
    }
  }

  useEffect(()=>{
    if(user){
      getMyBookings();
      checkPaymentCompletion();
    }
  },[user])

  // Auto-refresh bookings when user returns from payment
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        getMyBookings();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  return !isLoading ? (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
      <BlurCircle top="100px" left="100px" />
      <div>
       <BlurCircle bottom="0px" left="600px" /> 
      </div>
      <h1 className='text-lg font-semibold mb-4' >My bookings</h1>

      {bookings.map((item, index)=>(
        <div key={index} className={`flex flex-col md:flex-row justify-between border rounded-lg mt-4 p-2 max-w-3xl ${
          item.isPaid 
            ? 'bg-green-500/5 border-green-500/20' 
            : 'bg-primary/8 border-primary/20'
        }`}>
          <div className='flex flex-col md:flex-row'>
            <img src={ image_base_url +item.show.movie.poster_path} alt="" className='md:max-w-45 aspect-video h-auto object-cover object-bottom rounded'/>
            <div className='flex flex-col p-4'>
              <div className='flex items-center gap-2'>
                <p className='text-lg font-semibold' >{item.show.movie.title}</p>
                {item.isPaid && (
                  <div className='flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-green-500 text-xs font-medium'>Confirmed</span>
                  </div>
                )}
              </div>
              <p className='text-gray-400 text-sm' >{timeFormat(item.show.movie.runtime)}</p>
              <p className='text-gray-400 text-sm mt-auto' >{dateFormat(item.show.showDateTime)}</p>
            </div>
          </div>

            <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
              <div className='flex items-center gap-4'>
                <p className='text-2xl font-semibold mb-3'>{currency}{item.amount}</p>
                {!item.isPaid ? (
                  <div className='flex flex-col gap-2 mb-3'>
                    {isPaymentExpired(item) ? (
                      <button
                        onClick={() => regeneratePayment(item._id)}
                        disabled={regeneratingPayment[item._id]}
                        className='bg-orange-500 px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer hover:bg-orange-600 transition disabled:opacity-50'
                      >
                        {regeneratingPayment[item._id] ? 'Generating...' : 'Regenerate Payment Link'}
                      </button>
                    ) : (
                      <a 
                        href={item.paymentLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className='bg-primary px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer hover:bg-primary/80 transition inline-block text-center'
                      >
                        Pay Now
                      </a>
                    )}
                    {isPaymentExpired(item) && (
                      <p className='text-orange-500 text-xs'>Payment link expired. Click to regenerate.</p>
                    )}
                  </div>
                ) : (
                  <div className='flex items-center gap-2 mb-3'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span className='text-green-500 text-sm font-medium'>Paid</span>
                  </div>
                )}
              </div>
              <div className='text-sm'>
                <p><span className='text-gray-400'>Total Tickets:</span> {item.bookedSeats.length}</p>
                <p><span className='text-gray-400'>Seat Number:</span> {item.bookedSeats.join(", ")}</p>
                {item.isPaid ? (
                  <div className='mt-2'>
                    <p className='text-green-500 text-xs'>✓ Payment completed</p>
                    <p className='text-green-500 text-xs'>✓ Booking confirmed</p>
                  </div>
                ) : (
                  <div className='mt-2'>
                    <p className='text-orange-500 text-xs'>⚠ Payment pending</p>
                    {!isPaymentExpired(item) && item.paymentExpiresAt && (
                      <p className='text-gray-400 text-xs'>
                        Expires: {new Date(item.paymentExpiresAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

        </div>
      ))}

    </div>
  ) : <Loading />
}

export default MyBookings