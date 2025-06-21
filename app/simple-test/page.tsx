import { LordIcon } from '@/components/ui/lordicon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple Lordicon Test
          </h1>
          <p className="text-slate-400">
            Testing basic animated icon functionality
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Test 1: Direct URL */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Test 1: Loading Icon</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-3">
              <LordIcon 
                src="https://cdn.lordicon.com/msoeawqm.json"
                size={48} 
                trigger="loop" 
                delay={2000}
                colors="primary:#10b981,secondary:#059669"
              />
              <p className="text-slate-400 text-xs text-center">Should loop every 2 seconds</p>
            </CardContent>
          </Card>

          {/* Test 2: Hover trigger */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Test 2: Hover Icon</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-3">
              <LordIcon 
                src="https://cdn.lordicon.com/qhgmphtg.json"
                size={48} 
                trigger="hover"
                colors="primary:#10b981,secondary:#059669"
              />
              <p className="text-slate-400 text-xs text-center">Hover to animate</p>
            </CardContent>
          </Card>

          {/* Test 3: Click trigger */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Test 3: Click Icon</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-3">
              <LordIcon 
                src="https://cdn.lordicon.com/lomfljuq.json"
                size={48} 
                trigger="click"
                colors="primary:#22c55e,secondary:#16a34a"
              />
              <p className="text-slate-400 text-xs text-center">Click to animate</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm">
            If you see animated icons above, the integration is working! 🎉
            <br />
            If you see gray placeholders, there might be URL or loading issues.
          </p>
        </div>
      </div>
    </div>
  );
} 