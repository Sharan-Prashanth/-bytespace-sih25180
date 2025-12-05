import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Footer() {
    const router = useRouter();

    // Smooth scroll to section handler
    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        
        // If we're on the home page, scroll directly
        if (router.pathname === '/') {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // If on another page, navigate to home with hash
            router.push(`/#${sectionId}`);
        }
    };

    return (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 font-sans shadow-[inset_0_10px_20px_-10px_rgba(0,0,0,0.5)]">
            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Main Content Grid - Combining sections to use space efficiently */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-4">
                    {/* Column 1: NaCCER & PRISM */}
                    <div className="space-y-2">
                        <h3 className="text-white font-bold text-xs uppercase tracking-wide mb-2">NaCCER & PRISM</h3>
                        <ul className="space-y-1 text-xs">
                            <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-blue-400 transition-colors cursor-pointer">About Ministry</a></li>
                            <li><a href="#services" onClick={(e) => scrollToSection(e, 'services')} className="hover:text-blue-400 transition-colors cursor-pointer">Our Services</a></li>
                            <li><a href="#research" onClick={(e) => scrollToSection(e, 'research')} className="hover:text-blue-400 transition-colors cursor-pointer">NaCCER Footprint</a></li>
                            <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard Access</Link></li>
                            <li><Link href="/login" className="hover:text-blue-400 transition-colors">Agent Login</Link></li>
                            <li><Link href="/register" className="hover:text-blue-400 transition-colors">New Registration</Link></li>
                        </ul>
                    </div>

                    {/* Column 2: Resources & Policies */}
                    <div className="space-y-2">
                        <h3 className="text-white font-bold text-xs uppercase tracking-wide mb-2">Resources</h3>
                        <ul className="space-y-1 text-xs">
                            <li><Link href="/faq" className="hover:text-blue-400 transition-colors">FAQ Section</Link></li>
                            <li><Link href="/guidelines" className="hover:text-blue-400 transition-colors">Submission Guidelines</Link></li>
                            <li><Link href="/templates" className="hover:text-blue-400 transition-colors">Proposal Templates</Link></li>
                            <li><Link href="/brochures" className="hover:text-blue-400 transition-colors">Brochures</Link></li>
                            <li><Link href="/help" className="hover:text-blue-400 transition-colors">Help Desk</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Company & Policies */}
                    <div className="space-y-2">
                        <h3 className="text-white font-bold text-xs uppercase tracking-wide mb-2">Company</h3>
                        <ul className="space-y-1 text-xs">
                            <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-blue-400 transition-colors cursor-pointer">Company Profile</a></li>
                            <li><Link href="/team" className="hover:text-blue-400 transition-colors">Our Team</Link></li>
                            <li><Link href="/careers" className="hover:text-blue-400 transition-colors">Careers</Link></li>
                            <li><Link href="/environmental-policy" className="hover:text-blue-400 transition-colors">Environmental Policy</Link></li>
                            <li><Link href="/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Terms and Conditions</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Social & Connect */}
                    <div className="space-y-2">
                        <h3 className="text-white font-bold text-xs uppercase tracking-wide mb-2">Connect</h3>
                        <ul className="space-y-1 text-xs">
                            <li><a href="https://twitter.com/CoalMinistry" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Twitter</a></li>
                            <li><a href="https://facebook.com/ministryofcoal" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Facebook</a></li>
                            <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Instagram</a></li>
                            <li><a href="https://linkedin.com/company/ministry-of-coal-india" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">LinkedIn</a></li>
                            <li><a href="https://coal.nic.in" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Official Website</a></li>
                        </ul>
                    </div>

                    {/* Column 5: Contact Info */}
                    <div className="space-y-2">
                        <h3 className="text-white font-bold text-xs uppercase tracking-wide mb-2">Contact</h3>
                        <div className="text-xs space-y-1">
                            <p className="text-slate-400">Ministry of Coal</p>
                            <p className="text-slate-400">Shastri Bhawan</p>
                            <p className="text-slate-400">New Delhi - 110001</p>
                            <a href="https://maps.google.com/?q=Shastri+Bhawan+New+Delhi" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block">View Map →</a>
                            <div className="pt-2 border-t border-slate-800 mt-2">
                                <p className="mb-1"><span className="text-slate-400">Phone:</span> <span className="font-semibold text-white">+91 11 2338 4498</span></p>
                                <p><span className="text-slate-400">Email:</span> <a href="mailto:support@naccer.gov.in" className="text-blue-400 hover:underline">support@naccer.gov.in</a></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="h-px w-full bg-slate-800 mb-3"></div>

                {/* Bottom Section: Logos and Credits */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex flex-wrap items-center gap-4 opacity-60 hover:opacity-100 transition-all duration-500">
                        <img src="/images/GOI%20logo.png" alt="Govt of India" className="h-9 object-contain brightness-0 invert" />
                        <img src="/images/CoalLog4.png" alt="Coal India" className="h-7 object-contain brightness-0 invert" />
                        <img src="/images/prism%20brand%20logo.png" alt="PRISM" className="h-7 object-contain brightness-0 invert" />
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] text-slate-500 italic">Use <span className="font-semibold text-slate-400">#NaCCER</span> hashtag</p>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Team ByteSpace | SIH 2025
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
