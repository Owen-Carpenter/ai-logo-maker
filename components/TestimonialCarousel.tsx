import TestimonialCard from './TestimonialCard';

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  title: string;
  avatar: string;
  avatarBg: string;
  avatarImage?: string;
  company?: string;
  verified?: boolean;
  rating?: number;
}

const topRowTestimonials: Testimonial[] = [
  {
    id: '1',
    quote: "AI Logo Builder completely transformed our branding workflow. We generated our entire logo suite in under an hour - something that would have taken weeks with traditional designers. The quality is outstanding and our clients love the results.",
    name: "David Richardson",
    title: "Lead Designer",
    company: "TechFlow Studios",
    avatar: "DR",
    avatarBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    avatarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
    verified: true,
    rating: 5
  },
  {
    id: '2',
    quote: "This is hands down the best AI design tool I've used. The iterative improvement feature is incredible - I can refine logos in real-time just by describing changes. It's like having a professional designer who perfectly understands my vision.",
    name: "TechFlow Studios",
    title: "Design Agency",
    company: "San Francisco, CA",
    avatar: "TF",
    avatarBg: "bg-white",
    avatarImage: "/logos/logoipsum-280.svg",
    verified: true,
    rating: 5
  },
  {
    id: '3',
    quote: "We use AI Logo Builder for all our client projects now. The PNG exports are pristine, the turnaround is instant, and the AI consistently delivers professional-grade results. ROI has been phenomenal - we've saved over $50K in design costs this year alone.",
    name: "Michael Torres",
    title: "Founder & CEO",
    company: "StartupLaunch",
    avatar: "MT",
    avatarBg: "bg-gradient-to-br from-cyan-500 to-blue-600",
    avatarImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
    verified: true,
    rating: 5
  },
  {
    id: '4',
    quote: "As a freelancer, this tool is a game-changer. I can deliver multiple logo concepts to clients in minutes, not days. The library feature keeps all my work organized, and clients are consistently impressed with the quality. My productivity has tripled.",
    name: "Jennifer Parker",
    title: "Senior Brand Designer",
    company: "Independent",
    avatar: "JP",
    avatarBg: "bg-gradient-to-br from-emerald-500 to-green-600",
    avatarImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
    verified: true,
    rating: 5
  },
  {
    id: '5',
    quote: "The conversational interface is brilliant. I describe what I want, the AI shows its reasoning, then creates exactly what I envisioned. No more back-and-forth revisions. It's like having a mind-reading designer on my team 24/7.",
    name: "CloudVault",
    title: "SaaS Platform",
    company: "Austin, TX",
    avatar: "CV",
    avatarBg: "bg-white",
    avatarImage: "/logos/logoipsum-381.svg",
    verified: true,
    rating: 5
  }
];

const bottomRowTestimonials: Testimonial[] = [
  {
    id: '6',
    quote: "We needed a complete icon set for our mobile app - 18 unique icons in total. With AI Logo Builder, we had everything designed, refined, and export-ready in 2 hours. Traditional design would've taken 2 weeks minimum. Absolutely incredible.",
    name: "Alex Martinez",
    title: "Head of Product",
    company: "CloudSync",
    avatar: "AM",
    avatarBg: "bg-gradient-to-br from-red-500 to-rose-600",
    avatarImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces",
    verified: true,
    rating: 5
  },
  {
    id: '7',
    quote: "The multi-style generation is a killer feature. I show clients the same logo in 4 different styles instantly. They're always blown away by the variety and quality. This tool has legitimately transformed how we present to clients.",
    name: "Kyle Anderson",
    title: "Brand Consultant",
    company: "BrandForge",
    avatar: "KA",
    avatarBg: "bg-gradient-to-br from-indigo-500 to-purple-600",
    avatarImage: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=faces",
    verified: true,
    rating: 5
  },
  {
    id: '8',
    quote: "I was skeptical about AI design tools until I tried this. The attention to detail, the design reasoning, the iteration speed - it's all exceptional. We've integrated it into our entire design workflow and couldn't be happier with the results.",
    name: "BrandForge",
    title: "Marketing Agency",
    company: "New York, NY",
    avatar: "BF",
    avatarBg: "bg-white",
    avatarImage: "/logos/logoipsum-413.svg",
    verified: true,
    rating: 5
  },
  {
    id: '9',
    quote: "The export quality is perfect every time - crisp PNGs with transparent backgrounds. No cleanup needed, no file conversion headaches. Just professional-grade assets ready to use immediately. This alone is worth the subscription.",
    name: "Emma Watson",
    title: "Lead UI Designer",
    company: "WebFlow Pro",
    avatar: "EW",
    avatarBg: "bg-gradient-to-br from-fuchsia-500 to-pink-600",
    avatarImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces",
    verified: true,
    rating: 5
  },
  {
    id: '10',
    quote: "My entire creative team now uses AI Logo Builder exclusively. The natural language interface makes iteration effortless, and the results consistently exceed our expectations. Best design investment we've made this year, hands down.",
    name: "Pixel & Co",
    title: "Creative Studio",
    company: "Los Angeles, CA",
    avatar: "PC",
    avatarBg: "bg-white",
    avatarImage: "/logos/logoipsum-339.svg",
    verified: true,
    rating: 5
  }
];

