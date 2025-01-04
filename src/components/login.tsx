'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Something went wrong');
      } else {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        router?.push('/');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <div className='flex justify-center items-center h-screen bg-gray-100'>
      <div className='w-full max-w-md bg-white p-8 rounded-lg shadow-md'>
        <h1 className='text-2xl font-bold mb-6 text-center'>Login</h1>
        <form onSubmit={handleLogin} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Email</label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Password</label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
          {error && <p className='text-red-500 text-sm'>{error}</p>}
          <button
            type='submit'
            className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700'
          >
            Login
          </button>
        </form>
        <p className='text-sm text-center mt-4'>
          Don&apos;t have an account?{' '}
          <a href='/signup' className='text-blue-500 hover:underline'>
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
