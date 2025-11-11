import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 z-50 flex flex-col items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-400 rounded-full blur-3xl opacity-15 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-400 rounded-full blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 text-center">
        {/* Loading GIF */}
        <div className="mb-8 animate-pulse">
          <Image
            src="/loading.gif"
            alt="Loading..."
            width={200}
            height={200}
            className="w-40 h-40 md:w-56 md:h-56 mx-auto drop-shadow-lg"
            priority
          />
        </div>
        
        {/* Logo and Branding */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-slate-900 to-green-600 bg-clip-text text-transparent">
              NaCCER Portal
            </h1>
            <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse animation-delay-500"></div>
          </div>
          <div className="text-sm text-slate-500 font-medium mb-8">
            National Centre for Centres for Engineering Research
          </div>
        </div>
        
        {/* Loading Text */}
        <p className="text-slate-700 text-xl font-semibold mb-8 animate-pulse">
          Developed by Team :ByteSpace
        </p>
        <p className="text-slate-700 text-xl font-semibold mb-8 animate-pulse">
          SIH TEAM ID : 72110
        </p>
        
        {/* Loading Animation Dots */}
        <div className="flex justify-center space-x-3">
          <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full animate-bounce shadow-lg"></div>
          <div className="w-4 h-4 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full animate-bounce animation-delay-200 shadow-lg"></div>
          <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-bounce animation-delay-400 shadow-lg"></div>
        </div>
      </div>
    </div>
  );
}