export default function TestimonialCarousel() {
  return (
    <div className="space-y-8 overflow-hidden py-8">
      {/* Top Row - Moving Right to Left */}
      <div className="relative">
        {/* Left fade overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 lg:w-64 bg-gradient-to-r from-blue-100 via-blue-100/95 via-blue-50/80 via-blue-50/40 to-transparent z-10 pointer-events-none"></div>
        {/* Right fade overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 lg:w-64 bg-gradient-to-l from-blue-100 via-blue-100/95 via-blue-50/80 via-blue-50/40 to-transparent z-10 pointer-events-none"></div>
        <div className="flex animate-scroll-rtl hover:animate-pause">
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0">
            {topRowTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} {...testimonial} />
            ))}
          </div>
          
          {/* Duplicate for seamless loop */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {topRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate`} {...testimonial} />
            ))}
          </div>
          
          {/* Additional duplicate for better mobile experience */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {topRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate2`} {...testimonial} />
            ))}
          </div>
          
          {/* Fourth duplicate for ultra-smooth mobile experience */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {topRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate3`} {...testimonial} />
            ))}
          </div>
          
          {/* Fifth duplicate for mobile 400% distance */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {topRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate4`} {...testimonial} />
            ))}
          </div>
          
          {/* Sixth duplicate for mobile 400% distance */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {topRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate5`} {...testimonial} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row - Moving Left to Right */}
      <div className="relative">
        {/* Left fade overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-32 sm:w-48 lg:w-64 bg-gradient-to-r from-blue-50 via-blue-50/95 via-white/80 via-white/40 to-transparent z-10 pointer-events-none"></div>
        {/* Right fade overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-32 sm:w-48 lg:w-64 bg-gradient-to-l from-blue-50 via-blue-50/95 via-white/80 via-white/40 to-transparent z-10 pointer-events-none"></div>
        <div className="flex animate-scroll-ltr hover:animate-pause">
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0">
            {bottomRowTestimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} {...testimonial} />
            ))}
          </div>
          
          {/* Duplicate for seamless loop */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {bottomRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate`} {...testimonial} />
            ))}
          </div>
          
          {/* Additional duplicate for better mobile experience */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {bottomRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate2`} {...testimonial} />
            ))}
          </div>
          
          {/* Fourth duplicate for ultra-smooth mobile experience */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {bottomRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate3`} {...testimonial} />
            ))}
          </div>
          
          {/* Fifth duplicate for mobile 400% distance */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {bottomRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate4`} {...testimonial} />
            ))}
          </div>
          
          {/* Sixth duplicate for mobile 400% distance */}
          <div className="flex space-x-2 sm:space-x-3 lg:space-x-6 shrink-0 ml-2 sm:ml-3 lg:ml-6">
            {bottomRowTestimonials.map((testimonial) => (
              <TestimonialCard key={`${testimonial.id}-duplicate5`} {...testimonial} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 