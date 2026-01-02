import { FaSpinner } from 'react-icons/fa';

export default function Spinner({ size = 'medium', color = 'light' }) {
  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-lg',
    large: 'text-2xl',
  };

  const colorClasses = {
    light: 'text-white',
    dark: 'text-gray-800',
  };

  return (
    <div className='flex items-center justify-center space-x-2'>
      <FaSpinner
        className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}
      />
      <span className={`${colorClasses[color]} text-md font-medium`}>
        Loading...
      </span>
    </div>
  );
}
