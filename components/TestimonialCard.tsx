interface TestimonialCardProps {
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

export default function TestimonialCard({ quote, name, title, avatar, avatarBg, avatarImage, company, verified = true, rating = 5 }: TestimonialCardProps) {
  return (
    <div className="bg-white border-2 border-neutral-200 rounded-xl p-4 sm:p-6 shadow-xl hover:shadow-2xl hover:border-primary-400 transition-all duration-500 w-[280px] sm:w-[320px] lg:w-[360px] relative">
      {/* Star Rating */}
      <div className="flex items-center mb-3">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-neutral-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      
      {/* Quote */}
      <p className="text-neutral-700 mb-6 text-sm leading-relaxed">
        "{quote}"
      </p>
      
      {/* Author Info */}
      <div className="flex items-center space-x-3 pt-4 border-t border-neutral-200">
        {avatarImage ? (
          avatarImage.endsWith('.svg') ? (
            <div className="w-12 h-12 rounded-full bg-white shadow-lg ring-2 ring-primary-200 flex items-center justify-center p-2">
              <img 
                src={avatarImage} 
                alt={name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <img 
              src={avatarImage} 
              alt={name}
              className="w-12 h-12 rounded-full object-cover shadow-lg ring-2 ring-primary-200"
            />
          )
        ) : (
          <div className={`w-12 h-12 ${avatarBg} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md`}>
          {avatar}
        </div>
        )}
        <div className="flex-1">
          <p className="text-neutral-900 font-bold text-sm">{name}</p>
          <p className="text-primary-600 text-xs font-semibold">{title}</p>
          {company && (
            <p className="text-neutral-500 text-xs">{company}</p>
          )}
        </div>
      </div>
    </div>
  );
} 