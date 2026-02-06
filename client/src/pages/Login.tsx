import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Resonant</h1>
          <p className="text-[#b3b3b3]">Your personal music player</p>
        </div>

        {/* Form */}
        <div className="bg-[#121212] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Log in to continue
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-md p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-4 py-3 bg-[#242424] border border-[#535353] rounded-md text-white placeholder-[#6a6a6a] focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full px-4 py-3 bg-[#242424] border border-[#535353] rounded-md text-white placeholder-[#6a6a6a] focus:outline-none focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1ed760] text-black font-bold rounded-full hover:bg-[#1db954] transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#b3b3b3]">
              Don't have an account?{' '}
              <Link to="/register" className="text-white hover:underline font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
