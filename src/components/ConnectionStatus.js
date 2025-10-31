import { Car, Bike, Clock, Phone, Wifi, WifiOff, X, MapPin, Wrench, NotebookPen } from 'lucide-react';
const ConnectionStatus = () => {
  const { connectionStatus } = useWebSocket();
  const neumorphicShadow = "shadow-[5px_5px_10px_#b8bec9,_-5px_-5px_10px_#ffffff]";

  let statusContent;
  switch (connectionStatus) {
    case 'connected':
      statusContent = <div className="flex items-center text-green-600"><Wifi size={16} className="mr-2" /><span>Connected</span></div>;
      break;
    case 'connecting':
      statusContent = <div className="flex items-center text-yellow-600"><Clock size={16} className="mr-2 animate-spin" /><span>Connecting...</span></div>;
      break;
    default:
      statusContent = <div className="flex items-center text-red-600"><WifiOff size={16} className="mr-2" /><span>Disconnected</span></div>;
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-slate-200 px-4 py-2 rounded-full text-sm font-semibold z-20 ${neumorphicShadow}`}>
      {statusContent}
    </div>
  );
};