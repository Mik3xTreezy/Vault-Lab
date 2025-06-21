import { LordIconExamples } from '@/components/ui/lordicon-examples';

export default function TestIconsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Lordicon Animated Icons Demo
          </h1>
          <p className="text-slate-400 text-lg">
            See how animated icons can make your application more professional and engaging
          </p>
        </div>
        
        <LordIconExamples />
        
        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm">
            Visit <a href="https://lordicon.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">lordicon.com</a> to explore thousands more animated icons
          </p>
        </div>
      </div>
    </div>
  );
} 