function googleSuccess() {

    // Declare global variables.
    var map,
        markers = [],
        infoWindow = new google.maps.InfoWindow();

    // Initialize Google Map.
    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            // center: (not needed as I am using map.fitBounds(bounds) to center the map.)
            zoom: 0,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeId: google.maps.MapTypeId.TERRAIN,
            draggable: false,
            scrollwheel: false
        });
        console.log("initMap");
    }

    var bounds = new google.maps.LatLngBounds();

    // Array of national parks
    var locations = [{
        name: "Yosemite National Park",
        lat: 37.865101,
        lng: -119.538329,
        url: "https://www.nps.gov/yose/index.htm"
    }, {
        name: "Joshua Tree National Park",
        lat: 33.873415,
        lng: -115.900992,
        url: "https://www.nps.gov/jotr/index.htm"
    }, {
        name: "Grand Canyon National Park",
        lat: 36.106965,
        lng: -112.112997,
        url: "https://www.nps.gov/grca/index.htm"
    }, {
        name: "Zion National Park",
        lat: 37.298202,
        lng: -113.026300,
        url: "https://www.nps.gov/zion/index.htm"
    }, {
        name: "Bryce Canyon National Park",
        lat: 37.593038,
        lng: -112.187090,
        url: "https://www.nps.gov/brca/index.htm"
    }, {
        name: "Death Valley National Park",
        lat: 36.505389,
        lng: -117.079408,
        url: "https://www.nps.gov/deva/index.htm"
    }, {
        name: "Mesa Verde National Park",
        lat: 37.18,
        lng: -108.49,
        url: "https://www.nps.gov/meve/index.htm"
    }, {
        name: "Sequoia National Park",
        lat: 36.43,
        lng: -118.68,
        url: "https://www.nps.gov/seki/index.htm"
    }, {
        name: "Kings Canyon National Park",
        lat: 36.80,
        lng: -118.55,
        url: "https://www.nps.gov/seki/index.htm"
    }, {
        name: "Arches National Park",
        lat: 38.68,
        lng: -109.57,
        url: "https://www.nps.gov/arch/index.htm"
    }, {
        name: "Canyonlands National Park",
        lat: 38.20,
        lng: -109.93,
        url: "https://www.nps.gov/cany/index.htm"
    }];

    // Constructor function for creating a park.
    var Park = function(loc) {
        this.name = ko.observable(loc.name);
        this.lat = ko.observable(loc.lat);
        this.lng = ko.observable(loc.lng);
        this.url = ko.observable(loc.url);
    };

    var ViewModel = function() {

        var self = this;
        // Takes in 'locations' array and creates new 'Park' object for each item in array
        // and pushes the result of the function to a new array.
        var park = ko.utils.arrayMap(locations, function(loc) {
            return new Park(loc);
        });

        // Takes in 'park' data to create an observableArray which will be used by 'self.markerData'.
        self.parks = ko.observableArray(park);

        // Create a 'ko.computed' to use 'ko.utils.arrayForEach' to iterate through 'self.parks'
        // Creates marker for each park. Adds each parks 'infoWindow', 'infoWindow' content,
        // and performs api calls and triggers marker animation on marker click.
        // Pushes each 'marker' into global 'markers' array.
        self.markerData = ko.computed(function() {
            ko.utils.arrayForEach(self.parks(), function(park) {
                // Declare 'marker' variable.
                var marker = new google.maps.Marker({
                    map: map,
                    position: new google.maps.LatLng(park.lat(), park.lng()),
                    title: park.name(),
                    animation: google.maps.Animation.DROP
                });

                // Adds 'marker' property to each park item.
                park.marker = marker;
                // Pushes 'marker' to 'markers' array.
                markers.push(marker);

                // Sets headerString content
                var headerString = '<div class="iw-header"><h1>' + park.name() + '</></div>';

                // Declare Wikipedia variable to store article info
                var wikiInfo;
                // Sets up 'url' request string to get Wikipedia info about national park based on name of park
                var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + park.name() + '&limit=1&format=json&callback=wikiCallback';
                // wikiInfo error handler if no response from server
                var wikiTimeout = setTimeout(function() {
                    wikiInfo = "Woops! A Wikipedia intro should be displaying here. Please try again later.";
                }, 2000);
                // Wikipedia AJAX request
                $.ajax({
                    url: wikiUrl,
                    dataType: "jsonp",
                    success: function(response) {
                        var articleList = response[1, 2];
                        for (var i = 0; i < articleList.length; i++) {
                            articleStr = articleList[i];
                            wikiInfo = '<div class="wikiArticle"><p>' + articleStr + '</p></div>' + '<p>Attribution: <a href="http://en.wikipedia.org/wiki/' + park.name() + '">Wikipedia page about ' + park.name() + '</a></p><div><a href="' + park.url() + '">Official U.S. National Parks Service Website</a>';
                        }
                        // Clears timer for oWeather error handler on succesful response
                        clearTimeout(wikiTimeout);
                    }
                });

                // Declare OpenWeatherMap variable for weather info
                var oWeather;
                // oWeather error handler if no response from server
                var oWeatherTimeout = setTimeout(function() {
                    oWeather = '<div><p>Weather is not available at this time. Please try again later.</p></div>';
                }, 2000);
                // Sets up 'url' request string for weather info based on latitude and longitude of park
                var data_url = 'http://api.openweathermap.org/data/2.5/weather?lat=' + park.lat() + '&lon=' + park.lng() + '&units=imperial&APPID=59e7425515b49d16b19c1a9484c32c71';
                // OpenWeatherMap AJAX request
                $.ajax({
                    url: data_url,
                    dataType: "jsonp",
                    success: function(data) {
                        // Holds weather code for park
                        var oWcode = data.weather[0].icon;
                        // Gets icon for weather code
                        var oWcond = 'http://openweathermap.org/img/w/' + oWcode + '.png';
                        var weatherHtml = '<div id="owm"><span><img src="' + oWcond + '" alt="weather-icon" /></span><p>It is currently ' + data.main.temp.toFixed(1) + '&#8457; with ' + data.weather[0].description + ' overhead.</p></div>';
                        oWeather = weatherHtml;
                        // Clears timer for oWeather error handler on succesful response
                        clearTimeout(oWeatherTimeout);
                    }
                });

                // Listener for 'click' on marker sets content and opens the 'infoWindow',
                // animates marker and centers map on marker
                google.maps.event.addListener(marker, 'click', (function(marker, park) {
                    return function() {
                        infoWindow.setContent('<div id="info-window">' + headerString + wikiInfo + oWeather + '</div>' + '<div class="iw-bottom-gradient"></div>');
                        infoWindow.open(map, marker);
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(function() {
                            marker.setAnimation(null);
                        }, 1430);
                        map.setCenter(marker.getPosition());
                    };
                })(marker, park));

                // Gets position for every marker in 'markers' array.
                for (var i = 0; i < markers.length; i++) {
                    bounds.extend(markers[i].getPosition());
                }
                // Makes all 'markers' fit within map bounds.
                map.fitBounds(bounds);

                // Listener to recenter map on all 'markers' on 'infoWindow' close.
                google.maps.event.addListener(infoWindow, 'closeclick', function() {
                    map.fitBounds(bounds);
                });

            }, this);
        });

        // 'ko.observable' for each park name list item.
        self.listName = ko.observable(self.parks().park);
        //  Show infoWindow of marker on 'listName' item click
        self.markerSelect = function(parkName) {
            self.listName(parkName);
            google.maps.event.trigger(parkName.marker, 'click');
        };

        // Found this on a Stack Overflow discussion:
        // Removing Map Pin with Search
        //https://stackoverflow.com/questions/29557938/removing-map-pin-with-search
        //At first I could only filter my list of parks from the list. This was very helpful.

        self.query = ko.observable("");
        // 'ko.computed' function to filter items.
        self.filteredItems = ko.computed(function () {
            // Close 'infoWindow' if one is open when filtering.
            infoWindow.close();
            var search = self.query().toLowerCase();
            return ko.utils.arrayFilter(self.parks(), function (park) {
                var match = park.name().toLowerCase().indexOf(search) >= 0;
                // Use Google Maps '.setVisible' method to show and hide markers.
                park.marker.setVisible(match);
                return match;
            });
        });
    };

    initMap();
    ko.applyBindings(new ViewModel());
}

function googleError() {
    swal({
        title: "Oops!",
        text: "Google Maps is not availabe at this time. Please check your internet connection and/or try again later.",
        type: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#81AE9A"
    });
}