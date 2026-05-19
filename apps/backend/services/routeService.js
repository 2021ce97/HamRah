const axios = require('axios');

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

/**
 * Calculates routing directions using Mapbox Directions API.
 * Fallbacks to mock straight-line geometry if Mapbox token is missing.
 * @param {object} start { lng, lat }
 * @param {object} end { lng, lat }
 * @returns {object} route information including distance, duration, and geojson geometry.
 */
exports.getDirections = async (start, end) => {
  if (MAPBOX_ACCESS_TOKEN) {
    try {
      const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;
      
      const response = await axios.get(url);
      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          success: true,
          provider: 'mapbox',
          distance: route.distance, // meters
          duration: route.duration, // seconds
          geometry: route.geometry,  // GeoJSON
        };
      }
      throw new Error('No routes found in Mapbox response');
    } catch (error) {
      console.error('[Mapbox Directions Error] API Call failed:', error.message);
      throw new Error(`Mapbox Directions API failed: ${error.message}`);
    }
  } else {
    // Mock Fallback
    console.log('[RouteService] Mapbox token missing. Using mock straight-line routing.');
    // Generate simple straight line geometry between start and end
    const mockGeometry = {
      type: 'LineString',
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat]
      ]
    };
    
    // Calculate simple distance estimate in meters (Haversine estimation fallback)
    const R = 6371e3; // Earth radius in meters
    const phi1 = start.lat * Math.PI / 180;
    const phi2 = end.lat * Math.PI / 180;
    const deltaPhi = (end.lat - start.lat) * Math.PI / 180;
    const deltaLambda = (end.lng - start.lng) * Math.PI / 180;
    
    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; 
    
    // Assume average speed 30km/h (8.3 m/s) in Kabul
    const duration = distance / 8.3;

    return {
      success: true,
      provider: 'mock',
      distance: Math.round(distance),
      duration: Math.round(duration),
      geometry: mockGeometry
    };
  }
};
