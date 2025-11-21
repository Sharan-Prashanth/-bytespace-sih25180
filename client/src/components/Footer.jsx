export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* Social Media Section */}
      <div className="relative z-10 border-b border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Connect With Us */}
            <div className="space-y-8 text-center lg:text-left">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 inline-block">Connect With Us</h3>
                <p className="text-slate-400 text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Stay updated with the latest developments in coal research, sustainable mining practices, and technological innovations.
                </p>
              </div>

              <div className="flex gap-6 justify-center lg:justify-start">
                <a href="https://www.youtube.com/@coalministry3323" target="_blank" rel="noopener noreferrer" className="group relative">
                  <div className="absolute inset-0 bg-red-600 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-slate-900 border border-slate-700 hover:border-red-500 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 transition-all duration-300 group-hover:-translate-y-1">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                </a>

                <a href="https://x.com/CoalMinistry" target="_blank" rel="noopener noreferrer" className="group relative">
                  <div className="absolute inset-0 bg-white rounded-full blur opacity-20 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-slate-900 border border-slate-700 hover:border-white rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all duration-300 group-hover:-translate-y-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                </a>

                <a href="https://linktr.ee/ministryofcoal" target="_blank" rel="noopener noreferrer" className="group relative">
                  <div className="absolute inset-0 bg-green-500 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="relative w-14 h-14 bg-slate-900 border border-slate-700 hover:border-green-500 rounded-full flex items-center justify-center text-slate-300 hover:text-green-500 transition-all duration-300 group-hover:-translate-y-1">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.953 15.066c-.08.163-.08.324-.08.486.001.162.08.325.161.486.24.408.645.652 1.084.652.44 0 .845-.244 1.084-.652.08-.161.16-.324.16-.486 0-.162-.08-.323-.16-.486-.239-.408-.644-.652-1.084-.652-.439 0-.844.244-1.084.652l-.081-.001zm8.094 0c-.08.163-.08.324-.08.486.001.162.08.325.161.486.24.408.645.652 1.084.652.44 0 .845-.244 1.084-.652.08-.161.16-.324.16-.486 0-.162-.08-.323-.16-.486-.239-.408-.644-.652-1.084-.652-.439 0-.844.244-1.084.652l-.081-.001zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 6l-3.5 3.5L8.5 8 12 4.5 15.5 8zM8.5 16L12 12.5l3.5 3.5L12 19.5 8.5 16z" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>

            {/* Right: Twitter Profile Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden hover:border-slate-600 transition-colors duration-300">
                {/* Header with Follow Button */}
                <div className="bg-slate-950/50 p-5 flex items-center gap-4 border-b border-slate-800">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/32px-Flag_of_India.svg.png"
                    alt="India Flag"
                    className="w-12 h-12 rounded-lg shadow-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">Ministry of Coal</h3>
                    <p className="text-sm text-blue-400">@CoalMinistry</p>
                  </div>
                  <a
                    href="https://x.com/CoalMinistry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-slate-900 hover:bg-blue-50 px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
                  >
                    Follow
                  </a>
                </div>

                {/* Profile Content */}
                <div className="p-6">
                  <p className="text-slate-300 text-sm mb-4 leading-relaxed font-medium">
                    Latest updates on sustainable coal research and clean energy initiatives.
                    Building a greener future for India. 🇮🇳
                  </p>

                  <div className="text-xs text-slate-400 space-y-2 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">📍</span>
                      <span className="font-medium">New Delhi, India</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
                      </svg>
                      <a href="https://www.coal.nic.in" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">
                        coal.nic.in
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-6 text-xs mb-6 border-t border-slate-800 pt-4">
                    <span className="text-slate-400 font-medium">
                      <span className="font-bold text-white text-sm">52</span> Following
                    </span>
                    <span className="text-slate-400 font-medium">
                      <span className="font-bold text-white text-sm">364.5K</span> Followers
                    </span>
                  </div>

                  {/* Image Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <img
                      src="/images/gallery1.jpeg"
                      alt="Ministry Activity"
                      className="w-full h-20 object-cover rounded-lg border border-slate-800 hover:opacity-80 transition-opacity cursor-pointer"
                    />
                    <img
                      src="/images/gallery2.jpeg"
                      alt="Ministry Activity"
                      className="w-full h-20 object-cover rounded-lg border border-slate-800 hover:opacity-80 transition-opacity cursor-pointer"
                    />
                    <img
                      src="/images/gallery3.jpeg"
                      alt="Ministry Activity"
                      className="w-full h-20 object-cover rounded-lg border border-slate-800 hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="relative z-10 py-8 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-slate-500 font-medium">
            © 2025 NaCCER. All rights reserved.
          </div>
          <div className="text-sm text-slate-500 font-medium flex items-center gap-2">
            Developed by <span className="text-white font-bold">Team ByteSpace</span>
            <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs border border-blue-900/50">SIH 2025</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
