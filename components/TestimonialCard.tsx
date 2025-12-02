interface TestimonialCardProps {
  quote: string;
  name: string;
  title: string;
  avatar: string;
  avatarBg: string;
}

export default function TestimonialCard({ quote, name, title, avatar, avatarBg }: TestimonialCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-lg p-4 sm:p-6 border border-blue-200/50 shadow-lg hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500 w-[220px] sm:w-[260px] lg:w-[320px]">
      <p className="text-neutral-700 mb-6">
        "{quote}"
      </p>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 ${avatarBg} rounded-full flex items-center justify-center text-white font-bold`}>
          {avatar}
        </div>
        <div>
          <p className="text-neutral-900 font-semibold">{name}</p>
          <p className="text-primary-600 text-sm">{title}</p>
        </div>
      </div>
    </div>
  );
} 