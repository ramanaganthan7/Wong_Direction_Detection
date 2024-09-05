let map, directionsService, directionsRenderer;
let currentPositionMarker, watchID;
let totalDistance = 0, distanceLeft = 0;
let currentLat, currentLng, routePolyline;
let statusSvg = document.getElementById('status-svg');
let totalDistanceElem = document.getElementById('total-distance');
let distanceLeftElem = document.getElementById('distance-left');

// Audio elements
const staticSound = document.getElementById('static-sound');
const movingSound = document.getElementById('moving-sound');
const wrongSound = document.getElementById('wrong-sound');

// Initialize map and autocomplete for input fields
function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 20.5937, lng: 78.9629 }, // Center of India
        zoom: 6,
    });
    
    directionsRenderer.setMap(map);

    // Autocomplete for "from" and "to" inputs
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const fromAutocomplete = new google.maps.places.Autocomplete(fromInput);
    const toAutocomplete = new google.maps.places.Autocomplete(toInput);

    document.getElementById('get-route').addEventListener('click', () => {
        calculateAndDisplayRoute(fromInput.value, toInput.value);
    });

    document.getElementById('current-location').addEventListener('click', useCurrentLocation);
}

// Use current location as "from" point
function useCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            const currentLocation = new google.maps.LatLng(currentLat, currentLng);
            document.getElementById('from').value = `${currentLat}, ${currentLng}`;
            map.setCenter(currentLocation);
            if (currentPositionMarker) currentPositionMarker.setMap(null);
            currentPositionMarker = new google.maps.Marker({
                position: currentLocation,
                map: map,
                title: "Current Location",
            });
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Calculate and display the route, and start live tracking
function calculateAndDisplayRoute(from, to) {
    directionsService.route(
        {
            origin: from,
            destination: to,
            travelMode: 'DRIVING',
        },
        (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
                const route = response.routes[0].legs[0];
                totalDistance = route.distance.value / 1000; // in kilometers
                distanceLeft = totalDistance;
                totalDistanceElem.innerText = totalDistance.toFixed(2) + ' km';
                distanceLeftElem.innerText = distanceLeft.toFixed(2) + ' km';
                
                // Start live tracking
                startLiveTracking(route);
            } else {
                alert('Directions request failed due to ' + status);
            }
        }
    );
}

// Start live tracking and continuously update location and route status
function startLiveTracking(route) {
    if (navigator.geolocation) {
        watchID = navigator.geolocation.watchPosition(position => {
            currentLat = position.coords.latitude;
            currentLng = position.coords.longitude;
            const currentLocation = new google.maps.LatLng(currentLat, currentLng);

            // Update marker position
            if (currentPositionMarker) {
                currentPositionMarker.setPosition(currentLocation);
            } else {
                currentPositionMarker = new google.maps.Marker({
                    position: currentLocation,
                    map: map,
                    title: "Current Position",
                });
            }

            // Check if user is on correct route
            const path = new google.maps.Polyline({
                path: route.steps.map(step => step.end_location),
                strokeOpacity: 0,
            });
            routePolyline = path;

            const onRoute = google.maps.geometry.poly.isLocationOnEdge(currentLocation, path, 0.001); // ~100m tolerance

            if (onRoute) {
                updateStatus('moving');
                distanceLeft -= 0.1; // Simulating moving distance decrement
                distanceLeftElem.innerText = distanceLeft.toFixed(2) + ' km';
                if (distanceLeft <= 0) stopLiveTracking();
            } else {
                updateStatus('wrong');
            }
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Update vehicle status based on movement
function updateStatus(status) {
    switch (status) {
        case 'static':
            statusSvg.src = 'static.svg';
            staticSound.play();
            movingSound.pause();
            wrongSound.pause();
            break;
        case 'moving':
            statusSvg.src = 'moving.svg';
            staticSound.pause();
            wrongSound.pause();
            movingSound.play();
            break;
        case 'wrong':
            statusSvg.src = 'wrong.svg';
            staticSound.pause();
            movingSound.pause();
            wrongSound.play();
            break;
    }
}

// Stop tracking once the destination is reached
function stopLiveTracking() {
    if (watchID) {
        navigator.geolocation.clearWatch(watchID);
    }
    updateStatus('static');
    alert('You have arrived at your destination.');
}

window.initMap = initMap;
