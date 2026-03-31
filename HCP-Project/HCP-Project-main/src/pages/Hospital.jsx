import React, { useState, useMemo, useEffect } from "react";
import { MapPin, Users, Award, Heart, Phone, Navigation } from "lucide-react";
import { CiMedicalCase } from "react-icons/ci";
import "../styles/hospital.css";

// 3. Fix distance calculation: Use Haversine formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180) *
    Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(2);
}

function Hospital() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [hospitals, setHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const getHospitals = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      // 4. Store user location correctly
      const lat = parseFloat(pos.coords.latitude);
      const lng = parseFloat(pos.coords.longitude);
      setUserLocation({ lat, lng });

      console.log("USER LOCATION:", lat, lng); // 🔥 CHECK THIS

      try {
        console.log("Sending:", lat, lng);

        const API_URL = import.meta.env.VITE_NODE_API_URL;
        const res = await fetch(`${API_URL}/hospitals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 1. Ensure correct latitude and longitude usage
          body: JSON.stringify({ latitude: lat, longitude: lng })
        });
        const data = await res.json();
        
        const mappedData = data.map(h => {
          const hLat = parseFloat(h.lat);
          const hLon = parseFloat(h.lon);
          // 6. Add debugging
          console.log(`Hospital: ${h.name || "Unknown"} ->`, { lat: hLat, lon: hLon });

          return {
            ...h,
            lat: hLat,
            lon: hLon,
            rating: (Math.random() * (5 - 4) + 4).toFixed(1),
            reviews: Math.floor(Math.random() * 300) + 50,
            beds: Math.floor(Math.random() * 500) + 50,
            specialties: [h.type],
            location: h.address.split(",").slice(-2)[0]?.trim() || "Local Area",
            ambulance: Math.random() > 0.5,
            image: "🏥",
            phone: "(555) " + Math.floor(100 + Math.random() * 900) + "-" + Math.floor(1000 + Math.random() * 9000),
            distance: parseFloat(getDistance(lat, lng, hLat, hLon)) // Store distance for sorting UI 
          };
        })
        .filter(h => h.distance <= 10) // 5. Filter nearby hospitals: Only show within 10 km radius
        .sort((a, b) => a.distance - b.distance); 
        
        setHospitals(mappedData);
      } catch (err) {
        console.error("Failed to fetch hospitals:", err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("Geolocation error:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    getHospitals();
  }, []);

  // Get unique locations
  const locations = ["All Locations", ...new Set(hospitals.map((h) => h.location))];

  // Filter hospitals based on location and search
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      const matchesLocation =
        selectedLocation === "" ||
        selectedLocation === "All Locations" ||
        hospital.location === selectedLocation;

      const matchesSearch =
        searchTerm === "" ||
        hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.specialties.some((s) =>
          s.toLowerCase().includes(searchTerm.toLowerCase())
        );

      return matchesLocation && matchesSearch;
    });
  }, [hospitals, selectedLocation, searchTerm]);

  return (
    <div className="hospital-container">
      {/* Header */}
      <div className="hospital-header">
        <h1>Find Hospitals Near You</h1>
        <p>Discover top-rated hospitals and medical centers in your area</p>
      </div>

      {/* Search & Filter Section */}
      <div className="search-filter-box">
        <div className="search-filter-grid">
          {/* Search by Name/Specialty */}
          <div>
            <label>🔍 Search Hospital or Specialty</label>
            <input
              type="text"
              placeholder="e.g., Cardiology, Heart Hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter by Location */}
          <div>
            <label>📍 Filter by Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map((location) => (
                <option key={location} value={location === "All Locations" ? "" : location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-count">
          <p>
            {loading ? "Searching nearby area..." : `Found ${filteredHospitals.length} hospital(s) within 10 km`}
          </p>
        </div>
      </div>

      {/* Hospitals Grid */}
      {loading ? (
        <div className="no-results" style={{ padding: "40px" }}>
          <h2>Locating nearby hospitals...</h2>
          <p>Please allow location access if prompted.</p>
        </div>
      ) : filteredHospitals.length > 0 ? (
        <div className="hospitals-grid">
          {filteredHospitals.map((hospital) => (
            <div key={hospital.id} className="hospital-card">
              {/* Card Header with Gradient */}
              <div className="hospital-card-header">
                <div className="hospital-card-icon">{hospital.image}</div>
                <div className="hospital-card-rating">
                  <div className="hospital-card-rating-score">
                    ⭐ {hospital.rating}
                  </div>
                  <div className="hospital-card-rating-count">
                    ({hospital.reviews} reviews)
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="hospital-card-body">
                {/* Hospital Name */}
                <h3 className="hospital-name">{hospital.name}</h3>

                {/* Location */}
                <div className="location-info">
                  <MapPin className="location-icon" size={20} />
                  <div className="location-details">
                    <p style={{ color: '#3498db', fontWeight: 'bold' }}>
                      {userLocation ? `${hospital.distance} km away` : hospital.location}
                    </p>
                    <p>{hospital.address}</p>
                  </div>
                </div>

                {/* Hospital Stats */}
                <div className="hospital-stats">
                  <div className="stat-item">
                    <CiMedicalCase className="stat-icon" size={20} />
                    <div className="stat-content">
                      <div className="stat-label">Medical</div>
                      <div className="stat-label">Emergency: {hospital.emergency}</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Users className="stat-icon" size={20} />
                    <div className="stat-content">
                      <div className="stat-label">Beds</div>
                      <div className="stat-value">{hospital.beds}</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Heart className="stat-icon" size={20} />
                    <div className="stat-content">
                      <div className="stat-label">Ambulance</div>
                      <div className="stat-value">
                        {hospital.ambulance ? "✓ Yes" : "✗ No"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="specialties-section">
                  <span className="specialties-label">Specialties</span>
                  <div className="specialties-tags">
                    {hospital.specialties.map((specialty, idx) => (
                      <span key={idx} className="specialty-tag">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <a href={`tel:${hospital.phone}`} className="btn btn-call">
                    <Phone size={16} />
                    Call
                  </a>
                  {/* 2. Fix Google Maps link */}
                  <button className="btn btn-directions" onClick={() => {
                    console.log(`Opening map for ${hospital.name} at q=${hospital.lat},${hospital.lon}`);
                    window.open(`https://www.google.com/maps?q=${hospital.lat},${hospital.lon}`);
                  }}>
                    <Navigation size={16} />
                    Directions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* No Results */
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h2>No hospitals found within 10 km</h2>
          <p>Try adjusting your search or ensuring your location is correct.</p>
        </div>
      )}
    </div>
  );
}

export default Hospital;
