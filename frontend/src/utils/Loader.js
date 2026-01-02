import { FaWhatsapp } from 'react-icons/fa';

export default function Loader({ progress = 0 }) {
  return (
    <div className='fixed inset-0 bg-gradient-to-br from-green-400 to-blue-500 flex flex-col items-center justify-center z-50'>
      {/* Whatsapp Circle */}
      <div className='w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 animate-pulse'>
        <FaWhatsapp className='w-16 h-16 text-green-500' />
      </div>

      {/* Progress Bar Container */}
      <div className='w-64 bg-white bg-opacity-30 rounded-full h-2 mb-4'>
        <div
          className='bg-white h-full rounded-full transition-all duration-500'
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Loading Text */}
      <p className='text-white text-lg font-semibold'>Loading... {progress}%</p>
    </div>
  );
}
