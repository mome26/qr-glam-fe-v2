import { useNavigate } from 'react-router-dom';

export default function CapturePhotos() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-background flex flex-col relative text-foreground">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 bg-black/40 absolute top-0 inset-x-0 z-10 backdrop-blur-sm">
         <div className="text-sm font-medium">Tech Conference 2026</div>
         <button 
           onClick={() => navigate(-1)}
           className="bg-white text-black px-4 py-1.5 rounded-sm text-sm font-semibold hover:bg-accent transition-colors"
         >
           Exit
         </button>
      </div>

      {/* Main View Area (Camera Feed Placeholder) */}
      <div className="flex-1 flex items-center justify-center text-muted font-medium">
         [ Live Camera Feed Placeholder ]
      </div>

      {/* Bottom Controls */}
      <div className="h-40 bg-black flex flex-col items-center justify-center relative">
         <div className="absolute top-[-24px] bg-card text-foreground px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg border border-border">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            Target: Guest QR #4812
         </div>

         <div className="flex items-center justify-between w-full px-12">
            <div className="w-12 h-12 rounded-full bg-accent"></div>
            
            {/* Shutter Button */}
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform hover:bg-white/10">
               <div className="w-[68px] h-[68px] rounded-full bg-white"></div>
            </div>

            <div className="w-12 h-12 rounded-full bg-accent"></div>
         </div>
      </div>
    </div>
  );
}
