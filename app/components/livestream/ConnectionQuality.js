// components/livestream/ConnectionQuality.js
export function ConnectionQuality({ quality = 'good' }) {
    const qualities = {
      good: { bars: 3, color: 'bg-green-500' },
      fair: { bars: 2, color: 'bg-yellow-500' },
      poor: { bars: 1, color: 'bg-red-500' }
    };
  
    const { bars, color } = qualities[quality];
  
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`w-1 ${level <= bars ? color : 'bg-gray-300'}`}
            style={{ height: `${level * 3}px` }}
          />
        ))}
      </div>
    );
  }
