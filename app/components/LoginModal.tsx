"use client";

import { useState } from "react";
import { X, LogIn, Shield, Scale, CheckCircle } from "lucide-react";
import Image from "next/image";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

/**
 * Modern Login Modal
 * - Clean, professional design
 * - Demo authentication
 */
export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    onLogin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-8 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Scale size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">DocketDive</h1>
                <p className="text-blue-100 text-sm">Legal Intelligence</p>
              </div>
            </div>
            
            <p className="text-blue-50">
              Your AI-powered legal research assistant for South African law
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                  <Shield size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Secure</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                  <Scale size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">SA Law</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Verified</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
              🔒 Demo Mode: Use any credentials to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
