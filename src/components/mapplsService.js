// mapplsService.js
const MAPPLS_CONFIG = {
  client_id: "96dHZVzsAuueso7A3CYajjqyHQQhN8vZtyilN1_xm4pFsUugQD5f8mORTn2Sjwqxnk-2rkCkR4SJxqPYQTRG-Q==",
  client_secret: "lrFxI-iSEg-xGWX1ollcfHxdWlc_t78E3GSVZSZUx25bsD-tisf1FwrCwVWGLRV0R_2UAHNWrPq9SvkKjk_V5Jtk5pgLfDP_",
  token_url: "https://outpost.mappls.com/api/security/oauth/token",
  search_url: "https://atlas.mappls.com/api/places/search/json"
};

class MapplsService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshQueue = [];
  }

  // Generate OAuth token
  async generateToken() {
    try {
      console.log('Generating Mappls OAuth token...');
      
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');
      formData.append('client_id', MAPPLS_CONFIG.client_id);
      formData.append('client_secret', MAPPLS_CONFIG.client_secret);

      const response = await fetch(MAPPLS_CONFIG.token_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Token generation failed: ${response.status} ${response.statusText}`);
      }

      const tokenData = await response.json();
      console.log('Token generation successful:', tokenData);

      this.accessToken = tokenData.access_token;
      this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000);
      
      return tokenData;
    } catch (error) {
      console.error('Mappls token generation error:', error);
      throw error;
    }
  }

  // Check if token is valid
  isTokenValid() {
    return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000; // 1 minute buffer
  }

  // Get valid token (generate if needed)
  async getValidToken() {
    if (this.isTokenValid()) {
      return this.accessToken;
    }

    // If already refreshing, wait in queue
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      await this.generateToken();
      this.isRefreshing = false;
      
      // Resolve all queued requests
      this.refreshQueue.forEach(({ resolve }) => resolve(this.accessToken));
      this.refreshQueue = [];
      
      return this.accessToken;
    } catch (error) {
      this.isRefreshing = false;
      
      // Reject all queued requests
      this.refreshQueue.forEach(({ reject }) => reject(error));
      this.refreshQueue = [];
      
      throw error;
    }
  }

  // Search places using Autosuggest API
  async searchPlaces(query, location = null) {
    try {
      const token = await this.getValidToken();
      
      // Build search URL
      let searchUrl = `${MAPPLS_CONFIG.search_url}?query=${encodeURIComponent(query)}&region=IND`;
      
      // Add location bias if provided
      if (location && location.latitude && location.longitude) {
        searchUrl += `&location=${location.latitude},${location.longitude}`;
      }

      // Add Gujarat bounds filter
      searchUrl += `&filter=bounds:20.0,68.0;25.0,74.5`;

      console.log('Mappls search URL:', searchUrl);

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, regenerate and retry once
          console.log('Token expired, regenerating...');
          this.accessToken = null;
          return await this.searchPlaces(query, location);
        }
        throw new Error(`Search API failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Mappls search response:', data);
      
      return data;
    } catch (error) {
      console.error('Mappls search error:', error);
      throw error;
    }
  }

  // Reverse geocoding
  async reverseGeocode(lat, lng) {
    try {
      const token = await this.getValidToken();
      
      const response = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_CONFIG.client_id}/rev_geocode?lat=${lat}&lng=${lng}`,
        {
          headers: {
            'Authorization': `bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.results?.[0]?.formatted_address) {
          return data.results[0].formatted_address;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Mappls reverse geocode error:', error);
      return null;
    }
  }
}

// Create singleton instance
const mapplsService = new MapplsService();
export default mapplsService;