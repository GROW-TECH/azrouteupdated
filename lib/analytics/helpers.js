
// lib/analytics/helpers.js
export function calculateMetricTrend(current, previous) {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }
  
  export function aggregateStreamStats(streams) {
    return streams.reduce((acc, stream) => {
      acc.totalViews += stream.statistics.totalViews;
      acc.totalInteractions += stream.statistics.totalInteractions;
      acc.totalWatchTime += stream.statistics.totalWatchTime;
      acc.totalParticipants += stream.attendees.length;
      return acc;
    }, {
      totalViews: 0,
      totalInteractions: 0,
      totalWatchTime: 0,
      totalParticipants: 0
    });
  }
  
  export function calculateEngagementDistribution(streams) {
    const ranges = [
      { min: 0, max: 25, label: '0-25%' },
      { min: 25, max: 50, label: '25-50%' },
      { min: 50, max: 75, label: '50-75%' },
      { min: 75, max: 100, label: '75-100%' }
    ];
  
    const distribution = ranges.map(range => ({
      range: range.label,
      count: streams.filter(stream => 
        stream.engagement.score >= range.min && 
        stream.engagement.score < range.max
      ).length
    }));
  
    return distribution;
  }
