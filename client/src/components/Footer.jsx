export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white">
      {/* Social Media Section */}
      <div className="border-b border-slate-700 py-8">
        <div className="max-w-[95%] mx-auto px-2">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left: Connect With Us */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-3">Connect With Us</h3>
              <p className="text-slate-300 mb-6">Stay updated with the latest developments in coal research and sustainable mining practices</p>
              
              <div className="flex gap-6">
                <a href="https://www.youtube.com/@coalministry3323" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 transform">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                
                <a href="https://x.com/CoalMinistry" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-white hover:bg-gray-200 rounded-full flex items-center justify-center text-black transition-all hover:scale-110 transform">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                <a href="https://linktr.ee/ministryofcoal" target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 transform">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.953 15.066c-.08.163-.08.324-.08.486.001.162.08.325.161.486.24.408.645.652 1.084.652.44 0 .845-.244 1.084-.652.08-.161.16-.324.16-.486 0-.162-.08-.323-.16-.486-.239-.408-.644-.652-1.084-.652-.439 0-.844.244-1.084.652l-.081-.001zm8.094 0c-.08.163-.08.324-.08.486.001.162.08.325.161.486.24.408.645.652 1.084.652.44 0 .845-.244 1.084-.652.08-.161.16-.324.16-.486 0-.162-.08-.323-.16-.486-.239-.408-.644-.652-1.084-.652-.439 0-.844.244-1.084.652l-.081-.001zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 6l-3.5 3.5L8.5 8 12 4.5 15.5 8zM8.5 16L12 12.5l3.5 3.5L12 19.5 8.5 16z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Right: Twitter Profile Card */}
            <div className="flex justify-center lg:justify-end">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
              {/* Header with Follow Button */}
              <div className="bg-black text-white p-4 flex items-center gap-3">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/32px-Flag_of_India.svg.png" 
                  alt="India Flag" 
                  className="w-12 h-12 rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-base">Ministry of Coal</h3>
                  <p className="text-sm text-gray-300">@CoalMinistry</p>
                </div>
                <a 
                  href="https://x.com/CoalMinistry" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-full text-sm font-semibold transition-colors"
                >
                  Follow
                </a>
              </div>

              {/* Profile Content */}
              <div className="p-4 bg-white">
                <p className="text-black text-sm mb-3 leading-relaxed font-medium">
                  Latest updates on sustainable coal research and clean energy initiatives. 
                  Building a greener future for India. 🇮🇳
                </p>
                
                <div className="text-xs text-black space-y-2 mb-3">
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span className="font-medium text-black">New Delhi, India</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"/>
                    </svg>
                    <a href="https://www.coal.nic.in" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      coal.nic.in
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 text-xs mb-4">
                  <span className="text-black font-medium">
                    <span className="font-bold text-black">52</span> Following
                  </span>
                  <span className="text-black font-medium">
                    <span className="font-bold text-black">364.5K</span> Followers
                  </span>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-3 gap-1">
                  <img 
                    src="/images/gallery1.jpeg" 
                    alt="Ministry Activity" 
                    className="w-full h-24 object-cover rounded"
                  />
                  <img 
                    src="/images/gallery2.jpeg" 
                    alt="Ministry Activity" 
                    className="w-full h-24 object-cover rounded"
                  />
                  <img 
                    src="/images/gallery3.jpeg" 
                    alt="Ministry Activity" 
                    className="w-full h-24 object-cover rounded"
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="py-4">
        <div className="text-center text-sm text-slate-300">
          Developed by Team ByteSpace | Smart India Hackathon 2025
        </div>
      </div>
    </footer>
  );
}
