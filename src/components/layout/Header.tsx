import Navigation from './Navigation';
import ConnectButton from '../wallet/ConnectButton';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#0f0f0f]/80 backdrop-blur-lg border-b border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DEX</span>
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">DEX Interface</span>
            </div>
            <Navigation />
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
