// page.js
import AuroraBackground from './Aurora';
import StarField from './StarField';

export default function Page() {
  return (
    <main className="relative min-h-screen">
      
      {/* 1. Fast, blurry Aurora Background */}
      <AuroraBackground speed={1.0} />
      
      {/* 2. Crisp, static Star Field */}
      <StarField density={0.001} />
      
      {/* 3. Your Content */}
      <div className="relative z-10 p-10 text-white">
        <h1 className="text-4xl font-bold">Glass Morphism</h1>
        <p>Your content here...</p>
      </div>

    </main>
  );
}